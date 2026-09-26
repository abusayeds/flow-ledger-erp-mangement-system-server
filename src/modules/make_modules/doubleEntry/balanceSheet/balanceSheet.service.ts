import httpStatus from "http-status";
import { Types } from "mongoose";
import AppError from "../../../../errors/AppError";
import queryBuilder from "../../../../builder/queryBuilder";
import { companyScope, creatorId as creatorIdUtil } from "../../account/account.utils";
import { AuthRequest } from "../../../../middlewares/auth";
import { ChartOfAccountModel } from "../../account/chartOfAccount/chartOfAccount.model";
import {
  getAccountSection,
  getAllAccountBalancesAsOf,
  getAccountBalance,
} from "../../account/ledger/ledger.service";
import { createYearEndCloseJournal } from "../../account/journal/journal.service";
import { OpeningBalanceModel } from "../../account/openingBalance/openingBalance.model";
import { TBalanceSheet, TBalanceSheetNote } from "../doubleEntry.types";
import { BalanceSheetModel } from "./balanceSheet.model";
import { BalanceSheetItemModel } from "./balanceSheetItem.model";
import { BalanceSheetNoteModel } from "./balanceSheetNote.model";
import { ComparativeBalanceSheetModel } from "./comparativeBalanceSheet.model";
import { formatBalanceSheetViewResponse } from "./balanceSheet.utils";
import { withBulkDeleteId, runBulkDelete, parseDeleteIdsFromParam } from "../../../../utils/bulkDelete";

const RETAINED_EARNINGS_CODE = "3200";

const getRetainedEarningsAccount = async (userId: string) =>
  ChartOfAccountModel.findOne({
    account_code: RETAINED_EARNINGS_CODE,
    ...companyScope(userId),
  });

const calculateNetIncome = async (userId: string, asOfDate: Date) => {
  const accounts = await ChartOfAccountModel.find({
    ...companyScope(userId),
    is_active: true,
    account_code: { $gte: "4000", $lte: "5999" },
  }).lean();

  let netIncome = 0;
  for (const account of accounts) {
    const balance = await getAccountBalance(userId, account._id!, { asOfDate });
    const code = parseInt(account.account_code, 10);
    if (code >= 4000 && code <= 4999) netIncome += balance;
    else if (code >= 5000 && code <= 5999) netIncome -= balance;
  }
  return netIncome;
};

const generateBalanceSheetDB = async (
  userId: string,
  creatorId: Types.ObjectId | undefined,
  balance_sheet_date: Date,
  financial_year: string
) => {
  const sheet = await BalanceSheetModel.create({
    user_id: new Types.ObjectId(userId),
    creator_id: creatorId,
    balance_sheet_date,
    financial_year,
    status: "draft",
    total_assets: 0,
    total_liabilities: 0,
    total_equity: 0,
    is_balanced: false,
  });

  const accounts = await getAllAccountBalancesAsOf(userId, balance_sheet_date);
  const netIncome = await calculateNetIncome(userId, balance_sheet_date);
  const retained = await getRetainedEarningsAccount(userId);
  const retainedId = retained?._id?.toString();

  let totalAssets = 0;
  let totalLiabilities = 0;
  let totalEquity = 0;

  for (const account of accounts) {
    if (Math.abs(account.current_balance) <= 0.01) continue;
    const section = getAccountSection(account.account_code);
    if (section.section_type === "other") continue;
    if (retainedId && account._id.toString() === retainedId) continue;

    await BalanceSheetItemModel.create({
      user_id: new Types.ObjectId(userId),
      creator_id: creatorId,
      balance_sheet_id: sheet._id,
      account_id: account._id,
      section_type: section.section_type,
      sub_section: section.sub_section,
      amount: account.current_balance,
    });

    if (section.section_type === "assets") totalAssets += account.current_balance;
    else if (section.section_type === "liabilities") totalLiabilities += account.current_balance;
    else if (section.section_type === "equity") totalEquity += account.current_balance;
  }

  if (retained) {
    const reBalance =
      (accounts.find((a) => a._id.toString() === retainedId)?.current_balance ?? 0) + netIncome;
    if (Math.abs(reBalance) > 0.01) {
      await BalanceSheetItemModel.create({
        user_id: new Types.ObjectId(userId),
        creator_id: creatorId,
        balance_sheet_id: sheet._id,
        account_id: retained._id,
        section_type: "equity",
        sub_section: "equity",
        amount: reBalance,
      });
      totalEquity += reBalance;
    }
  }

  const is_balanced = Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01;
  sheet.total_assets = totalAssets;
  sheet.total_liabilities = totalLiabilities;
  sheet.total_equity = totalEquity;
  sheet.is_balanced = is_balanced;
  await sheet.save();

  return sheet;
};

const getAllDB = async (userId: string, query: Record<string, unknown>) => {
  const base = BalanceSheetModel.find({ ...companyScope(userId), isDeleted: false });
  const build = new queryBuilder(base, query)
    .filter()
    .sort()
    .fields();
  const { totalData } = await build.paginate(
    BalanceSheetModel.find({ ...companyScope(userId), isDeleted: false })
  );
  const rows = await build.modelQuery.exec();
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  return { rows, pagination: build.calculatePagination({ totalData, currentPage: page, limit }) };
};

const getLatestDB = async (userId: string) =>
  BalanceSheetModel.findOne({ ...companyScope(userId), isDeleted: false })
    .sort({ balance_sheet_date: -1 })
    .lean();

const getSingleDB = async (id: string, userId: string) => {
  const sheet = await BalanceSheetModel.findOne({
    _id: id,
    ...companyScope(userId),
    isDeleted: false,
  });
  if (!sheet) throw new AppError(httpStatus.NOT_FOUND, "Balance sheet not found");

  const items = await BalanceSheetItemModel.find({
    balance_sheet_id: sheet._id,
    ...companyScope(userId),
    isDeleted: false,
  })
    .populate("account_id", "account_code account_name normal_balance")
    .lean();

  const notes = await BalanceSheetNoteModel.find({
    balance_sheet_id: sheet._id,
    ...companyScope(userId),
    isDeleted: false,
  })
    .sort({ note_number: 1 })
    .lean();

  const groupedItems: Record<string, Record<string, typeof items>> = {};
  for (const item of items) {
    const st = item.section_type;
    const ss = item.sub_section;
    if (!groupedItems[st]) groupedItems[st] = {};
    if (!groupedItems[st][ss]) groupedItems[st][ss] = [];
    groupedItems[st][ss].push(item);
  }

  const allBalanceSheets = await BalanceSheetModel.find({
    ...companyScope(userId),
    isDeleted: false,
  })
    .select("_id balance_sheet_date financial_year status")
    .sort({ balance_sheet_date: -1 })
    .lean();

  const otherBalanceSheets = await BalanceSheetModel.find({
    ...companyScope(userId),
    isDeleted: false,
    _id: { $ne: sheet._id },
    status: "finalized",
  })
    .select("_id balance_sheet_date financial_year")
    .lean();

  return { sheet, items, groupedItems, notes, allBalanceSheets, otherBalanceSheets };
};

const getFormattedSingleDB = async (id: string, userId: string) => {
  const raw = await getSingleDB(id, userId);
  return formatBalanceSheetViewResponse(raw);
};

const finalizeDB = async (id: string, userId: string) => {
  const sheet = await BalanceSheetModel.findOne({
    _id: id,
    ...companyScope(userId),
    isDeleted: false,
  });
  if (!sheet) throw new AppError(httpStatus.NOT_FOUND, "Balance sheet not found");
  if (!sheet.is_balanced) {
    throw new AppError(httpStatus.BAD_REQUEST, "Balance sheet is not balanced. Cannot finalize.");
  }
  sheet.status = "finalized";
  await sheet.save();
  return sheet;
};

const deleteDBOne = async (id: string, userId: string) => {
  const sheet = await BalanceSheetModel.findOne({
    _id: id,
    ...companyScope(userId),
    isDeleted: false,
  });
  if (!sheet) throw new AppError(httpStatus.NOT_FOUND, "Balance sheet not found");
  if (sheet.status !== "draft") {
    throw new AppError(httpStatus.BAD_REQUEST, "Only draft balance sheets can be deleted");
  }
  sheet.isDeleted = true;
  await sheet.save();
  await BalanceSheetItemModel.updateMany(
    { balance_sheet_id: sheet._id, ...companyScope(userId) },
    { isDeleted: true }
  );
  return sheet;
};

const addNoteDB = async (
  id: string,
  userId: string,
  req: AuthRequest,
  payload: Pick<TBalanceSheetNote, "note_title" | "note_content">
) => {
  const sheet = await BalanceSheetModel.findOne({
    _id: id,
    ...companyScope(userId),
    isDeleted: false,
  });
  if (!sheet) throw new AppError(httpStatus.NOT_FOUND, "Balance sheet not found");

  const maxNote = await BalanceSheetNoteModel.findOne({
    balance_sheet_id: sheet._id,
    ...companyScope(userId),
    isDeleted: false,
  })
    .sort({ note_number: -1 })
    .lean();

  return BalanceSheetNoteModel.create({
    user_id: new Types.ObjectId(userId),
    creator_id: creatorIdUtil(req),
    balance_sheet_id: sheet._id,
    note_number: (maxNote?.note_number ?? 0) + 1,
    note_title: payload.note_title,
    note_content: payload.note_content,
  });
};

const deleteNoteDBOne = async (balanceSheetId: string, noteId: string, userId: string) => {
  const note = await BalanceSheetNoteModel.findOne({
    _id: noteId,
    balance_sheet_id: balanceSheetId,
    ...companyScope(userId),
    isDeleted: false,
  });
  if (!note) throw new AppError(httpStatus.NOT_FOUND, "Note not found");
  note.isDeleted = true;
  await note.save();
  return note;
};

const compareDB = async (
  userId: string,
  creatorId: Types.ObjectId | undefined,
  current_period_id: string,
  previous_period_id: string
) =>
  ComparativeBalanceSheetModel.create({
    user_id: new Types.ObjectId(userId),
    creator_id: creatorId,
    current_period_id: new Types.ObjectId(current_period_id),
    previous_period_id: new Types.ObjectId(previous_period_id),
    comparison_date: new Date(),
  });

const listComparisonsDB = async (userId: string, query: Record<string, unknown>) => {
  const base = ComparativeBalanceSheetModel.find({ ...companyScope(userId), isDeleted: false })
    .populate("current_period_id", "balance_sheet_date financial_year")
    .populate("previous_period_id", "balance_sheet_date financial_year");
  const build = new queryBuilder(base, query).filter().sort().fields();
  const { totalData } = await build.paginate(
    ComparativeBalanceSheetModel.find({ ...companyScope(userId), isDeleted: false })
  );
  const rows = await build.modelQuery.exec();
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 15;
  return { rows, pagination: build.calculatePagination({ totalData, currentPage: page, limit }) };
};

const getComparisonDB = async (id: string, userId: string) => {
  const comparison = await ComparativeBalanceSheetModel.findOne({
    _id: id,
    ...companyScope(userId),
    isDeleted: false,
  })
    .populate({
      path: "current_period_id",
      populate: { path: "items", model: "BalanceSheetItem" },
    })
    .populate({
      path: "previous_period_id",
      populate: { path: "items", model: "BalanceSheetItem" },
    });

  if (!comparison) throw new AppError(httpStatus.NOT_FOUND, "Comparison not found");

  const [currentItems, previousItems] = await Promise.all([
    BalanceSheetItemModel.find({
      balance_sheet_id: (comparison.current_period_id as { _id: Types.ObjectId })._id,
      ...companyScope(userId),
      isDeleted: false,
    }).populate("account_id", "account_code account_name"),
    BalanceSheetItemModel.find({
      balance_sheet_id: (comparison.previous_period_id as { _id: Types.ObjectId })._id,
      ...companyScope(userId),
      isDeleted: false,
    }).populate("account_id", "account_code account_name"),
  ]);

  return { comparison, currentItems, previousItems };
};

const comparisonPrintDB = async (userId: string, currentId: string, previousId: string) => {
  const [current, previous] = await Promise.all([
    getSingleDB(currentId, userId),
    getSingleDB(previousId, userId),
  ]);
  return { currentPeriod: current, previousPeriod: previous };
};

const yearEndCloseDB = async (
  userId: string,
  creatorId: Types.ObjectId | undefined,
  financial_year: string,
  closing_date: Date
) => {
  const nextYear = String(parseInt(financial_year, 10) + 1);
  const exists = await OpeningBalanceModel.exists({
    ...companyScope(userId),
    financial_year: nextYear,
  });
  if (exists) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Year-end close for ${financial_year} has already been performed`
    );
  }

  const retained = await getRetainedEarningsAccount(userId);
  if (!retained) {
    throw new AppError(httpStatus.BAD_REQUEST, "Retained Earnings account (3200) not found");
  }

  const plAccounts = await ChartOfAccountModel.find({
    ...companyScope(userId),
    is_active: true,
    account_code: { $gte: "4000", $lte: "5999" },
  }).lean();

  const journalLines: Array<{
    account_id: Types.ObjectId;
    description: string;
    debit_amount: number;
    credit_amount: number;
  }> = [];
  let totalRevenue = 0;
  let totalExpense = 0;

  for (const account of plAccounts) {
    const balance = await getAccountBalance(userId, account._id!, { asOfDate: closing_date });
    if (Math.abs(balance) <= 0.01) continue;
    const code = parseInt(account.account_code, 10);
    if (code >= 4000 && code <= 4999) {
      totalRevenue += balance;
      journalLines.push({
        account_id: account._id!,
        description: "Close revenue account",
        debit_amount: balance,
        credit_amount: 0,
      });
    } else if (code >= 5000 && code <= 5999) {
      totalExpense += balance;
      journalLines.push({
        account_id: account._id!,
        description: "Close expense account",
        debit_amount: 0,
        credit_amount: balance,
      });
    }
  }

  if (journalLines.length) {
    const netIncome = totalRevenue - totalExpense;
    await createYearEndCloseJournal(
      userId,
      creatorId,
      financial_year,
      closing_date,
      journalLines,
      retained._id!,
      netIncome
    );
  }

  const accounts = await getAllAccountBalancesAsOf(userId, closing_date);
  const nextYearStart = new Date(closing_date);
  nextYearStart.setDate(nextYearStart.getDate() + 1);

  for (const account of accounts) {
    const section = getAccountSection(account.account_code);
    if (section.section_type === "other") continue;
    if (Math.abs(account.current_balance) <= 0.01) continue;

    await OpeningBalanceModel.findOneAndUpdate(
      {
        account_id: account._id,
        financial_year: nextYear,
        ...companyScope(userId),
      },
      {
        user_id: new Types.ObjectId(userId),
        creator_id: creatorId,
        account_id: account._id,
        financial_year: nextYear,
        opening_balance: Math.abs(account.current_balance),
        balance_type:
          (account.current_balance >= 0 && account.normal_balance === "debit") ||
          (account.current_balance < 0 && account.normal_balance === "credit")
            ? "debit"
            : "credit",
        effective_date: nextYearStart,
      },
      { upsert: true, new: true }
    );

    await ChartOfAccountModel.updateOne(
      { _id: account._id, ...companyScope(userId) },
      { opening_balance: account.current_balance, current_balance: account.current_balance }
    );
  }

  return { financial_year, next_year: nextYear, closing_date };
};

const deleteDB = withBulkDeleteId(deleteDBOne);

const deleteNoteDB = async (balanceSheetId: string, noteId: string, userId: string) =>
  runBulkDelete(parseDeleteIdsFromParam(noteId), (oneNoteId) => deleteNoteDBOne(balanceSheetId, oneNoteId, userId));

export const balanceSheetService = {
  generateBalanceSheetDB,
  getAllDB,
  getLatestDB,
  getSingleDB,
  getFormattedSingleDB,
  finalizeDB,
  deleteDB,
  addNoteDB,
  deleteNoteDB,
  compareDB,
  listComparisonsDB,
  getComparisonDB,
  comparisonPrintDB,
  yearEndCloseDB,
};

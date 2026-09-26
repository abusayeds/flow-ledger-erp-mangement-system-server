import { PipelineStage, Types } from "mongoose";
import { companyObjectId, companyScope } from "../account.utils";
import { ChartOfAccountModel } from "../chartOfAccount/chartOfAccount.model";
import { JournalEntryItemModel } from "../journal/journalEntryItem.model";
import { JournalEntryModel } from "../journal/journalEntry.model";
import { OpeningBalanceModel } from "../openingBalance/openingBalance.model";

export type AccountBalanceRow = {
  _id: Types.ObjectId;
  account_code: string;
  account_name: string;
  normal_balance: "debit" | "credit";
  opening_balance: number;
  current_balance: number;
};

const sumJournalMovement = async (
  userId: string,
  accountId: Types.ObjectId,
  opts: { fromDate?: Date; toDate?: Date; beforeDate?: Date }
) => {
  const userOid = companyObjectId(userId);
  const pipeline: PipelineStage[] = [
    {
      $match: {
        user_id: userOid,
        account_id: accountId,
        isDeleted: false,
      },
    },
    {
      $lookup: {
        from: "journalentries",
        localField: "journal_entry_id",
        foreignField: "_id",
        as: "journal",
      },
    },
    { $unwind: "$journal" },
    {
      $match: {
        "journal.user_id": userOid,
        "journal.status": "posted",
        "journal.isDeleted": false,
      },
    },
  ];

  const dateMatch: Record<string, Date> = {};
  if (opts.beforeDate) dateMatch.$lt = opts.beforeDate;
  if (opts.fromDate) dateMatch.$gte = opts.fromDate;
  if (opts.toDate) dateMatch.$lte = opts.toDate;
  if (Object.keys(dateMatch).length) {
    pipeline.push({ $match: { "journal.journal_date": dateMatch } });
  }

  pipeline.push({
    $group: {
      _id: null,
      total_debit: { $sum: "$debit_amount" },
      total_credit: { $sum: "$credit_amount" },
    },
  });

  const agg = await JournalEntryItemModel.aggregate(pipeline);
  return {
    debit: agg[0]?.total_debit ?? 0,
    credit: agg[0]?.total_credit ?? 0,
  };
};

export const movementBalance = (
  opening: number,
  normalBalance: "debit" | "credit",
  debit: number,
  credit: number
) => {
  if (normalBalance === "debit") {
    return opening + debit - credit;
  }
  return opening + credit - debit;
};

/** Report date range: start of from-day, end of to-day (inclusive). */
export const parseReportDateRange = (fromStr?: string, toStr?: string) => {
  const y = new Date().getFullYear();
  const from = new Date(fromStr ?? `${y}-01-01`);
  from.setHours(0, 0, 0, 0);
  const to = new Date(toStr ?? `${y}-12-31`);
  to.setHours(23, 59, 59, 999);
  return { from, to, fromStr: fromStr ?? `${y}-01-01`, toStr: toStr ?? `${y}-12-31` };
};

/**
 * Balance for trial balance / P&L: COA opening_balance + posted journals in [from, to] only.
 * Matches Laravel TrialBalanceService (no extra "prior period" adjustment).
 */
export const getAccountBalanceInPeriod = async (
  userId: string,
  accountId: Types.ObjectId,
  fromDate: Date,
  toDate: Date
) => {
  const account = await ChartOfAccountModel.findOne({
    _id: accountId,
    ...companyScope(userId),
  }).lean();
  if (!account) return 0;
  const movement = await sumJournalMovement(userId, accountId, { fromDate, toDate });
  return movementBalance(
    account.opening_balance ?? 0,
    account.normal_balance,
    movement.debit,
    movement.credit
  );
};

export const getAccountBalance = async (
  userId: string,
  accountId: Types.ObjectId,
  opts: { asOfDate?: Date; fromDate?: Date; toDate?: Date } = {}
) => {
  const account = await ChartOfAccountModel.findOne({
    _id: accountId,
    ...companyScope(userId),
  }).lean();
  if (!account) return 0;

  let opening = account.opening_balance ?? 0;

  if (opts.fromDate) {
    const prior = await sumJournalMovement(userId, accountId, { beforeDate: opts.fromDate });
    opening = movementBalance(opening, account.normal_balance, prior.debit, prior.credit);
  }

  const movement = await sumJournalMovement(userId, accountId, {
    fromDate: opts.fromDate,
    toDate: opts.asOfDate ?? opts.toDate,
  });

  return movementBalance(opening, account.normal_balance, movement.debit, movement.credit);
};

export const getAllAccountBalancesAsOf = async (
  userId: string,
  asOfDate: Date
): Promise<AccountBalanceRow[]> => {
  const accounts = await ChartOfAccountModel.find({
    ...companyScope(userId),
    is_active: true,
  })
    .sort({ account_code: 1 })
    .lean();

  const rows: AccountBalanceRow[] = [];
  for (const account of accounts) {
    const current_balance = await getAccountBalance(userId, account._id!, { asOfDate });
    rows.push({
      _id: account._id!,
      account_code: account.account_code,
      account_name: account.account_name,
      normal_balance: account.normal_balance,
      opening_balance: account.opening_balance ?? 0,
      current_balance,
    });
  }
  return rows;
};

export const getPeriodMovementBalance = async (
  userId: string,
  accountId: Types.ObjectId,
  fromDate: Date,
  toDate: Date
) => {
  const movement = await sumJournalMovement(userId, accountId, { fromDate, toDate });
  const account = await ChartOfAccountModel.findOne({
    _id: accountId,
    ...companyScope(userId),
  }).lean();
  if (!account) return 0;
  return movementBalance(0, account.normal_balance, movement.debit, movement.credit);
};

export const getAccountTypeLabel = (accountCode: string) => {
  const code = parseInt(accountCode, 10);
  if (code >= 1000 && code < 2000) return "Assets";
  if (code >= 2000 && code < 3000) return "Liabilities";
  if (code >= 3000 && code < 4000) return "Equity";
  if (code >= 4000 && code < 5000) return "Revenue";
  if (code >= 5000 && code < 6000) return "Expenses";
  return "Other";
};

export const getAccountSection = (accountCode: string) => {
  const code = parseInt(accountCode, 10);
  if (code >= 1000 && code <= 1399) {
    return { section_type: "assets", sub_section: "current_assets" };
  }
  if (code >= 1400 && code <= 1599) {
    return { section_type: "assets", sub_section: "other_assets" };
  }
  if (code >= 1600 && code <= 1999) {
    return { section_type: "assets", sub_section: "fixed_assets" };
  }
  if (code >= 2000 && code <= 2499) {
    return { section_type: "liabilities", sub_section: "current_liabilities" };
  }
  if (code >= 2500 && code <= 2999) {
    return { section_type: "liabilities", sub_section: "long_term_liabilities" };
  }
  if (code >= 3000 && code <= 3999) {
    return { section_type: "equity", sub_section: "equity" };
  }
  return { section_type: "other", sub_section: "other" };
};

export const updateCoaBalancesFromJournal = async (journalEntryId: Types.ObjectId, userId: string) => {
  const items = await JournalEntryItemModel.find({
    journal_entry_id: journalEntryId,
    ...companyScope(userId)
  });
  for (const item of items) {
    const balance = await getAccountBalance(userId, item.account_id);
    await ChartOfAccountModel.updateOne(
      { _id: item.account_id, ...companyScope(userId) },
      { current_balance: balance }
    );
  }
};

export const findLatestOpeningBalance = async (userId: string, accountId: Types.ObjectId) =>
  OpeningBalanceModel.findOne({
    account_id: accountId,
    ...companyScope(userId),
  })
    .sort({ effective_date: -1 })
    .lean();

export const journalExistsForReference = async (
  userId: string,
  referenceType: string,
  referenceId: Types.ObjectId
) =>
  JournalEntryModel.exists({
    ...companyScope(userId),
    reference_type: referenceType,
    reference_id: referenceId,
    status: "posted",
  });

import { PipelineStage, Types } from "mongoose";
import queryBuilder from "../../../../builder/queryBuilder";
import { companyObjectId } from "../../account/account.utils";
import { ChartOfAccountModel } from "../../account/chartOfAccount/chartOfAccount.model";
import { JournalEntryModel } from "../../account/journal/journalEntry.model";
import { JournalEntryItemModel } from "../../account/journal/journalEntryItem.model";
import { parseReportDateRange } from "../../account/ledger/ledger.service";

export const getAllLedgerEntries = async (
  userId: string,
  query: Record<string, unknown>
) => {
  const userOid = companyObjectId(userId);
  const jeCollection = JournalEntryModel.collection.name;
  const coaCollection = ChartOfAccountModel.collection.name;

  const match: Record<string, unknown> = {
    user_id: userOid,
    isDeleted: false,
  };
  if (query.account_id) {
    match.account_id = new Types.ObjectId(String(query.account_id));
  }

  const pipeline: PipelineStage[] = [
    { $match: match },
    {
      $lookup: {
        from: jeCollection,
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

  if (query.from_date || query.to_date) {
    const { from, to } = parseReportDateRange(
      query.from_date as string | undefined,
      query.to_date as string | undefined
    );
    pipeline.push({
      $match: {
        "journal.journal_date": {
          $gte: from,
          $lte: to,
        },
      },
    });
  }

  pipeline.push(
    {
      $lookup: {
        from: coaCollection,
        localField: "account_id",
        foreignField: "_id",
        as: "account",
      },
    },
    {
      $unwind: {
        path: "$account",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        _id: 1,
        journal_date: "$journal.journal_date",
        reference_type: "$journal.reference_type",
        journal_description: "$journal.description",
        description: 1,
        debit_amount: 1,
        credit_amount: 1,
        account_code: { $ifNull: ["$account.account_code", ""] },
        account_name: { $ifNull: ["$account.account_name", ""] },
      },
    },
    { $sort: { journal_date: -1, _id: -1 } }
  );

  // Free-text search across the projected fields, applied to the FULL result
  // set (before the in-memory pagination below) so it spans the whole ledger.
  const searchTerm =
    typeof query.searchTerm === "string" ? query.searchTerm.trim() : "";
  if (searchTerm) {
    pipeline.push({
      $match: {
        $or: [
          "account_name",
          "account_code",
          "description",
          "journal_description",
          "reference_type",
        ].map((f) => ({ [f]: { $regex: searchTerm, $options: "i" } })),
      },
    });
  }

  const allRows = await JournalEntryItemModel.aggregate(pipeline);

  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 50;
  const start = (page - 1) * limit;
  const rows = allRows.slice(start, start + limit);

  const build = new queryBuilder(null as never, query);
  return {
    rows,
    pagination: build.calculatePagination({
      totalData: allRows.length,
      currentPage: page,
      limit,
    }),
  };
};

export const getLedgerEntriesForPrint = async (
  userId: string,
  fromDate?: string,
  toDate?: string,
  accountId?: string
) => {
  const result = await getAllLedgerEntries(userId, {
    from_date: fromDate,
    to_date: toDate,
    account_id: accountId,
    page: 1,
    limit: 10000,
  });
  return result.rows;
};

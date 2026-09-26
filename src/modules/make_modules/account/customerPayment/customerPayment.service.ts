import httpStatus from "http-status";
import { Types } from "mongoose";
import AppError from "../../../../errors/AppError";
import queryBuilder from "../../../../builder/queryBuilder";
import { assertClientUser, CLIENT_POPULATE_SELECT } from "../../../../utils/partyUser";
import {
  companyObjectId,
  companyScope,
  generateAccountNumber,
} from "../account.utils";
import {
  TCustomerPayment,
  TPaymentAllocation,
  TCreditNoteApplication,
} from "./customerPayment.interface";
import { CustomerPaymentModel } from "./customerPayment.model";
import { UserModel } from "../../../basic_modules/user/user.model";
import { InvoiceModel } from "../../invoice/invoice.model";
import { CreditNoteModel } from "../../creditNote/creditNote.model";
import { BankAccountModel } from "../bankAccount/bankAccount.model";
import { createBankTransaction } from "../accountBank.service";
import { withBulkDeleteId } from "../../../../utils/bulkDelete";

const OPEN_STATUSES = ["Open", "Partial", "Overdue"];

const updateInvoiceBalance = async (
  invoiceId: Types.ObjectId,
  userId: string,
  allocatedAmount: number
) => {
  const invoice = await InvoiceModel.findOne({
    _id: invoiceId,
    user_id: userId
  });
  if (!invoice) throw new AppError(httpStatus.BAD_REQUEST, "Invalid invoice in allocation");

  const total = invoice.total ?? 0;
  const paid = (invoice.paid_amount ?? 0) + allocatedAmount;
  let balance = invoice.balance_amount;
  if (balance === undefined || balance === null) {
    balance = total - (invoice.paid_amount ?? 0);
  }
  balance = balance - allocatedAmount;

  invoice.paid_amount = paid;
  invoice.balance_amount = Math.max(0, balance);

  if (invoice.balance_amount <= 0) {
    invoice.status = "Paid";
  } else if (invoice.paid_amount > 0) {
    invoice.status = "Partial";
  } else {
    invoice.status = "Open";
  }
  await invoice.save();
};

const validateAllocations = async (
  userId: string,
  customerId: string,
  allocations: TPaymentAllocation[] = [],
  creditNotes: TCreditNoteApplication[] = []
) => {
  if (!allocations.length) {
    throw new AppError(httpStatus.BAD_REQUEST, "At least one invoice allocation is required");
  }

  let totalAllocated = 0;
  for (const alloc of allocations) {
    const invoice = await InvoiceModel.findOne({
      _id: alloc.invoice_id,
      user_id: userId,
      customer_id: customerId,
      isDeleted: false,
      status: { $in: OPEN_STATUSES },
    });
    if (!invoice) {
      throw new AppError(httpStatus.BAD_REQUEST, "Invalid or ineligible invoice for allocation");
    }
    const balance =
      invoice.balance_amount !== undefined && invoice.balance_amount !== null
        ? invoice.balance_amount
        : (invoice.total ?? 0) - (invoice.paid_amount ?? 0);
    if (alloc.allocated_amount > balance + 0.01) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `Allocation exceeds invoice balance for ${invoice.invoice_number ?? invoice._id}`
      );
    }
    totalAllocated += alloc.allocated_amount;
  }

  if (creditNotes.length) {
    const totalCredit = creditNotes.reduce((s, c) => s + c.applied_amount, 0);
    if (totalCredit > totalAllocated + 0.01) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Credit note amount cannot exceed total invoice allocation amount"
      );
    }
    for (const cn of creditNotes) {
      const note = await CreditNoteModel.findOne({
        _id: cn.credit_note_id,
        user_id: userId,
        customer_id: customerId,
        isDeleted: false,
        status: { $in: ["Approved", "Partial", "Open"] },
      });
      if (!note) {
        throw new AppError(httpStatus.BAD_REQUEST, "Invalid credit note application");
      }
      const noteBalance =
        note.balance_amount !== undefined && note.balance_amount !== null
          ? note.balance_amount
          : (note.total ?? 0) - (note.applied_amount ?? 0);
      if (cn.applied_amount > noteBalance + 0.01) {
        throw new AppError(httpStatus.BAD_REQUEST, "Credit note applied amount exceeds balance");
      }
    }
  }
};

const createDB = async (payload: TCustomerPayment) => {
  await assertClientUser(payload.customer_id);
  const bank = await BankAccountModel.findOne({
    _id: payload.bank_account_id,
    ...companyScope(String(payload.user_id)),
  });
  if (!bank) throw new AppError(httpStatus.BAD_REQUEST, "Invalid bank account");

  await validateAllocations(
    String(payload.user_id),
    String(payload.customer_id),
    payload.allocations,
    payload.credit_notes
  );

  payload.payment_number = await generateAccountNumber(
    CustomerPaymentModel,
    "CP",
    companyObjectId(payload.user_id),
    "payment_number"
  );
  payload.status = "pending";
  return CustomerPaymentModel.create(payload);
};

const getAllDB = async (userId: string, query: Record<string, unknown>) => {
  const base = CustomerPaymentModel.find(companyScope(userId))
    .populate("customer_id", CLIENT_POPULATE_SELECT)
    .populate("bank_account_id", "account_name account_number")
    .populate("allocations.invoice_id", "invoice_number total balance_amount status");
  const build = new queryBuilder(base, query);

  // Search matches the payment's own text AND the customer (referenced User) by
  // name/company — so `searchTerm` finds payments by customer, not just the
  // payment/reference number. Awaited before filter/paginate.
  await build.searchNested({
    localFields: ["payment_number", "reference_number", "notes"],
    refs: [
      {
        foreignField: "customer_id",
        model: UserModel,
        fields: ["name", "email", "phone"],
        dotFields: ["businessProfile.companyName"],
        refFilter: { companyId: userId },
      },
    ],
  });

  build.filter().sort().fields();
  const { totalData } = await build.paginate();
  const rows = await build.modelQuery.exec();
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  return { rows, pagination: build.calculatePagination({ totalData, currentPage: page, limit }) };
};

const getOutstandingDB = async (userId: string, customerId: string) => {
  await assertClientUser(customerId);
  const invoices = await InvoiceModel.find({
    user_id: userId,
    customer_id: customerId,
    isDeleted: false,
    status: { $in: OPEN_STATUSES },
    $or: [{ balance_amount: { $gt: 0 } }, { balance_amount: { $exists: false } }],
  })
    .select("_id invoice_number date due_date total paid_amount balance_amount status")
    .lean();

  const normalized = invoices
    .map((inv) => {
      const balance =
        inv.balance_amount !== undefined && inv.balance_amount !== null
          ? inv.balance_amount
          : (inv.total ?? 0) - (inv.paid_amount ?? 0);
      return { ...inv, balance_amount: balance };
    })
    .filter((inv) => inv.balance_amount > 0);

  const creditNotes = await CreditNoteModel.find({
    user_id: userId,
    customer_id: customerId,
    isDeleted: false,
    status: { $in: ["Approved", "Partial", "Open"] },
    $or: [{ balance_amount: { $gt: 0 } }, { balance_amount: { $exists: false } }],
  })
    .select("_id invoice_number total applied_amount balance_amount status")
    .lean();

  return { invoices: normalized, creditNotes };
};

const updateStatusDB = async (id: string, userId: string, status: string) => {
  const record = await CustomerPaymentModel.findOne({ _id: id, ...companyScope(userId) });
  if (!record) throw new AppError(httpStatus.NOT_FOUND, "Customer payment not found");

  if (status === "cleared" && record.status !== "cleared") {
    if (record.payment_amount > 0) {
      await createBankTransaction({
        user_id: record.user_id,
        creator_id: record.creator_id,
        bank_account_id: record.bank_account_id,
        transaction_date: record.payment_date,
        transaction_type: "credit",
        reference_number: record.payment_number,
        description: `Customer payment ${record.payment_number}`,
        amount: record.payment_amount,
        running_balance: 0,
        transaction_status: "cleared",
        reconciliation_status: "unreconciled"
      });
    }

    for (const alloc of record.allocations ?? []) {
      await updateInvoiceBalance(alloc.invoice_id, userId, alloc.allocated_amount);
    }

    for (const cnApp of record.credit_notes ?? []) {
      const note = await CreditNoteModel.findById(cnApp.credit_note_id);
      if (!note) continue;
      note.applied_amount = (note.applied_amount ?? 0) + cnApp.applied_amount;
      const total = note.total ?? 0;
      note.balance_amount = Math.max(0, total - note.applied_amount);
      if (note.balance_amount <= 0) {
        note.status = "Applied";
      } else {
        note.status = "Partial";
      }
      await note.save();
    }
  }

  record.status = status as TCustomerPayment["status"];
  await record.save();
  return record;
};

const deleteDBOne = async (id: string, userId: string) => {
  const record = await CustomerPaymentModel.findOne({ _id: id, ...companyScope(userId) });
  if (!record) throw new AppError(httpStatus.NOT_FOUND, "Customer payment not found");
  if (record.status !== "pending") {
    throw new AppError(httpStatus.BAD_REQUEST, "Only pending payments can be deleted");
  }
  record.isDeleted = true;
  await record.save();
  return record;
};

const deleteDB = withBulkDeleteId(deleteDBOne);

export const customerPaymentService = {
  createDB,
  getAllDB,
  getOutstandingDB,
  updateStatusDB,
  deleteDB,
};

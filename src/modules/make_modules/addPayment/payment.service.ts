import httpStatus from "http-status";
import AppError from "../../../errors/AppError";
import { assertClientUser } from "../../../utils/partyUser";
import { TPayment } from "./payment.interface";
import { PaymentModel } from "./payment.model";
import { InvoiceModel } from "../invoice/invoice.model";
import queryBuilder from "../../../builder/queryBuilder";
import { withBulkDeleteId } from "../../../utils/bulkDelete";

const paymentCreateDB = async (payload: TPayment) => {
  await assertClientUser(payload.customer_id);
  if (payload.type === "invoice") {
    const invoice = await InvoiceModel.findById(payload.invoice_id);
    if (!invoice) {
      throw new AppError(httpStatus.NOT_FOUND, "Invoice not found");
    }
    const result = await PaymentModel.create(payload);
    // Accumulate this payment and derive the invoice's status from the running
    // balance: fully covered → Paid, partially covered → Partial. (Previously
    // the controller force-set "Paid" on every payment, even a partial one.)
    const total = Number(invoice.total) || 0;
    const paid =
      (Number(invoice.paid_amount) || 0) + (Number(payload.amount) || 0);
    const balance = Math.max(0, total - paid);
    invoice.paid_amount = paid;
    invoice.balance_amount = balance;
    if (total > 0 && balance <= 0) {
      invoice.status = "Paid";
    } else if (paid > 0) {
      invoice.status = "Partial";
    }
    await invoice.save();
    return result;
  }
  const result = await PaymentModel.create(payload);
  return result;
};

const paymentGetAllDB = async ( query  :  Record<string, unknown> ,  user_id: string) => {
  const paymentQuery =  new queryBuilder(PaymentModel.find({ user_id, isActive: true , isDeleted: false , isArchive: false }) , query).search(["payment_type" , "notes" , "internal_notes"]).filter().sort().fields()
  const { totalData } = await paymentQuery.paginate(PaymentModel.find({ user_id, isActive: true , isDeleted: false , isArchive: false }))
  const allPayment = await paymentQuery.modelQuery.exec();
  const currentPage = Number(query?.page) || 1;
  const limit = Number(query.limit) || 10;
  const pagination = paymentQuery.calculatePagination({ totalData, currentPage, limit });
  return { allPayment, pagination };

};
// Scope single fetch/update/delete by user_id (the owning company), same as the
// list query above — otherwise a caller could read/modify another company's
// payment by guessing its _id.
const paymentSingleDB = async (id: string, userId: string) => {
  const payment = await PaymentModel.findOne({ _id: id, user_id: userId, isActive: true , isDeleted: false , isArchive: false
   }    );
  if (!payment) {
    throw new AppError(httpStatus.NOT_FOUND, "Payment not found");
  }
  return payment;
};
const paymentUpdateDB = async (id: string, userId: string, payload: Partial<TPayment>) => {
  const payment = await PaymentModel.findOneAndUpdate({ _id: id, user_id: userId }, payload, {
    new: true
  });
  if (!payment) {
    throw new AppError(httpStatus.NOT_FOUND, "Payment not found");
  }
  return payment;
};
const paymentDeleteDBOne = async (id: string, userId: string) => {
  const payment = await PaymentModel.findOneAndDelete({ _id: id, user_id: userId });
  if (!payment) {
    throw new AppError(httpStatus.NOT_FOUND, "Payment not found");
  }
};

const paymentDeleteDB = withBulkDeleteId(paymentDeleteDBOne);

export const addPaymentService = {
  paymentCreateDB,
  paymentGetAllDB,
  paymentSingleDB,
  paymentUpdateDB,
  paymentDeleteDB,
};

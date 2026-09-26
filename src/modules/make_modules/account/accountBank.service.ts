import { Types } from "mongoose";
import { BankAccountModel } from "./bankAccount/bankAccount.model";
import { BankTransactionModel } from "./bankTransaction/bankTransaction.model";
import { TBankTransaction } from "./bankTransaction/bankTransaction.interface";

export const updateBankBalance = async (
  bankAccountId: Types.ObjectId | string,
  delta: number
) => {
  await BankAccountModel.findByIdAndUpdate(bankAccountId, {
    $inc: { current_balance: delta }
  });
};

export const createBankTransaction = async (payload: Omit<TBankTransaction, "_id">) => {
  const last = await BankTransactionModel.findOne({
    bank_account_id: payload.bank_account_id,
    user_id: payload.user_id,
    isDeleted: false,
  })
    .sort({ createdAt: -1 })
    .exec();

  const signed =
    payload.transaction_type === "credit" ? payload.amount : -payload.amount;
  const running = (last?.running_balance ?? 0) + signed;

  const txn = await BankTransactionModel.create({
    ...payload,
    running_balance: running,
  });

  await updateBankBalance(payload.bank_account_id, signed);
  return txn;
};

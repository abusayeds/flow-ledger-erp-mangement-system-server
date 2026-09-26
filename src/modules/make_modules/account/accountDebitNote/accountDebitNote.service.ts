import { debitNoteService } from "../../debitNote/debitNote.service";
import { TDebitNote } from "../../debitNote/debitNote.interface";

const getAllDB = async (userId: string, query: Record<string, unknown>) => {
  const { allRecords, pagination } = await debitNoteService.getAllDB(query, userId);
  return { rows: allRecords, pagination };
};

const getSingleDB = (id: string, userId: string) => debitNoteService.getSingleDB(id, userId);

const createDB = (payload: TDebitNote) => debitNoteService.createDB(payload);

const updateDB = (id: string, userId: string, payload: Partial<TDebitNote>) =>
  debitNoteService.updateDraftDB(id, userId, payload);

const approveDB = (id: string, userId: string) => debitNoteService.approveDB(id, userId);

const deleteDB = (id: string, userId: string) => debitNoteService.deleteDraftDB(id, userId);

const updateSignatureDB = (id: string, userId: string, signature: string) =>
  debitNoteService.updateSignatureDB(id, userId, signature);

export const accountDebitNoteService = { getAllDB, getSingleDB, createDB, updateDB, approveDB, deleteDB, updateSignatureDB };

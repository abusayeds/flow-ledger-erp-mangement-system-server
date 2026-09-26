import { creditNoteService } from "../../creditNote/creditNote.service";
import { TCreditNote } from "../../creditNote/creditNote.interface";

const getAllDB = async (userId: string, query: Record<string, unknown>) => {
  const { allRecords, pagination } = await creditNoteService.getAllDB(query, userId);
  return { rows: allRecords, pagination };
};

const getSingleDB = (id: string, userId: string) => creditNoteService.getSingleDB(id, userId);

const createDB = (payload: TCreditNote) => creditNoteService.createDB(payload);

const approveDB = (id: string, userId: string) => creditNoteService.approveDB(id, userId);

// Trash, not draft-only delete: the app's list offers Trash on every row and
// has a Trash tab to restore from.
const deleteDB = (id: string, userId: string) => creditNoteService.trashDB(id, userId);
// Permanent delete from the Trash tab.
const hardDeleteDB = (id: string, userId: string) => creditNoteService.hardDeleteDB(id, userId);
const restoreDB = (id: string, userId: string) => creditNoteService.restoreDB(id, userId);
const updateDB = (id: string, userId: string, payload: TCreditNote) =>
  creditNoteService.updateDB(id, userId, payload);

export const accountCreditNoteService = {
  getAllDB,
  getSingleDB,
  createDB,
  approveDB,
  deleteDB,
  hardDeleteDB,
  restoreDB,
  updateDB,
};

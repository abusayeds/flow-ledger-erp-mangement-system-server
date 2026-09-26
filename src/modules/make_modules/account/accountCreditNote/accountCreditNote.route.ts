import express from "express";
import { authMiddleware } from "../../../../middlewares/auth";
import { role } from "../../../../utils/role";
import { accountCreditNoteController } from "./accountCreditNote.controller";

const router = express.Router();

router.post("/create", authMiddleware(role.company), accountCreditNoteController.create);
router.get("/all", authMiddleware(role.company), accountCreditNoteController.getAll);
router.get("/single/:id", authMiddleware(role.company), accountCreditNoteController.getSingle);
router.post("/approve/:id", authMiddleware(role.company), accountCreditNoteController.approve);
router.post("/edit/:id", authMiddleware(role.company), accountCreditNoteController.update);
router.delete("/delete/:id", authMiddleware(role.company), accountCreditNoteController.remove);
// Permanent delete from the Trash tab — removes the soft-deleted row for good.
router.delete("/hard-delete/:id", authMiddleware(role.company), accountCreditNoteController.hardRemove);
// `delete` is a soft delete, so a trashed note can be brought back.
router.post("/restore/:id", authMiddleware(role.company), accountCreditNoteController.restore);

export const accountCreditNoteRoutes = router;

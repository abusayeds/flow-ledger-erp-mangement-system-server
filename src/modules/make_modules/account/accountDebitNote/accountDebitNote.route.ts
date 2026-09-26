import express from "express";
import { authMiddleware } from "../../../../middlewares/auth";
import { role } from "../../../../utils/role";
import { accountDebitNoteController } from "./accountDebitNote.controller";

const router = express.Router();

router.post("/create", authMiddleware(role.company), accountDebitNoteController.create);
router.get("/all", authMiddleware(role.company), accountDebitNoteController.getAll);
router.get("/single/:id", authMiddleware(role.company), accountDebitNoteController.getSingle);
router.patch("/update/:id", authMiddleware(role.company), accountDebitNoteController.update);
router.post("/approve/:id", authMiddleware(role.company), accountDebitNoteController.approve);
router.delete("/delete/:id", authMiddleware(role.company), accountDebitNoteController.remove);
router.patch("/signature/:id", authMiddleware(role.company), accountDebitNoteController.updateSignature);

export const accountDebitNoteRoutes = router;

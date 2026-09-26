import express from 'express';
import { authMiddleware } from '../../../middlewares/auth';
import { role } from '../../../utils/role';
import { debitNoteController } from './debitNote.controller';

const router = express.Router();

router.post(
  '/create',
  authMiddleware(role.company),
  debitNoteController.create
);

router.get(
  '/single/:id',
  authMiddleware(role.company),
  debitNoteController.getSingle
);

router.get(
  '/all',
  authMiddleware(role.company),
  debitNoteController.getAll
);

router.patch(
  '/signature/:id',
  authMiddleware(role.company),
  debitNoteController.updateSignature
);

export const debitNoteRoutes = router;

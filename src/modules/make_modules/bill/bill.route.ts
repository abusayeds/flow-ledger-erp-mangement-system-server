import express from 'express';
import { authMiddleware } from '../../../middlewares/auth';
import { role } from '../../../utils/role';
import { billController } from './bill.controller';

const router = express.Router();

router.post(
  '/create',
  authMiddleware(role.company),
  billController.create
);

router.get(
  '/single/:id',
  authMiddleware(role.company),
  billController.getSingle
);

router.get(
  '/all',
  authMiddleware(role.company),
  billController.getAll
);

router.post(
  '/edit/:id',
  authMiddleware(role.company),
  billController.update
);

router.delete(
  '/delete/:id',
  authMiddleware(role.company),
  billController.remove
);

// `delete` is a soft delete, so a trashed bill can be brought back.
router.post(
  '/restore/:id',
  authMiddleware(role.company),
  billController.restore
);

export const billRoutes = router;

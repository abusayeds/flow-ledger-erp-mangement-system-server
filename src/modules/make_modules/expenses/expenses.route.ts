import express from 'express';
import { authMiddleware } from '../../../middlewares/auth';
import { role } from '../../../utils/role';
import { expensesController } from './expenses.controller';

const router = express.Router();

router.post(
  '/create',
  authMiddleware(role.company),
  expensesController.create
);

router.get(
  '/single/:id',
  authMiddleware(role.company),
  expensesController.getSingle
);

router.get(
  '/all',
  authMiddleware(role.company),
  expensesController.getAll
);

router.post(
  '/edit/:id',
  authMiddleware(role.company),
  expensesController.update
);

router.delete(
  '/delete/:id',
  authMiddleware(role.company),
  expensesController.remove
);

export const expensesRoutes = router;

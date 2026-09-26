import express from 'express';
import { authMiddleware } from '../../../middlewares/auth';
import { role } from '../../../utils/role';
import { paymentReceivedController } from './paymentReceived.controller';

const router = express.Router();

router.post(
  '/create',
  authMiddleware(role.company),
  paymentReceivedController.create
);

router.get(
  '/single/:id',
  authMiddleware(role.company),
  paymentReceivedController.getSingle
);

router.get(
  '/all',
  authMiddleware(role.company),
  paymentReceivedController.getAll
);

router.post(
  '/edit/:id',
  authMiddleware(role.company),
  paymentReceivedController.update
);
router.delete(
  '/delete/:id',
  authMiddleware(role.company),
  paymentReceivedController.remove
);
// Permanent delete from the Trash tab (actually removes the row).
router.delete(
  '/hard-delete/:id',
  authMiddleware(role.company),
  paymentReceivedController.hardRemove
);
// `delete` is a soft delete, so a removed payment can be brought back.
router.post(
  '/restore/:id',
  authMiddleware(role.company),
  paymentReceivedController.restore
);
export const paymentReceivedRoutes = router;

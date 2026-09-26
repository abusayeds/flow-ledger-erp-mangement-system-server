import express from 'express';
import { authMiddleware } from '../../../middlewares/auth';
import { role } from '../../../utils/role';
import { deliveryChallanController } from './deliveryChallan.controller';

const router = express.Router();

router.post(
  '/create',
  authMiddleware(role.company),
  deliveryChallanController.create
);

router.get(
  '/single/:id',
  authMiddleware(role.company),
  deliveryChallanController.getSingle
);

router.get(
  '/all',
  authMiddleware(role.company),
  deliveryChallanController.getAll
);

router.post(
  '/edit/:id',
  authMiddleware(role.company),
  deliveryChallanController.update
);

router.delete(
  '/delete/:id',
  authMiddleware(role.company),
  deliveryChallanController.remove
);

// Permanent delete from the Trash tab — removes the soft-deleted row for good.
router.delete(
  '/hard-delete/:id',
  authMiddleware(role.company),
  deliveryChallanController.hardRemove
);

// `delete` is a soft delete, so a trashed challan can be brought back.
router.post(
  '/restore/:id',
  authMiddleware(role.company),
  deliveryChallanController.restore
);

export const deliveryChallanRoutes = router;

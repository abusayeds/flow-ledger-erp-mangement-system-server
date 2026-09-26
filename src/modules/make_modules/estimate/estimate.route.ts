import express from 'express';
import { authMiddleware } from '../../../middlewares/auth';
import { role } from '../../../utils/role';
import { estimateController } from './estimate.controller';

const router = express.Router();

router.post(
  '/create',
  authMiddleware(role.company),
  estimateController.create
);

router.get(
  '/single/:id',
  authMiddleware(role.company),
  estimateController.getSingle
);

router.get(
  '/all',
  authMiddleware(role.company),
  estimateController.getAll
);

router.post(
  '/edit/:id',
  authMiddleware(role.company),
  estimateController.update
);

router.delete(
  '/delete/:id',
  authMiddleware(role.company),
  estimateController.remove
);

router.delete(
  '/hard-delete/:id',
  authMiddleware(role.company),
  estimateController.hardRemove
);

// `delete` is a soft delete, so a trashed estimate can be brought back.
router.post(
  '/restore/:id',
  authMiddleware(role.company),
  estimateController.restore
);

export const estimateRoutes = router;

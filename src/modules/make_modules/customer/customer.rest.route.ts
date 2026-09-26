import express, { Request, Response, NextFunction } from "express";
import { authMiddleware } from "../../../middlewares/auth";
import { role } from "../../../utils/role";
import { enforcePlanLimit } from "../subscription/guard/subscription.guard";
import { customerController } from "./customer.controller";

/**
 * RESTful aliases mounted at `/customers` for the web frontend, which expects
 * conventional REST (`GET /`, `GET /:id`, `POST /`, `PATCH|PUT /:id`,
 * `DELETE /:id`). These reuse the existing customer controller handlers.
 *
 * The mobile app continues to use the original `/customer/*` routes
 * (`/all`, `/single/:id`, `/create`, `/update`, `/delete/:id`) — those are
 * untouched, so nothing on mobile breaks.
 */
const router = express.Router();
const auth = authMiddleware(role.company);

// updateCustomer reads the id from the body; map the REST `:id` param onto it.
const injectId = (req: Request, _res: Response, next: NextFunction) => {
  req.body = req.body || {};
  if (req.body._id == null) req.body._id = req.params.id;
  if (req.body.id == null) req.body.id = req.params.id;
  next();
};

// Full documents (nested businessProfile + currency + addresses) so the web can
// hydrate its detail/edit form straight from the list.
router.get("/", auth, customerController.allCustomerFull);
router.post("/", auth, enforcePlanLimit("users"), customerController.customerCreate);
// Permanent delete / restore must be registered before `/:id` routes.
router.delete("/permanent/:id", auth, customerController.hardDeleteCustomer);
router.post("/restore/:id", auth, customerController.restoreCustomer);
router.get("/:id", auth, customerController.singleCustomer);
router.put("/:id", auth, injectId, customerController.updateCustomer);
router.patch("/:id", auth, injectId, customerController.updateCustomer);
router.delete("/:id", auth, customerController.deleteCustomer);

export const customerRestRoutes = router;

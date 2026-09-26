import express from "express";
import { authMiddleware } from "../../../../middlewares/auth";
import { role } from "../../../../utils/role";
import { warehouseController } from "./warehouse.controller";
import { transferRoutes } from "./transfer/transfer.route";

const router = express.Router();
const auth = authMiddleware(role.company);

router.use("/transfer", transferRoutes);

router.post("/create", auth, warehouseController.createWarehouse);
router.get("/all", auth, warehouseController.getAllWarehouse);
router.get("/single/:id", auth, warehouseController.getSingleWarehouse);
router.patch("/edit/:id", auth, warehouseController.updateWarehouse);
router.delete("/delete/:id", auth, warehouseController.deleteWarehouse);
// `delete` is a soft delete, so a trashed warehouse can be brought back.
router.post("/restore/:id", auth, warehouseController.restoreWarehouse);

export const warehouseRoutes = router;

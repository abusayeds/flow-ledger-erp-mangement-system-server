import express from "express";
import {
  BlockUser,
  deleteUser,
  userController,
} from "./user.controller";
import { userValidation } from "./user.validation";
import zodValidation from "../../../middlewares/zodValidationHandler";
import { authMiddleware } from "../../../middlewares/auth";
import { role } from "../../../utils/role";
import { enforcePlanLimit } from "../../make_modules/subscription/guard/subscription.guard";
const router = express.Router();
router.post("/register",  userController.registerUser,);
router.post("/verify-otp", userController.verifyOTP);
router.post("/login", userController.loginUser);
router.post("/google-login", userController.googleLogin);
router.get("/login-presets", userController.loginPresets);
router.post("/forgot-password", userController.forgotPassword);
router.post("/verify-forgot-otp", userController.verifyForgotPasswordOTP);
router.post("/resend", userController.resendOTP);
router.post("/reset-password", zodValidation(userValidation.resetPassWordValidation), userController.resetPassword);
router.post("/change-password", userController.changePassword);
router.post("/update", zodValidation(userValidation.updateUserValidation), userController.updateUser);
router.post("/create-user-by-company", authMiddleware(role.company), enforcePlanLimit("users"), userController.createUserByCompany);
router.post("/create-company-by-superadmin", authMiddleware(role.superadmin), userController.createCompanyBySuperadmin);
router.get("/all-user-for-company", authMiddleware(role.company), userController.allUserForCompany);
router.get("/all-role", authMiddleware(role.company), userController.allRole);
router.get("/role-permissions/:role", authMiddleware(role.company), userController.rolePermissions);
router.get("/my-profile", authMiddleware(role.superadmin , role.company , role.hr , role.staff , role.customer), userController.myProfile);
router.get("/all-user", authMiddleware(role.superadmin), userController.getAllUsers);
router.post("/block-user", authMiddleware(role.superadmin), BlockUser);
router.delete("/delete/:id", authMiddleware(role.superadmin , role.company), deleteUser);

export const UserRoutes = router;

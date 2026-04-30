import express from "express";
import {
  SignUp,
  SignIn,
  VerifyEmail,
  ResendVerificationToken,
  PasswordResetSend,
  PasswordResetVerify,
  AdminSignIn,
  AddAdmin,
  AddCourier,
  AddStaff,
  DeleteAdmin,
  GetAllAdmins,
  GetCurrentUser,
  AddSuperAdmin,
} from "../../controllers/auth/index.js";
import { verifyToken, verifySuperAdmin, verifyAdmin } from "../../middleware/auth.js";

const router = express.Router();

// Public Routes
router.post("/signup", SignUp);
router.post("/login", SignIn);
router.post("/verify-email", VerifyEmail);
router.post("/resend-token", ResendVerificationToken);
router.post("/password-reset/send", PasswordResetSend);
router.post("/password-reset/verify", PasswordResetVerify);

// Admin Routes
router.post("/admin-login", AdminSignIn);

// Super Admin Routes
router.post("/admin/add", verifyToken, verifySuperAdmin, AddAdmin);
router.post("/courier/add", verifyToken, verifySuperAdmin, AddCourier);
router.post("/staff/add", verifyToken, verifySuperAdmin, AddStaff);
router.delete("/user/:userId", verifyToken, verifySuperAdmin, DeleteAdmin);
router.get("/users", verifyToken, verifySuperAdmin, GetAllAdmins);

//one time to add super admin
router.post("/add-super-admin", AddSuperAdmin); // This route should be removed or protected after the first super admin is created
// User Routes
router.get("/me", verifyToken, GetCurrentUser);

export default router;
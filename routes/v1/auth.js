import express from "express";
import { SignUp, SignIn, VerifyEmail, ResendVerificationToken, AdminSignIn, AddAdmin } from "../../controllers/auth/index.js";
import verifyTken from "../../verifyToken.js";

const router = express.Router();

router.post('/signup', SignUp);
router.post('/login', SignIn);
router.post('/verify-email', VerifyEmail);
router.post('/resend-token', ResendVerificationToken);
router.post('/admin/login', AdminSignIn);
router.post('/admin/signup', verifyTken, AddAdmin);



export default router;
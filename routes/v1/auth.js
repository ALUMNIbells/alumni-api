import express from "express";
import { SignUp, SignIn, VerifyEmail, ResendVerificationToken } from "../../controllers/auth/index.js";

const router = express.Router();

router.post('/signup', SignUp);
router.post('/login', SignIn);
router.post('/verify-email', VerifyEmail);
router.post('/resend-token', ResendVerificationToken);


export default router;
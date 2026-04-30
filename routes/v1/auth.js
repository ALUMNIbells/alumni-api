import express from "express";
import { SignUp, SignIn, VerifyEmail, ResendVerificationToken, AdminSignIn, AddAdmin, DeleteAdmin, GetAllAdmins, AdminPasswordResetSend, AdminPasswordResetVerify, studentPasswordResetSend, studentPasswordResetVerify } from "../../controllers/auth/index.js";
import verifyTken from "../../verifyToken.js";

const router = express.Router();

router.post('/signup', SignUp);
router.post('/login', SignIn);
router.post('/verify-email', VerifyEmail);
router.post('/resend-token', ResendVerificationToken);
router.post('/password-reset/send', studentPasswordResetSend);
router.post('/password-reset/verify', studentPasswordResetVerify);
router.post('/admin/login', AdminSignIn);
router.post('/admin/signup', verifyTken, AddAdmin);
router.delete('/admin/:adminId', verifyTken, DeleteAdmin);
router.get('/admin/list', verifyTken, GetAllAdmins);
router.post('/admin/password-reset/send', AdminPasswordResetSend);
router.post('/admin/password-reset/verify', AdminPasswordResetVerify);




export default router;
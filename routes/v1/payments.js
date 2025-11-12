import express from "express";
import { getAllTransactions, getStudentTransactions, initializePayment, VerifyPayment } from "../../controllers/payments/index.js";
import verifyTken from "../../verifyToken.js";

const router = express.Router();

router.post('/initialize-payment', initializePayment);
router.get('/verify-payment/:reference', VerifyPayment);
router.get('/transactions', verifyTken, getAllTransactions);
router.get('/:matricNo', getStudentTransactions);

export default router;
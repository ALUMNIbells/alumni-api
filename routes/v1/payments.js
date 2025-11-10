import express from "express";
import { getStudentTransactions, initializePayment, VerifyPayment } from "../../controllers/payments/index.js";

const router = express.Router();

router.post('/initialize-payment', initializePayment);
router.get('/verify-payment/:reference', VerifyPayment);
router.get('/:matricNo', getStudentTransactions);

export default router;
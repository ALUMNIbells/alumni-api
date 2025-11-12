import express from "express";
import { getAllTransactions, getStudentTransactions, initializePayment, markSouvenirCollected, VerifyPayment } from "../../controllers/payments/index.js";
import verifyTken from "../../verifyToken.js";

const router = express.Router();

router.post('/initialize-payment', initializePayment);
router.get('/verify-payment/:reference', VerifyPayment);
router.patch('/collect-souvenir/:transactionId', verifyTken, markSouvenirCollected)
router.get('/transactions', verifyTken, getAllTransactions); 
router.get('/:matricNo', getStudentTransactions);

export default router;
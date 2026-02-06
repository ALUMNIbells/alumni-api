/**
 * @swagger
 * /payments/initialize-payment:
 *   post:
 *     summary: Initialize a payment
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - matricNo
 *               - fullName
 *               - email
 *               - phone
 *               - type
 *             properties:
 *               matricNo:
 *                 type: string
 *               fullName:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum:
 *                   - ALUMNI_CLEARANCE_DUES
 *                   - SOUVENIR_PURCHASE
 *                   - STUDENT_TRANSCRIPT
 *               items:
 *                 type: array
 *                 description: Required when type is SOUVENIR_PURCHASE
 *                 items:
 *                   type: object
 *                   properties:
 *                     sku:
 *                       type: string
 *                     qty:
 *                       type: number
 *     responses:
 *       200:
 *         description: Payment initialized successfully
 *       400:
 *         description: Validation error
 */


import express from "express";
import { getAllTransactions, getStudentTransactions, initializePayment, markSouvenirCollected, VerifyPayment } from "../../controllers/payments/index.js";
import verifyTken from "../../verifyToken.js";

const router = express.Router();

router.post('/initialize-payment', initializePayment);
router.get('/verify-payment/:reference', VerifyPayment);
router.patch('/collect-souvenir/:transactionId/:sku', verifyTken, markSouvenirCollected)
router.get('/transactions', verifyTken, getAllTransactions); 
router.get('/:matricNo', getStudentTransactions);

export default router;




import axios from "axios";
import Transaction from "../../models/Transaction.js";
import logEvent from "../../utils/logger.js";
import { getEnv } from "swiftenv";
import { generatePdfBuffer } from "../../utils/generatePdfBuffer.js";
import cloudinary from "../../utils/cloudinary.js";
import streamifier from "streamifier";
import SystemState from "../../models/systemState.js";

function addPaystackCharges(amountInNaira) {
  let baseFee = 0.015 * amountInNaira;
  if (amountInNaira > 2500) baseFee += 100;
  if (baseFee > 2000) baseFee = 2000;
  return amountInNaira + baseFee ;
}

export const initializePayment = async (req, res) => {
    const { matricNo, fullName, email, phone, type, college, course} = req.body;
    //check for all the fields
    if (!matricNo ||
        !fullName ||
        !email ||
        !phone
        ) 
    {
    return res.status(400).json({ message: 'Missing required fields.' });
    }
    try {
      
      //get appropraite amount
      const systemState = await SystemState.findOne();
      let amount 
      if(type === 'ALUMNI CLEARANCE DUES'){
        amount = systemState.alumniDues
        //check if user has already paid
        const existingPayment = await Transaction.findOne({ matricNo, email, type: 'ALUMNI CLEARANCE DUES', status: 'completed' });
        if (existingPayment) {
          return res.status(400).json({ message: 'You have already paid for Alumni Clearance Dues. Check Your Transaction history' });
        }
      }else if(type === 'SOURVENIER'){
        amount = systemState.sourvenierPrice
      }
      const finalAmount = addPaystackCharges(amount); 
      const paystackRes = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        email: email,
        name: fullName,
        amount: Math.round(finalAmount * 100), 
        reference: `${matricNo}-${Date.now()}`, 
        metadata: {
          matricNo,
          fullName,
          email,
          phone,
          type,
          college,
          course
        },
        callback_url: getEnv('CALLBACK_URL'),
      },
      {
        headers: {
          Authorization: `Bearer ${getEnv('PAYSTACK_SECRET_KEY')}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const { authorization_url, access_code, reference } = paystackRes.data.data;

    
    const newTransaction = new Transaction({
      matricNo,
      fullName,
      email,
      phone,
      type,
      amount: amount,
      college,
      course,
      paymentref: reference,
    });
    await newTransaction.save();

    await logEvent('PAYMENT_INITIATED', {user: email, ip: req.ip, action: 'Payment Initiated', details: `Payment initiated successfully for ${fullName}-${matricNo}-${phone} payment for ${type}`});

    return res.status(200).json({ authorization_url, reference });
  } catch (err) {
    console.error(err.response?.data || err.message);
    return res.status(500).json({ message: `Payment initialization failed`, err });
  }
};

export const getStudentTransactions = async (req, res) => {
  const { matricNo } = req.params;
  try {
    const transactions = await Transaction.find({ matricNo });
    if (!transactions || transactions.length === 0) {
      return res.status(404).json({ message: 'No transactions found for this student.' });
    }
    return res.status(200).json(transactions);
  }
  catch (error) {
    console.error('Error fetching transactions:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

export const VerifyPayment = async (req, res) => {
  const { reference } = req.params;

  if (!reference) {
    return res.status(400).json({ message: "Payment reference is required." });
  }

  try {
    // 1. Verify via Paystack
    const response = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${getEnv('PAYSTACK_SECRET_KEY')}`,
        "Content-Type": "application/json",
      },
    });

    console.log('Paystack Verification Response');

    const paymentData = response.data.data;
    const transaction = await Transaction.findOne({ paymentref: reference });
    console.log('Transaction from DB:', transaction);
    const paidAt = new Date(paymentData.paid_at).toLocaleString();

    console.log(paidAt);
    console.log(Intl.DateTimeFormat().resolvedOptions());
    console.log(new Date().toLocaleString('en-NG', { timeZone: 'Africa/Lagos' }));

    // 2. Handle Success
    if (paymentData.status === "success") {
      // Generate Receipt PDF
      await logEvent('PAYMENT_SUCCESS', {user: transaction.email, ip: req.ip, action: 'Payment Attempt', details: `Successful payment of ${transaction.amount} for ${transaction.fullName} -${transaction.matricNo} payment for ${transaction.type}`});
      console.log('Generating PDF Receipt...');
      const receipts = await Transaction.find({matricNo: transaction.matricNo, status: 'completed'})
      //receipt number in thousands with leading zeros
      console.log('Number of previous receipts:',  receipts.length.toString().padStart(4, '0'));
      const pdfBuffer = await generatePdfBuffer(transaction, paidAt, receipts.length + 1);

      // Upload to Cloudinary
      const upload = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            resource_type: "raw",
            folder: "receipts",
            public_id: `${reference}.pdf`,
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
        streamifier.createReadStream(pdfBuffer).pipe(stream);
      });
      // Update DB
      const tx = await Transaction.findOneAndUpdate(
        { paymentref: reference },
        { status: "completed", paidAt: new Date(paymentData.paid_at), receiptUrl: upload.secure_url },
        { new: true }
      );

      

      // Respond
      return res.status(200).json({
        message: "Payment successful",
        data: tx,
        // receiptUrl: upload.secure_url,
      });
    }

    // 3. Handle Failure
    if (paymentData.status === "failed") {
      const tx = await Transaction.findOneAndUpdate(
        { paymentref: reference },
        { status: "failed" },
        { new: true }
      );
      await logEvent('PAYMENT_FAILURE', {user: transaction.email, ip: req.ip, action: 'Payment Attempt', details: `Failed payment of ${transaction.amount} for ${transaction.fullName} -${transaction.matricNo} payment for ${transaction.type}`});
      return res.status(400).json({ message: "Payment failed", data: tx });
    }

    // 4. Handle Pending
    return res.status(200).json({
      message: "Payment is still pending",
      data: paymentData,
    });

  } catch (err) {
    console.error("Payment Verification Error:", err.response?.data || err.message);
    return res.status(500).json({ message: "Payment verification failed" });
  }
};

export const getAllTransactions = async (req, res) => {
  try {
    if(req.user.role !== 'admin'){
      return res.status(403).json({ message: 'Unauthorized' });
    }
    const transactions = await Transaction.find({type: req.query.type}).sort({ createdAt: -1 });
    return res.status(200).json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

export const markSouvenirCollected = async (req, res) => {
  const { transactionId } = req.params;
  try {
    if(req.user.role !== 'admin'){
      return res.status(403).json({ message: 'Unauthorized' });
    }
    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    if(transaction.status !== 'completed') {
      return res.status(400).json({ message: 'Cannot collect souvenir for an incomplete transaction' });
    }
    if (transaction.type !== 'ALUMNI CLEARANCE DUES') {
      return res.status(400).json({ message: 'This transaction is not for a souvenir' });
    }
    if (transaction.collectedSouvenir) {
      return res.status(400).json({ message: 'Souvenir has already been collected for this transaction' });
    }

    transaction.collectedSouvenir = true;
    transaction.collectedAt = new Date();
    await transaction.save();

    return res.status(200).json({ message: 'Souvenir marked as collected', transaction });
  } catch (error) {
    console.error('Error marking souvenir as collected:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
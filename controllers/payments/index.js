import axios from "axios";
import Transaction from "../../models/Transaction.js";
import logEvent from "../../utils/logger.js";
import { getEnv, listEnv } from "swiftenv";
import { generatePdfBuffer } from "../../utils/generatePdfBuffer.js";
import cloudinary from "../../utils/cloudinary.js";
import streamifier from "streamifier";
import SystemState from "../../models/systemState.js";
import { welcomeEmailTemplate } from "../../utils/emailTemplates.js";
import { Resend } from "resend";
import PAYMENT_TYPES from "../../utils/paymentConfig.js";
import { getNextReceiptNumber } from "../../utils/getNextReceiptNumber.js";

const {RESEND_API_KEY} = listEnv();
const resend = new Resend(RESEND_API_KEY); 


export const initializePayment = async (req, res) => {
  const { matricNo, fullName, email, phone, type, college, course, sku, qty } = req.body;

  if (!matricNo || !fullName || !email || !phone || !type) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  try {
    const systemState = await SystemState.findOne();
    if (!systemState) {
      return res.status(500).json({ message: "System state not configured." });
    }

    // only lookup souvenir if it is a souvenir purchase
    let souvenir = null;
    if (type === "SOUVENIR_PURCHASE") {
      if (!sku) return res.status(400).json({ message: "SKU is required for souvenir purchases." });

      souvenir = systemState.souvenirs?.find((s) => s.sku === sku && s.active);
      if (!souvenir) return res.status(404).json({ message: "Souvenir not found or is inactive." });
    }

    let amount;

    if (type === "SOUVENIR_PURCHASE") {
      const q = Number(qty ?? 1);
      if (!Number.isFinite(q) || q < 1) {
        return res.status(400).json({ message: "qty must be a number >= 1" });
      }
      amount = q * souvenir.price;
    } else {
      const paymentConfig = PAYMENT_TYPES[type];
      if (!paymentConfig) return res.status(400).json({ message: "Invalid payment type." });

      amount = systemState.fees?.[paymentConfig.amountKey];
      if (amount === undefined || amount === null) {
        return res.status(500).json({ message: `Fee not set for ${type}` });
      }

      // check if user has already paid
      if (type === "ALUMNI CLEARANCE DUES") {
        const existing = await Transaction.findOne({
          matricNo,
          type: "ALUMNI CLEARANCE DUES",
          status: "completed",
        });
        if (existing) {
          return res.status(400).json({ message: "You have already paid Alumni Clearance Dues." });
        }
      }
    }

    const split_code = PAYMENT_TYPES[type]?.splitCode || "";
    const finalAmount = type !== "SOUVENIR_PURCHASE" ? amount + 700 + 300 : amount + 300;
    const isTest = getEnv("PAYSTACK_SECRET_KEY").startsWith("sk_test");
    const payload = {
      email,
      name: fullName,
      amount: Math.round(finalAmount * 100),
      reference: `${matricNo}-${Date.now()}`,
      metadata: { matricNo, fullName, email, phone, type, college, course },
      callback_url: getEnv("CALLBACK_URL"),
    };
    if (!isTest && split_code) {
      payload.split_code = split_code;
    }

    const paystackRes = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      payload,
      {
        headers: {
          Authorization: `Bearer ${getEnv("PAYSTACK_SECRET_KEY")}`,
          "Content-Type": "application/json",
        },
      }
    );

    const { authorization_url, reference } = paystackRes.data.data;

    //items array
    const items = [];

    if (type === "SOUVENIR_PURCHASE") {
      items.push({
        sku: souvenir.sku,
        name: souvenir.name,
        unitPrice: souvenir.price,
        qty: Number(qty ?? 1),
      });
    }

    //Add free souvenir by default for alumni dues
    if (type === "ALUMNI CLEARANCE DUES") {
      const free = systemState.souvenirs?.find((s) => s.sku === "FREE" && s.active);
      if (free) {
        items.push({
          sku: free.sku,
          name: free.name,       
          unitPrice: 0,          
          qty: 1,
        });
      }
      
    }

    const newTransaction = new Transaction({
      matricNo,
      fullName,
      email,
      phone,
      type,
      amount,
      college,
      course,
      paymentref: reference,
      items,
    });

    await newTransaction.save();

    await logEvent("PAYMENT_INITIATED", {
      user: email,
      ip: req.ip,
      action: "Payment Initiated",
      details: `Payment initiated successfully for ${fullName}-${matricNo}-${phone} payment for ${type}`,
    });

    return res.status(200).json({ authorization_url, reference });
  } catch (err) {
    console.error(err.response?.data || err.message);
    return res.status(500).json({ message: "Payment initialization failed" });
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
    const transaction = await Transaction.findOne({ paymentref: reference });
    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found." });
    }
    if (transaction.status === "completed" && transaction.receiptNumber) {
      return res.status(200).json({ message: "Payment already verified", data: transaction });
    }

    // Verify via Paystack
    const response = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${getEnv('PAYSTACK_SECRET_KEY')}`,
        "Content-Type": "application/json",
      },
    });

    console.log('Paystack Verification Response');

    const paymentData = response.data.data;

    const paidAt = new Date(paymentData.paid_at).toLocaleString();
    console.log(paidAt);
    console.log(Intl.DateTimeFormat().resolvedOptions());
    console.log(new Date().toLocaleString('en-NG', { timeZone: 'Africa/Lagos' }));

    // Handle Success
    if (paymentData.status === "success") {
      // Generate Receipt PDF
      await logEvent('PAYMENT_SUCCESS', 
        { user: transaction.email, 
          ip: req.ip, action: 'Payment Attempt', 
          details: `Successful payment of ${transaction.amount} for ${transaction.fullName} -${transaction.matricNo} payment for ${transaction.type}`
        });
      console.log('Generating PDF Receipt...');
      const { receiptSeq, receiptNumber } = await getNextReceiptNumber();
      const pdfBuffer = await generatePdfBuffer(transaction, paidAt, receiptNumber);

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
        { status: "completed", 
          paidAt: new Date(paymentData.paid_at), 
          receiptUrl: upload.secure_url, 
          receiptSeq, 
          receiptNumber
        },
        { new: true }
      );

      if(transaction.type === 'ALUMNI CLEARANCE DUES') {
        const { data, error } = await resend.emails.send({
            from: 'Bells University Alumni Association <noreply@notifications.bellsuniversityalumni.com>',
            to: transaction.email,
            subject: 'Welcome to Bells University Alumni Community',
            html: welcomeEmailTemplate(transaction.fullName),
        });
  
        if (error) {
            return console.error({ error });
        }
  
        console.log({ data });
      }

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
export const reVerifyPaymentMass = async (req, res) => {
  try {
    const transactions = await Transaction.find({ status: "completed" });
      for (const transaction of transactions) {
        if (transaction.status === "completed" && transaction.receiptNumber) {
          console.log(`Skipping already verified transaction: ${transaction.paymentref}`);
          continue;
        }
        const { receiptSeq, receiptNumber } = await getNextReceiptNumber();
        const pdfBuffer = await generatePdfBuffer(transaction, transaction.paidAt, receiptNumber);

        // Upload to Cloudinary
        const upload = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              resource_type: "raw",
              folder: "receipts",
              public_id: `${transaction.paymentref}.pdf`,
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
          { paymentref: transaction.paymentref },
          {
            receiptUrl: upload.secure_url, 
            receiptSeq, 
            receiptNumber
          },
          { new: true }
        );
        console.log(`Re-verified transaction: ${transaction.paymentref}`);
      }
    } catch (err) {
      console.error("Mass Re-Verification Error:", err.response?.data || err.message);
      return res.status(500).json({ message: "Mass re-verification failed" });
    }
};

export const getAllTransactions = async (req, res) => {
  try {
    if(req.user.role !== 'admin'){
      return res.status(403).json({ message: 'Unauthorized' });
    }
    if(req.query.type){
      const validTypes = Object.keys(PAYMENT_TYPES);
      if(!validTypes.includes(req.query.type)){
        return res.status(400).json({ message: 'Invalid type query parameter' });
      }
    const transactions = await Transaction.find({type: req.query.type, status: 'completed'}).sort({ createdAt: -1 });
    return res.status(200).json(transactions);
    }
    const transactions = await Transaction.find({status: 'completed'}).sort({ createdAt: -1 });
    return res.status(200).json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

export const markSouvenirCollected = async (req, res) => {
  const { transactionId, sku } = req.params;

  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (!sku) {
      return res.status(400).json({ message: "sku is required" });
    }

    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    if (transaction.status !== "completed") {
      return res
        .status(400)
        .json({ message: "Cannot fulfill items for an incomplete transaction" });
    }

    // Find the item
    const item = transaction.items?.find((i) => i.sku === sku);
    if (!item) {
      return res.status(404).json({ message: `Item with sku '${sku}' not found in this transaction` });
    }

    // Prevent double fulfillment
    if (item.fulfillment?.status === "fulfilled") {
      return res.status(400).json({ message: "Item has already been fulfilled" });
    }

    // Mark fulfilled
    item.fulfillment = {
      status: "fulfilled",
      fulfilledAt: new Date(),
      fulfilledBy: req.user.email || req.user.id || "admin",
    };

    await transaction.save();

    return res.status(200).json({
      message: "Item marked as fulfilled",
      transaction,
    });
  } catch (error) {
    console.error("Error fulfilling item:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

import SystemState from "../../models/systemState.js";
import Transaction from "../../models/Transaction.js";

export const requestTranscript = async (req, res) => {
    const { matricNo, fullName, email, phone, type, college, course} = req.body;
    //check for all the fields
    if (!matricNo ||
        !fullName ||
        !email ||
        !phone ) 
    {
    return res.status(400).json({ message: 'Missing required fields.' });
    }
    try {
      //get appropraite amount
      const systemState = await SystemState.findOne();
      let amount 
      switch(type){
        case 'ALUMNI CLEARANCE DUES':
          amount = systemState.alumniDues
          //check if user has already paid
          const existingPayment = await Transaction.findOne({ matricNo, email, type: 'ALUMNI CLEARANCE DUES', status: 'completed' });
          if (existingPayment) {
            return res.status(400).json({ message: 'You have already paid for Alumni Clearance Dues. Check Your Transaction history' });
          }
          break;
        case 'HOODIE':
          amount = systemState.sourvenierPrice
          break;
        case 'FAN':
          amount = systemState.sourvenierPrice2
          break;
        case 'ALUMNI DONATION':
          amount = systemState.alumniDonation
          break;
        default:
          return res.status(400).json({ message: 'Invalid payment type.' });
      }

      let split_code;

      switch(type){
        case 'ALUMNI CLEARANCE DUES':
          split_code = 'SPL_qb31b7ThqX'; // Alumni Clearance Dues Payments
          break;
        case 'ALUMNI DONATION':
          split_code = 'SPL_Yz4usMsAJz'; // General Alumni Payments
          break;
        case 'HOODIE':
          split_code = ''; // Hoodie Payments
          break;
        case 'FAN':
          split_code = ''; // Fan Payments
          break;
        default:
          split_code = ''; // Default Split Code
      }
      
      const finalAmount = amount + 300; //add 300 naira paystack charges
      const paystackRes = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        email: email,
        name: fullName,
        amount: Math.round(finalAmount * 100), 
        reference: `${matricNo}-${Date.now()}`,
        split_code: split_code,
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
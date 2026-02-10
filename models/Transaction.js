import mongoose from "mongoose";

const TransactionItemSchema = new mongoose.Schema(
  {
    sku: { type: String, required: true },        
    name: { type: String, required: true },       
    unitPrice: { type: Number, required: true },
    qty: { type: Number, default: 1, min: 1 },
    fulfillment: {
      status: {
        type: String,
        enum: ["unfulfilled", "fulfilled"],
        default: "unfulfilled",
      },
      fulfilledAt: { type: Date },
      fulfilledBy: { type: String },
    },
  },
  { _id: false }
);

const TransactionSchema = new mongoose.Schema({
    matricNo : {type:String, required:true},
    fullName: {type:String, required:true},
    email: {type:String, required:true},
    phone: {type:String, required:true},
    amount: {type:Number, required:true},
    status: {type:String, required:true, enum: ['pending', 'completed', 'failed'], default: 'pending'},
    paymentref: {type:String, required:true},
    paymentMethod: {type:String, required:true, enum: ['card', 'bank_transfer', 'mobile_money'], default: 'card'},
    receiptUrl: {type:String},
    paidAt: {type: Date},
    type: {type:String, required:true, default: 'ALUMNI CLEARANCE DUES', enum: [
        'ALUMNI CLEARANCE DUES', 
        'ALUMNI DONATION',
        'SOUVENIR_PURCHASE',
        'STUDENT TRANSCRIPT'
    ]},
    college: {type:String, required:true}, 
    course: {type:String, required:true},
    items: { type: [TransactionItemSchema], default: [] },
    receiptSeq: { type: Number },
    receiptNumber: { type: String }
},{
    timestamps: true,
});

 const Transaction = mongoose.model('Transaction', TransactionSchema)
 export default Transaction

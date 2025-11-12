import mongoose from "mongoose";


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
    type: {type:String, required:true, default: 'ALUMNI CLEARANCE DUES', enum: ['ALUMNI CLEARANCE DUES', 'SOURVENIER']},
    college: {type:String, required:true}, 
    course: {type:String, required:true},
    collectedSouvenir: { type: Boolean, default: false },
    collectedAt: { type: Date },
    
},{
    timestamps: true,
});

 const Transaction = mongoose.model('Transaction', TransactionSchema)
 export default Transaction

import mongoose from "mongoose";

const StudentTranscriptsSchema = new mongoose.Schema({
    matricNo : {type:String, required:true},
    fullName: {type:String, required:true},
    email: {type:String, required:true},
    phone: {type:String, required:true},
    cgpa: {type: Number, required: true},
    amount: {type:Number, required:true},
    status: {type:String, required:true, enum: ['pending', 'completed', 'failed'], default: 'pending'},
    paymentref: {type:String, required:true},
    paymentMethod: {type:String, required:true, enum: ['card', 'bank_transfer', 'mobile_money'], default: 'card'},
    transcriptUrl: {type:String},
    paidAt: {type: Date},
    college: {type:String, required:true}, 
    course: {type:String, required:true},
},{
    timestamps: true,
});

 const StudentTranscripts = mongoose.model('StudentTranscripts', StudentTranscriptsSchema)
 export default StudentTranscripts

import mongoose from "mongoose";
 

const StudentSchema = new mongoose.Schema({
    matricNo : {type:String, required:true, unique:true},
    fullName: {type:String, required:true},
    email: {type:String, required:true},
    phone: {type:String, required:true},
    college: {type:String, required:true}, 
    course: {type:String, required:true},
    verified: {type:Boolean, default:false},
    password: {type:String, required:true},
    token: {type:String},
    tokenExpiry: {type:Date},
    resetToken: { type: String },
    resetTokenExpiry: { type: Date },
},{
    timestamps: true,
});

 const Student = mongoose.model('Student', StudentSchema)
 export default Student

import mongoose from "mongoose";
 

const StudentSchema = new mongoose.Schema({
    matricNo : {type:String, required:true, unique:true},
    fullName: {type:String, required:true},
    email: {type:String, required:true, unique:true},
    phone: {type:String, required:true},
    college: {type:String, required:true}, 
    course: {type:String, required:true},
    imgurl: {type:String},
    occupation: {type:String},
    address: {type:String},
    description: {type:String},
    verified: {type:Boolean, default:false},
    password: {type:String, required:true},
    token: {type:String},
    tokenExpiry: {type:Date},
    resetToken: { type: String },
    resetTokenExpiry: { type: Date },
    connections: [{ type: mongoose.Schema.Types.ObjectId, ref: "Student" }],
},{
    timestamps: true,
});

 const Student = mongoose.model('Student', StudentSchema)
 export default Student

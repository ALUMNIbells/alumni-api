import mongoose from "mongoose";

const AdminSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },    
    password: { type: String, required: true },
    resetToken: { type: String },
    resetTokenExpiry: { type: Date },
    role: {type: String, default: 'admin', enum: ['admin', 'registrar-admin', 'super-admin']}
}, {
    timestamps: true,
});

const Admin = mongoose.model('Admin', AdminSchema);

export default Admin; 
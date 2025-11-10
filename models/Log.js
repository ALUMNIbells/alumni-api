import mongoose from "mongoose";


const LogSchema = new mongoose.Schema({
    type: { type: String, required: true },
    user: { type: String },
    ip: { type: String},
    action: { type: String},
    details: { type: String},
}, {
    timestamps: true,
});

const Log = mongoose.model('Log', LogSchema);
export default Log; 
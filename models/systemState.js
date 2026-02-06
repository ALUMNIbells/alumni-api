import mongoose from "mongoose";


const systemStateSchema = new mongoose.Schema({
  currentSession: { type: String, required: true },
  lastSession: String,
  alumniDues: Number,
  alumniDonation: Number,
  sourvenierPrice: Number,
  sourvenierPrice2: Number,
  studentTranscript: Number
}, { collection: 'system_state' });

const SystemState = mongoose.model("SystemState", systemStateSchema);
export default SystemState;

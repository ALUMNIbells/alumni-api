import mongoose from "mongoose";

const systemStateSchema = new mongoose.Schema({
  currentSession: { type: String, required: true },
  lastSession: String,

  fees: {
    alumniDues: Number,
    alumniDonation: Number,
    studentTranscript: Number,
  },

  souvenirs: [
    {
      sku: { type: String, required: true },
      name: { type: String, required: true },
      price: { type: Number, default: 0 },
      active: { type: Boolean, default: true }
    }
  ],
  
  counters: {
    receipt: { type: Number, default: 0 },
  }
}, { collection: "system_state" });

const SystemState = mongoose.model("SystemState", systemStateSchema);
export default SystemState;

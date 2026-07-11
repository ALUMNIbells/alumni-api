import mongoose from "mongoose";

const InquirySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    response: { type: String, trim: true },
    status: {
      type: String,
      enum: ["new", "resolved"],
      default: "new",
    },
  },
  {
    timestamps: true,
  }
);

const Inquiry = mongoose.model("Inquiry", InquirySchema);

export default Inquiry;

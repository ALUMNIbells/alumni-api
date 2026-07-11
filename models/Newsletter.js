import mongoose from "mongoose";

const NewsletterSchema = new mongoose.Schema(
  {
    headline: { type: String, required: true, trim: true },
    imgurl: { type: String, required: true, trim: true },
    date: { type: Date, required: true, default: Date.now },
    content: { type: String, required: true, trim: true },
    excerpt: { type: String, required: true, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
  },
  {
    timestamps: true,
  }
);

const Newsletter = mongoose.model("Newsletter", NewsletterSchema);

export default Newsletter;

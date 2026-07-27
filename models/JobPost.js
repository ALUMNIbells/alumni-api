import mongoose from "mongoose";

const JobPostSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

JobPostSchema.index({ author: 1, createdAt: -1 });
JobPostSchema.index({ title: 1, createdAt: -1 });

const JobPost = mongoose.model("JobPost", JobPostSchema);

export default JobPost;
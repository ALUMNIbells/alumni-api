import mongoose from "mongoose";

const JobPostSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "authorModel",
      required: true,
    },
    authorModel: {
      type: String,
      enum: ["Student", "Admin"],
      default: "Student",
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
    verified: {
      type: Boolean,
      default: false,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
    verifiedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

JobPostSchema.index({ author: 1, createdAt: -1 });
JobPostSchema.index({ authorModel: 1, createdAt: -1 });
JobPostSchema.index({ title: 1, createdAt: -1 });
JobPostSchema.index({ verified: 1, active: 1, createdAt: -1 });

const JobPost = mongoose.model("JobPost", JobPostSchema);

export default JobPost;
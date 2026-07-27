import mongoose from "mongoose";

const ConnectionRequestSchema = new mongoose.Schema(
  {
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
    respondedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

ConnectionRequestSchema.index({ requester: 1, recipient: 1, createdAt: -1 });
ConnectionRequestSchema.index({ recipient: 1, status: 1, createdAt: -1 });

const ConnectionRequest = mongoose.model("ConnectionRequest", ConnectionRequestSchema);

export default ConnectionRequest;
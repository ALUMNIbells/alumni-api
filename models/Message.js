import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },
    body: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
    editedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

MessageSchema.index({ sender: 1, recipient: 1, createdAt: -1 });
MessageSchema.index({ recipient: 1, sender: 1, readAt: 1, createdAt: -1 });

const Message = mongoose.model("Message", MessageSchema);

export default Message;
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { Server } from "socket.io";
import Message from "../models/Message.js";
import Student from "../models/Student.js";

let io;

const MESSAGE_EDIT_WINDOW_MS = 10 * 60 * 1000;
const REPLY_PREVIEW_FIELDS = "sender recipient body createdAt";

const getSocketRoom = (studentId) => `student:${studentId}`;

const normalizeToken = (authHeader = "") => {
  if (!authHeader) {
    return "";
  }

  return authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : authHeader;
};

const ensureConnectedStudents = async (senderId, recipientId) => {
  const sender = await Student.findById(senderId).select("connections verified").lean();

  if (!sender || !sender.verified) {
    return { allowed: false, status: 404, message: "Sender not found" };
  }

  const isConnected = (sender.connections || []).some(
    (connectionId) => String(connectionId) === String(recipientId)
  );

  if (!isConnected) {
    return {
      allowed: false,
      status: 403,
      message: "You can only message students you are connected with",
    };
  }

  const recipient = await Student.findById(recipientId).select("_id verified").lean();

  if (!recipient || !recipient.verified) {
    return { allowed: false, status: 404, message: "Recipient not found" };
  }

  return { allowed: true };
};

const normalizeMessageBody = (value) => (typeof value === "string" ? value.trim() : "");

const isWithinEditWindow = (message) => {
  const createdAtMs = new Date(message.createdAt).getTime();
  return Number.isFinite(createdAtMs) && Date.now() - createdAtMs <= MESSAGE_EDIT_WINDOW_MS;
};

const buildPeerMessageQuery = (studentAId, studentBId) => ({
  $or: [
    { sender: studentAId, recipient: studentBId },
    { sender: studentBId, recipient: studentAId },
  ],
});

const formatReplyPayload = (replyTo) => {
  if (!replyTo) {
    return null;
  }

  if (typeof replyTo === "object" && (replyTo._id || replyTo.id)) {
    return {
      id: replyTo._id || replyTo.id,
      sender: String(replyTo.sender),
      recipient: String(replyTo.recipient),
      body: replyTo.body,
      createdAt: replyTo.createdAt,
    };
  }

  return {
    id: replyTo,
  };
};

const getMessageWithReply = async (messageId) =>
  Message.findById(messageId).populate("replyTo", REPLY_PREVIEW_FIELDS);

const formatMessagePayload = (message, currentStudentId) => ({
  id: message._id,
  sender: String(message.sender),
  recipient: String(message.recipient),
  body: message.body,
  replyTo: formatReplyPayload(message.replyTo),
  readAt: message.readAt,
  editedAt: message.editedAt,
  createdAt: message.createdAt,
  updatedAt: message.updatedAt,
  direction: String(message.sender) === String(currentStudentId) ? "sent" : "received",
  isRead: Boolean(message.readAt),
  isEdited: Boolean(message.editedAt),
});

export const initializeSocket = (httpServer, corsOptions) => {
  io = new Server(httpServer, {
    cors: corsOptions,
  });

  io.use((socket, next) => {
    try {
      const token = normalizeToken(
        socket.handshake.auth?.token || socket.handshake.headers?.authorization || ""
      );

      if (!token) {
        return next(new Error("Authentication token is required"));
      }

      const payload = jwt.verify(token, process.env.JWT_SECRET);
      if (payload?.role !== "student") {
        return next(new Error("Only students can connect to chat"));
      }

      socket.user = payload;
      return next();
    } catch (error) {
      return next(new Error("Token is not valid"));
    }
  });

  io.on("connection", (socket) => {
    const studentId = socket.user.id;
    socket.join(getSocketRoom(studentId));

    socket.on("message:send", async (payload = {}, callback = () => {}) => {
      try {
        const recipientId = payload.recipientId;
        const body = normalizeMessageBody(payload.body);
        const replyToMessageId = payload.replyToMessageId;

        if (!recipientId) {
          callback({ ok: false, message: "Recipient ID is required" });
          return;
        }

        if (!body) {
          callback({ ok: false, message: "Message body is required" });
          return;
        }

        let replyTo = null;
        if (replyToMessageId !== undefined && replyToMessageId !== null && replyToMessageId !== "") {
          if (!mongoose.Types.ObjectId.isValid(replyToMessageId)) {
            callback({ ok: false, message: "Invalid reply target ID" });
            return;
          }

          const replyTarget = await Message.findOne({
            _id: replyToMessageId,
            ...buildPeerMessageQuery(studentId, recipientId),
          }).select("_id");

          if (!replyTarget) {
            callback({ ok: false, message: "Reply target message not found" });
            return;
          }

          replyTo = replyTarget._id;
        }

        const message = await Message.create({
          sender: studentId,
          recipient: recipientId,
          body,
          replyTo,
        });

        const hydratedMessage = await getMessageWithReply(message._id);

        const senderPayload = formatMessagePayload(hydratedMessage, studentId);
        const recipientPayload = formatMessagePayload(hydratedMessage, recipientId);

        io.to(getSocketRoom(recipientId)).emit("message:new", recipientPayload);
        io.to(getSocketRoom(studentId)).emit("message:sent", senderPayload);

        callback({ ok: true, data: senderPayload });
      } catch (error) {
        console.error("Socket message send failed:", error);
        callback({ ok: false, message: "Unable to send message" });
      }
    });

    socket.on("message:edit", async (payload = {}, callback = () => {}) => {
      try {
        const messageId = payload.messageId;
        const body = normalizeMessageBody(payload.body);

        if (!messageId) {
          callback({ ok: false, message: "Message ID is required" });
          return;
        }

        if (!body) {
          callback({ ok: false, message: "Message body is required" });
          return;
        }

        const message = await Message.findById(messageId);
        if (!message) {
          callback({ ok: false, message: "Message not found" });
          return;
        }

        if (String(message.sender) !== String(studentId)) {
          callback({ ok: false, message: "You can only edit your own messages" });
          return;
        }

        if (!isWithinEditWindow(message)) {
          callback({ ok: false, message: "Messages can only be edited within 10 minutes" });
          return;
        }

        message.body = body;
        message.editedAt = new Date();
        await message.save();

        const hydratedMessage = await getMessageWithReply(message._id);
        const senderPayload = formatMessagePayload(hydratedMessage, studentId);
        const recipientPayload = formatMessagePayload(hydratedMessage, hydratedMessage.recipient);

        io.to(getSocketRoom(String(hydratedMessage.sender))).emit("message:edited", senderPayload);
        io.to(getSocketRoom(String(hydratedMessage.recipient))).emit("message:edited", recipientPayload);

        callback({ ok: true, data: senderPayload });
      } catch (error) {
        console.error("Socket message edit failed:", error);
        callback({ ok: false, message: "Unable to edit message" });
      }
    });

    socket.on("message:read", async (payload = {}, callback = () => {}) => {
      try {
        const partnerId = payload.partnerId;

        if (!partnerId) {
          callback({ ok: false, message: "Partner ID is required" });
          return;
        }

        const readAt = new Date();
        await Message.updateMany(
          {
            sender: partnerId,
            recipient: studentId,
            readAt: null,
          },
          { $set: { readAt } }
        );

        const receipt = {
          partnerId,
          readAt,
        };

        io.to(getSocketRoom(partnerId)).emit("message:read", {
          partnerId: studentId,
          readAt,
        });
        io.to(getSocketRoom(studentId)).emit("message:read", receipt);

        callback({ ok: true, data: receipt });
      } catch (error) {
        console.error("Socket read receipt failed:", error);
        callback({ ok: false, message: "Unable to mark messages as read" });
      }
    });
  });

  return io;
};

export const getIo = () => io;
export { ensureConnectedStudents, formatMessagePayload, getSocketRoom };
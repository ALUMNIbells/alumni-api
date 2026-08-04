import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import Message from "../models/Message.js";
import Student from "../models/Student.js";

let io;

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

const formatMessagePayload = (message, currentStudentId) => ({
  id: message._id,
  sender: String(message.sender),
  recipient: String(message.recipient),
  body: message.body,
  readAt: message.readAt,
  createdAt: message.createdAt,
  updatedAt: message.updatedAt,
  direction: String(message.sender) === String(currentStudentId) ? "sent" : "received",
  isRead: Boolean(message.readAt),
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
        const body = typeof payload.body === "string" ? payload.body.trim() : "";

        if (!recipientId) {
          callback({ ok: false, message: "Recipient ID is required" });
          return;
        }

        if (!body) {
          callback({ ok: false, message: "Message body is required" });
          return;
        }

        const permission = await ensureConnectedStudents(studentId, recipientId);
        if (!permission.allowed) {
          callback({ ok: false, message: permission.message });
          return;
        }

        const message = await Message.create({
          sender: studentId,
          recipient: recipientId,
          body,
        });

        const senderPayload = formatMessagePayload(message, studentId);
        const recipientPayload = formatMessagePayload(message, recipientId);

        io.to(getSocketRoom(recipientId)).emit("message:new", recipientPayload);
        io.to(getSocketRoom(studentId)).emit("message:sent", senderPayload);

        callback({ ok: true, data: senderPayload });
      } catch (error) {
        console.error("Socket message send failed:", error);
        callback({ ok: false, message: "Unable to send message" });
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
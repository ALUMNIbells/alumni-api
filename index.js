import express from "express";
import http from "http";
import { getEnv, setEnv, removeEnv, listEnv, validateEnv, numberEnv } from 'swiftenv';
import mongoose from "mongoose";
import cors from "cors";
import paymentRoutes from "./routes/v1/payments.js";
import authRoutes from "./routes/v1/auth.js";
import systemStateRoutes from "./routes/v1/systemState.js";
import transcriptRoutes from "./routes/v1/transcript.js";
import websiteStateRoutes from "./routes/v1/websiteState.js";
import newsletterRoutes from "./routes/v1/newsletter.js";
import inquiryRoutes from "./routes/v1/inquiry.js";
import logRoutes from "./routes/v1/log.js";
import studentRoutes from "./routes/v1/students.js";
import electionRoutes from "./routes/v1/elections.js";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./docs/swagger.js";
import { initializeSocket } from "./utils/socket.js";

const app = express();
const server = http.createServer(app);

const connectDB = async () => {
    try {
        await mongoose.connect(getEnv("MONGO_URI"));
        console.log("Connected to MongoDB");
    } catch (error) {
        console.log(error);
    }
};

const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:5500',
  'https://www.bellsuniversityalumni.com',
  'https://bellstechalumni-git-testing-ablesaxs-projects.vercel.app',
  'http://localhost:5000'
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};

app.use(cors(corsOptions));

initializeSocket(server, corsOptions);

app.use(express.json()); 
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/system-state', systemStateRoutes);
app.use('/api/v1/transcript', transcriptRoutes);
app.use('/api/v1/website-state', websiteStateRoutes); 
app.use('/api/v1/newsletters', newsletterRoutes);
app.use('/api/v1/inquiries', inquiryRoutes);
app.use('/api/v1/logs', logRoutes); 
app.use('/api/v1/students', studentRoutes);
app.use('/api/v1/elections', electionRoutes);
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

server.listen(5000, () =>{
    console.log("Server started on port 5000")
    connectDB();
});

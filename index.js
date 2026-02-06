import express from "express";
import { getEnv, setEnv, removeEnv, listEnv, validateEnv, numberEnv } from 'swiftenv';
import mongoose from "mongoose";
import cors from "cors";
import paymentRoutes from "./routes/v1/payments.js";
import authRoutes from "./routes/v1/auth.js";
import systemStateRoutes from "./routes/v1/systemState.js";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./docs/swagger.js";

const app = express();

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
  'https://www.bellsuniversityalumni.com'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json()); 
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/system-state', systemStateRoutes);
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.listen(5000, () =>{
    console.log("Server started on port 5000")
    connectDB();
});

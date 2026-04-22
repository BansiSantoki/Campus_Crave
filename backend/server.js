import express from "express";
import process from "node:process";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import registerRoutes from "./routes/registerRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import stallRoutes from "./routes/stallRoutes.js";
import activityRoutes from "./routes/activityRoutes.js";
import connectDB from "./config/database.js";
import { ensureAdminAccount } from "./services/adminBootstrap.js";
import { ensureStallCollectionsAndData } from "./services/stallBootstrap.js";

// ✅ MUST (TOP)
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());

// Routes
app.use("/api/", registerRoutes);
app.use("/api/", orderRoutes);
app.use("/api/", stallRoutes);
app.use("/api/", activityRoutes);

// Static
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// DB + Server
connectDB().then(async () => {
  try {
    await ensureAdminAccount();
    await ensureStallCollectionsAndData();
  } catch (error) {
    console.error("Failed to ensure admin account:", error.message);
  }

  app.listen(process.env.PORT || 5000, () => {
    console.log("✅ Server running");
    console.log("SID:", process.env.TWILIO_ACCOUNT_SID); // debug
  });
});
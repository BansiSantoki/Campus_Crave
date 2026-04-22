import express from "express";
import process from "node:process";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { Resend } from "resend";

console.log("🔥 SERVER FILE:", import.meta.url);

// Routes
import registerRoutes from "./routes/registerRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import stallRoutes from "./routes/stallRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import activityRoutes from "./routes/activityRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";

// Config
import connectDB from "./config/database.js";
import { ensureAdminAccount } from "./services/adminBootstrap.js";
import { ensureStallCollectionsAndData } from "./services/stallBootstrap.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ ENV LOAD
dotenv.config({ path: path.join(__dirname, ".env"), override: true });

// ✅ DEBUG ENV
console.log("RESEND_API_KEY:", process.env.RESEND_API_KEY ? "Loaded ✅" : "Missing ❌");
console.log("RESEND_FROM_EMAIL:", process.env.RESEND_FROM_EMAIL);

// ✅ RESEND SETUP
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const app = express();

// ✅ Middleware
const configuredClientUrls = String(process.env.CLIENT_URL || "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

const defaultClientUrls = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
];

const allowedOrigins = new Set([...defaultClientUrls, ...configuredClientUrls]);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }

      // Allow local dev origins such as Vite fallback ports and LAN access.
      if (/^https?:\/\/(localhost|127\.0\.0\.1|\d{1,3}(?:\.\d{1,3}){3})(:\d+)?$/i.test(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);

app.use(express.json());

// ✅ Routes
app.use("/api/", registerRoutes);
app.use("/api/", orderRoutes);
app.use("/api/", stallRoutes);
app.use("/api/", categoryRoutes);
app.use("/api/", activityRoutes);
app.use("/api/", reviewRoutes);



// =======================
// 🔥 STEP 1: SIMPLE TEST ROUTE
// =======================
app.get("/test-email", (req, res) => {
  res.send("🔥 TEST ROUTE WORKING");
});



// =======================
// 🔥 STEP 2: REAL EMAIL TEST (OPTIONAL)
// =======================
app.get("/send-test-email", async (req, res) => {
  try {
    console.log("📩 Sending test email...");

    if (!resend) {
      return res.status(400).send("Resend API key is not configured. SMTP mode is active.");
    }

    const testRecipient =
      process.env.RESEND_TEST_TO_EMAIL ||
      process.env.ADMIN_EMAIL ||
      process.env.RESEND_FROM_EMAIL ||
      "bansisantoki2005@gmail.com";

    const response = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
      to: testRecipient,
      subject: "Test Email ✅",
      html: "<h2>Email working successfully 🚀</h2>",
    });

    console.log("✅ Email Response:", response);

    if (response?.error) {
      return res.status(200).send(
        `${response.error.message || "Test email could not be delivered"}\n\nNote: Resend testing mode only allows delivery to verified emails. For real student inbox delivery, verify a domain at resend.com/domains and use a sender on that domain.`,
      );
    } 

    return res.send("✅ Email sent successfully");
  } catch (error) {
    console.error("❌ FULL EMAIL ERROR:", error);
    res.status(500).send("❌ Error sending email");
  }
});

// ✅ Static
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ✅ Start Server
connectDB().then(async () => {
  try {
    await ensureAdminAccount();
    await ensureStallCollectionsAndData();
  } catch (error) {
    console.error("Bootstrap error:", error.message);
  }

  app.listen(process.env.PORT || 5000, () => {
    console.log("🚀 Server running on port", process.env.PORT || 5000);
    console.log("👉 Test URL: http://localhost:5000/test-email");
    console.log("👉 Email Test: http://localhost:5000/send-test-email");
  });
});
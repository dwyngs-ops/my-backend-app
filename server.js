require("dotenv").config();
const express = require("express");
const nodemailer = require("nodemailer");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const cors = require("cors");
const validator = require("validator");

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ 1️⃣ Security middleware
app.use(helmet());
app.use(express.json());

// ✅ 2️⃣ Allow frontend to connect (update your frontend URL)
const allowedOrigins = [
  "https://my-frontend-app-ecru.vercel.app", // your Vercel frontend
  "http://localhost:3000", // for local testing
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS not allowed for this origin"));
      }
    },
  })
);

// ✅ 3️⃣ Fix rate limiter for Render
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  limit: 5, // max 5 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  skipFailedRequests: true,
  keyGenerator: (req, res) => {
    // Render sometimes sends invalid x-forwarded-for header
    return (
      (req.headers["x-real-ip"] ||
        req.headers["x-forwarded-for"] ||
        req.ip ||
        "unknown") + req.originalUrl
    );
  },
});
app.use(limiter);

// ✅ 4️⃣ Contact route
app.post("/api/contact", async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    // Basic input validation
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: "All fields are required." });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ error: "Invalid email address." });
    }

    // ✅ 5️⃣ Setup mail transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER, // your Gmail
        pass: process.env.EMAIL_PASS, // your Gmail App Password
      },
    });

    // ✅ 6️⃣ Send email
    await transporter.sendMail({
      from: `"${name}" <${email}>`,
      to: process.env.EMAIL_USER, // receiver (you)
      subject: subject,
      text: `
Name: ${name}
Email: ${email}

Message:
${message}
      `,
    });

    console.log("✅ Email sent successfully");
    res.json({ success: true, message: "Message sent successfully!" });
  } catch (error) {
    console.error("❌ Contact send error:", error);
    res
      .status(500)
      .json({ error: "Failed to send message. Try again later." });
  }
});

// ✅ 7️⃣ Root route
app.get("/", (req, res) => {
  res.send("✅ Backend is running successfully!");
});

// ✅ 8️⃣ Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

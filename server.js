require("dotenv").config();
const express = require("express");
const nodemailer = require("nodemailer");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const cors = require("cors");
const validator = require("validator");

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ 1. Security & JSON setup
app.use(helmet());
app.use(express.json());

// ✅ 2. Allow frontend (CORS)
const allowedOrigins = [
  "https://my-frontend-app-ecru.vercel.app", // your live frontend on Vercel
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

// ✅ 3. Rate limiter (avoid spam)
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  limit: 5, // allow 5 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  skipFailedRequests: true,
  keyGenerator: (req) => {
    return (
      (req.headers["x-real-ip"] ||
        req.headers["x-forwarded-for"] ||
        req.ip ||
        "unknown") + req.originalUrl
    );
  },
});
app.use(limiter);

// ✅ 4. Contact route
app.post("/api/contact", async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: "All fields are required." });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ error: "Invalid email address." });
    }

    // ✅ 5. Setup nodemailer
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // ✅ 6. Send the mail
    await transporter.sendMail({
      from: `"${name}" <${email}>`,
      to: process.env.EMAIL_USER,
      subject,
      text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
    });

    console.log("✅ Email sent successfully!");
    res.json({ success: true, message: "Message sent successfully!" });
  } catch (error) {
    console.error("❌ Contact send error:", error);
    res.status(500).json({ error: "Failed to send message. Try again later." });
  }
});

// ✅ 7. Simple health check
app.get("/", (req, res) => {
  res.send("✅ Backend is running successfully!");
});

// ✅ 8. Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

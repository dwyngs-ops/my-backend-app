require("dotenv").config();
const express = require("express");
const nodemailer = require("nodemailer");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const cors = require("cors");
const validator = require("validator");

const app = express();
const PORT = process.env.PORT || 5000;

// 1️⃣ Security and JSON setup
app.use(helmet());
app.use(express.json());

// 2️⃣ Allow your frontend to connect
const allowedOrigins = [
  "https://my-frontend-app-ecru.vercel.app", // your frontend on Vercel
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

// 3️⃣ Prevent spam (rate limit)
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  limit: 5, // 5 requests max
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

// 4️⃣ Contact form route
app.post("/api/contact", async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    // check if fields are empty
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: "All fields are required." });
    }

    // check valid email
    if (!validator.isEmail(email)) {
      return res.status(400).json({ error: "Invalid email address." });
    }

    // 5️⃣ setup email sender
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER, // Gmail address
        pass: process.env.EMAIL_PASS, // App password
      },
    });

    // 6️⃣ send the mail
    await transporter.sendMail({
      from: `"${name}" <${email}>`,
      to: process.env.EMAIL_USER,
      subject: subject,
      text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
    });

    console.log("✅ Email sent successfully!");
    res.json({ success: true, message: "Message sent successfully!" });
  } catch (error) {
    console.error("❌ Contact send error:", error);
    res.status(500).json({ error: "Failed to send message. Try again later." });
  }
});

// 7️⃣ Simple test route
app.get("/", (req, res) => {
  res.send("✅ Backend is running successfully!");
});

// 8️⃣ Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

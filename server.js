// ✅ server.js (FINAL VERSION)
import express from "express";
import nodemailer from "nodemailer";
import cors from "cors";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// ✅ Allow frontend (Vercel) to access backend
app.use(
  cors({
    origin: [
      "https://my-frontend-app-ecru.vercel.app", // your Vercel site
      "http://localhost:3000", // for local testing
    ],
    methods: ["POST", "GET"],
  })
);

// Parse JSON requests
app.use(express.json());

// ✅ Health check route (optional)
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// ✅ Contact form route
app.post("/api/contact", async (req, res) => {
  const { name, email, subject, message } = req.body;

  // Basic validation
  if (!name || !email || !message) {
    return res.status(400).json({ error: "Please fill all required fields." });
  }

  try {
    // Create transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER, // Gmail
        pass: process.env.EMAIL_PASS, // Gmail App Password
      },
    });

    // Email content
    const mailOptions = {
      from: `"${name}" <${email}>`,
      to: process.env.TO_EMAIL, // your email to receive contact form messages
      subject: `New Message: ${subject || "No subject"}`,
      text: `You have a new message from your website contact form.\n\nName: ${name}\nEmail: ${email}\nSubject: ${subject}\nMessage:\n${message}`,
    };

    // Send email
    await transporter.sendMail(mailOptions);
    console.log("✅ Email sent successfully");

    res.status(200).json({ success: true, message: "Email sent successfully!" });
  } catch (error) {
    console.error("❌ Mailer Error:", error);
    res
      .status(500)
      .json({ error: "Failed to send message. Try again later.", details: error.message });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));

// ✅ server.js (or index.js)
import express from "express";
import nodemailer from "nodemailer";
import cors from "cors";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// Initialize express
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// POST route for contact form
app.post("/api/contact", async (req, res) => {
  const { name, email, subject, message } = req.body;

  try {
    // Configure mail transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER, // Your Gmail
        pass: process.env.EMAIL_PASS  // Your Gmail App Password
      }
    });

    // Define email options
    const mailOptions = {
      from: email,
      to: process.env.TO_EMAIL, // Your inbox
      subject: `Contact Form: ${subject}`,
      text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`
    };

    // Send the email
    await transporter.sendMail(mailOptions);

    // Respond success
    res.status(200).json({ success: true, message: "Email sent successfully!" });
  } catch (error) {
    console.error("Mailer Error:", error);
    res.status(500).json({ error: "Failed to send message. Try again later." });
  }
});

// Start the server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));

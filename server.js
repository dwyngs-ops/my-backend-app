import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import formData from "form-data";
import Mailgun from "mailgun.js";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

const mailgun = new Mailgun(formData);
const mg = mailgun.client({
  username: "api",
  key: process.env.MAILGUN_API_KEY,
});

app.get("/", (req, res) => {
  res.send("✅ Mailgun backend is live!");
});

app.post("/api/contact", async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: "Please fill all required fields." });
  }

  const data = {
    from: `${name} <mailgun@${process.env.MAILGUN_DOMAIN}>`,
    to: process.env.TO_EMAIL,
    subject: subject || "New Contact Form Submission",
    text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`,
  };

  try {
    const result = await mg.messages.create(process.env.MAILGUN_DOMAIN, data);
    console.log("✅ Mail sent:", result.id);
    res.status(200).json({ success: true, id: result.id });
  } catch (error) {
    console.error("❌ Mailgun Error:", error);
    res.status(500).json({ error: "Failed to send email." });
  }
});

app.listen(process.env.PORT || 10000, () =>
  console.log(`✅ Server running on port ${process.env.PORT || 10000}`)
);

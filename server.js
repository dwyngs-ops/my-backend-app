// ==========================
// D'wyngs Backend - Final Version
// ==========================
require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const validator = require('validator');

const app = express();
const PORT = process.env.PORT || 5000;

// ==========================
// 🛡️  Security & Middleware
// ==========================
app.use(helmet());
app.use(express.json({ limit: '12kb' }));
app.use(express.urlencoded({ extended: true }));

// ✅ Allow frontend origins (Vercel + local)
const corsOptions = {
  origin: [
    "https://my-frontend-app-ecru.vercel.app", // ✅ your frontend domain
    "http://localhost:3000" // ✅ for local testing
  ],
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"],
  credentials: true
};

app.use(cors(corsOptions));

// ==========================
// ⚙️  Rate Limiting
// ==========================
const contactLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 6, // limit each IP to 6 requests per 10 minutes
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ==========================
// 🧩 Check Environment Variables
// ==========================
if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS || !process.env.MAIL_TO) {
  console.warn('⚠️ Missing SMTP or MAIL environment variables. Please check your .env file!');
}

// ==========================
// 📧 Mail Transport Setup
// ==========================
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 465,
  secure: (process.env.SMTP_SECURE === 'true') || true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: { rejectUnauthorized: false },
});

// Verify transporter (debugging)
transporter.verify((err, success) => {
  if (err) {
    console.error('❌ Mail server not ready:', err.message);
  } else {
    console.log('✅ Mail server ready to send emails');
  }
});

// ==========================
// 🩺 Health Check Endpoint
// ==========================
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// ==========================
// 📬 Contact Form Endpoint
// ==========================
app.post('/api/contact', async (req, res) => {
  const { name, email, subject, message } = req.body;

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER, // d.wyngs@gmail.com
        pass: process.env.EMAIL_PASS  // newj owsj kaqn mcmz
      }
    });

    const mailOptions = {
      from: email,
      to: process.env.EMAIL_USER,
      subject: `New Message from ${name}: ${subject}`,
      text: `From: ${name}\nEmail: ${email}\n\nMessage:\n${message}`
    };

    await transporter.sendMail(mailOptions);
    res.json({ success: true, message: 'Message sent successfully!' });
  } catch (error) {
    console.error('❌ Error sending email:', error);
    res.status(500).json({ error: 'Failed to send message. Try again later.' });
  }
});


    // Sanitize inputs
    const cleanName = validator.escape(validator.stripLow(name));
    const cleanEmail = validator.normalizeEmail(email);
    const cleanSubject = validator.escape(subject || 'Website Enquiry');
    const cleanMessage = validator.escape(message);

    // Create HTML email
    const mailHtml = `
      <div style="font-family:Arial,Helvetica,sans-serif;color:#0a0a0a;">
        <h2>New Contact from D'wyngs Website</h2>
        <p><strong>Name:</strong> ${cleanName}</p>
        <p><strong>Email:</strong> ${cleanEmail}</p>
        <p><strong>Subject:</strong> ${cleanSubject}</p>
        <hr/>
        <p>${cleanMessage.replace(/\n/g, '<br/>')}</p>
        <hr/>
        <small style="color:#666;">Received: ${new Date().toLocaleString()}</small>
      </div>
    `;

    // Email options
    const mailOptions = {
      from: `"${process.env.MAIL_FROM_NAME || "D'wyngs"}" <${process.env.MAIL_FROM_ADDRESS || process.env.SMTP_USER}>`,
      to: process.env.MAIL_TO,
      subject: `Website Contact: ${cleanSubject}`,
      text: `${cleanMessage}\n\nFrom: ${cleanName} <${cleanEmail}>`,
      html: mailHtml,
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent:', info.messageId);

    res.json({ success: true, message: 'Message sent successfully!' });
  } catch (err) {
    console.error('❌ Contact send error:', err.message || err);
    res.status(500).json({ error: 'Failed to send message. Try again later.' });
  }
});

// ==========================
// 🚀 Start the Server
// ==========================
app.listen(PORT, () => {
  console.log(`🚀 D'wyngs backend running on port ${PORT}`);
});

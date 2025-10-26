// server.js
require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const validator = require('validator');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(helmet());
app.use(express.json({ limit: '12kb' })); // accept JSON
app.use(express.urlencoded({ extended: true }));
// CORS setup
const allowedOrigins = [
  'http://localhost:5500',             // local dev (if using Live Server)
  'http://127.0.0.1:5500',            // local dev alternate
  'https://my-frontend-app-ecru.vercel.app' // your live frontend on Vercel
];

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`Blocked CORS request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST'],
  credentials: false, // no cookies needed for this API
}));

// Basic rate limiter: allow 6 requests per 10 minutes per IP (adjust as needed)
const contactLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 6,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Verify required env
if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS || !process.env.MAIL_TO) {
  console.warn('Warning: Missing SMTP / MAIL env variables. Check .env file.');
}

// Create transporter (works with Gmail SMTP or any other SMTP service)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 465,
  secure: (process.env.SMTP_SECURE === 'true') || true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  // TLS options (optional)
  tls: {
    rejectUnauthorized: false
  }
});

// simple health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// contact endpoint
app.post('/api/contact', contactLimiter, async (req, res) => {
  try {
    const { name, email, subject = '', message } = req.body || {};

    // Basic validation
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email and message are required.' });
    }
    if (!validator.isEmail(email)) {
      return res.status(400).json({ error: 'Invalid email address.' });
    }

    // sanitize
    const cleanName = validator.escape(validator.stripLow(name));
    const cleanEmail = validator.normalizeEmail(email);
    const cleanSubject = validator.escape(subject || 'Website enquiry');
    const cleanMessage = validator.escape(message);

    // compose HTML email
    const mailHtml = `
      <div style="font-family:Arial,Helvetica,'Segoe UI',sans-serif;color:#0a0a0a;">
        <h2 style="color:#111;">New contact from D'wyngs website</h2>
        <p><strong>Name:</strong> ${cleanName}</p>
        <p><strong>Email:</strong> ${cleanEmail}</p>
        <p><strong>Subject:</strong> ${cleanSubject}</p>
        <hr/>
        <p>${cleanMessage.replace(/\n/g, '<br/>')}</p>
        <hr/>
        <p style="font-size:12px;color:#666;">Received: ${new Date().toLocaleString()}</p>
      </div>
    `;

    const mailOptions = {
      from: `"${process.env.MAIL_FROM_NAME || "D'wyngs"}" <${process.env.MAIL_FROM_ADDRESS || process.env.SMTP_USER}>`,
      to: process.env.MAIL_TO,
      subject: `Website Contact: ${cleanSubject}`,
      text: `${cleanMessage}\n\nFrom: ${cleanName} <${cleanEmail}>`,
      html: mailHtml
    };

    // send email
    const info = await transporter.sendMail(mailOptions);

    return res.json({ success: true, info: { messageId: info.messageId } });

  } catch (err) {
    console.error('Contact send error:', err?.message || err);
    return res.status(500).json({ error: 'Failed to send message. Try again later.' });
  }
});

// start server
app.listen(PORT, () => {
  console.log(`D'wyngs backend running on port ${PORT}`);
}); 

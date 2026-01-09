// server.js — PRODUCTION READY

require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const { Resend } = require('resend');

const app = express();
const PORT = process.env.PORT || 3001;

// ===== CONFIG =====
const resend = new Resend(process.env.RESEND_API_KEY);
const RECIPIENT_EMAIL = 'glowemeka@gmail.com'; // <-- WHERE YOU RECEIVE EMAILS

// ===== MIDDLEWARE =====
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ===== ROOT ROUTE (PREVENTS "Cannot GET /") =====
app.get('/', (req, res) => {
  res.send('Glore Classique backend is live.');
});

// ===== CONTACT FORM =====
app.post('/api/send-contact', async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ success: false, error: 'Missing fields' });
  }

  try {
    await resend.emails.send({
      from: 'Glore Classique <onboarding@resend.dev>', // VERIFIED
      to: RECIPIENT_EMAIL,
      subject: 'New Contact Form Submission',
      html: `
        <h2>Contact Form</h2>
        <p><b>Name:</b> ${name}</p>
        <p><b>Email:</b> ${email}</p>
        <p><b>Message:</b><br>${message.replace(/\n/g, '<br>')}</p>
      `,
      reply_to: email
    });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ===== ORDER / CHECKOUT EMAIL =====
app.post('/api/send-email', async (req, res) => {
  const data = req.body;

  try {
    await resend.emails.send({
      from: 'Glore Classique <onboarding@resend.dev>',
      to: RECIPIENT_EMAIL,
      subject: 'New Order from Glore Classique',
      html: `
        <h2>New Order</h2>
        <p><b>Name:</b> ${data.name}</p>
        <p><b>Email:</b> ${data.email}</p>
        <p><b>Phone:</b> ${data.phone}</p>
        <p><b>Address:</b> ${data.address}, ${data.city}, ${data.state}</p>
        <p><b>Instructions:</b> ${data.instructions || ''}</p>
        <h3>Order Summary</h3>
        <pre>${JSON.stringify(data.cart, null, 2)}</pre>
      `,
      reply_to: data.email
    });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ===== PROOF OF PAYMENT (WITH ATTACHMENT) =====
const upload = multer({ dest: 'uploads/' });

app.post('/api/send-proof', upload.single('proofFile'), async (req, res) => {
  const { payerName, payerEmail, orderInfo } = req.body;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ success: false, error: 'No file uploaded' });
  }

  try {
    await resend.emails.send({
      from: 'Glore Classique <onboarding@resend.dev>',
      to: RECIPIENT_EMAIL,
      subject: 'Proof of Payment Uploaded',
      html: `
        <h2>Proof of Payment</h2>
        <p><b>Name:</b> ${payerName}</p>
        <p><b>Email:</b> ${payerEmail}</p>
        <p><b>Order Info:</b> ${orderInfo || ''}</p>
      `,
      attachments: [
        {
          filename: file.originalname,
          content: fs.readFileSync(file.path) // ✅ BUFFER — REQUIRED BY RESEND
        }
      ],
      reply_to: payerEmail
    });

    fs.unlinkSync(file.path); // cleanup temp file

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ===== START SERVER =====
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

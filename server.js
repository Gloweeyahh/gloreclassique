// --- Contact form email ---
app.post('/api/send-contact', async (req, res) => {
  const { name, email, message } = req.body;
  try {
    await resend.emails.send({
      from: 'Glore Classique <noreply@gloreclassique.com>',
      to: glowemeka@gmail.com,
      subject: 'New Contact Form Submission',
      html: `<h2>Contact Form Submission</h2>
        <p><b>Name:</b> ${name}</p>
        <p><b>Email:</b> ${email}</p>
        <p><b>Message:</b><br>${message.replace(/\n/g, '<br>')}</p>`
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
// server.js - Express backend to receive all form submissions and subscriptions

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const multer = require('multer');
const { Resend } = require('resend');
require('dotenv').config();
const app = express();
const PORT = process.env.PORT || 3001;

const resend = new Resend(process.env.RESEND_API_KEY);
const RECIPIENT_EMAIL = 'glowemeka@gmail.com'; // <-- PUT YOUR EMAIL HERE


app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


// --- Email order/checkout form ---
app.post('/api/send-email', async (req, res) => {
  const data = req.body;
  try {
    await resend.emails.send({
      from: 'Glore Classique <noreply@gloreclassique.com>',
      to: glowemeka@gmail.com, // <-- YOUR EMAIL
      subject: 'New Order from Glore Classique',
      html: `<h2>New Order</h2>
        <p><b>Name:</b> ${data.name}</p>
        <p><b>Email:</b> ${data.email}</p>
        <p><b>Phone:</b> ${data.phone}</p>
        <p><b>Address:</b> ${data.address}, ${data.city}, ${data.state}</p>
        <p><b>Instructions:</b> ${data.instructions || ''}</p>
        <h3>Order Summary</h3>
        <div>${data.summary || ''}</div>
        <pre>${JSON.stringify(data.cart, null, 2)}</pre>`
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- Email proof of payment (with file upload) ---
const upload = multer({ dest: 'uploads/' });
app.post('/api/send-proof', upload.single('proofFile'), async (req, res) => {
  const { payerName, payerEmail, orderInfo } = req.body;
  const file = req.file;
  try {
    await resend.emails.send({
      from: 'Glore Classique <noreply@gloreclassique.com>',
      to: glowemeka@gmail.com, // <-- YOUR EMAIL
      subject: 'Proof of Payment Upload',
      html: `<h2>Proof of Payment</h2>
        <p><b>Name:</b> ${payerName}</p>
        <p><b>Email:</b> ${payerEmail}</p>
        <p><b>Order Info:</b> ${orderInfo || ''}</p>
        <p>See attached proof of payment.</p>`,
      attachments: file ? [{
        filename: file.originalname,
        path: file.path
      }] : []
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

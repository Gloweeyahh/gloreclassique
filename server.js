// server.js - Express backend to receive all form submissions and subscriptions
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Store submissions in a file (for demo; use a DB in production)
const saveSubmission = (type, data) => {
  const entry = { type, ...data, date: new Date().toISOString() };
  fs.appendFileSync('submissions.json', JSON.stringify(entry) + '\n');
};

// Generic endpoint for all forms
app.post('/api/submit', (req, res) => {
  saveSubmission('form', req.body);
  res.json({ success: true, message: 'Form received!' });
});

// Subscription endpoint
app.post('/api/subscribe', (req, res) => {
  saveSubmission('subscribe', req.body);
  res.json({ success: true, message: 'Subscription received!' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const express = require('express');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const cors = require('cors');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000; // Use environment variable for port

// Middleware

app.use(cors({ origin: process.env.CLIENT_URL || '*' })); // Allow requests from React frontend
app.use(bodyParser.json());

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD,
  },
});

// Email route to handle form submission

app.post('/send-email', (req, res) => {
  const {
    first_name,
    last_name,
    email,
    amount,
    thoughts,
    date,
    contributionsCount,
    publish_name,
  } = req.body;

  // Create the email message with donor data
  const mailContent = `
    New Donation Details:
    ---------------------
    Name: ${first_name} ${last_name}
    Email: ${email}
    Amount Donated: $${amount}
    Message: ${thoughts ? thoughts : 'No message provided'}
    Donation Date: ${date}
    Contributions Count: ${contributionsCount}
    Publish Name: ${publish_name ? 'Yes' : 'No'}
  `;

  const mailOPtions = {
    from: email,
    to: process.env.ADMIN_EMAIL,
    replyTo: email,
    subject: `New Donation from ${first_name} ${last_name}`,
    text: mailContent,
  };

  transporter.sendMail(mailOPtions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
      return res.status(500).send('Failed to send donation details.');
    }
    res.status(200).send('Donation details sent successfully!');
  });
});

// Start the server and listen on all network interfaces
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://0.0.0.0:${PORT}`);
});

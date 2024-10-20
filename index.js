const express = require('express');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const moment = require('moment');

const cors = require('cors');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000; // Use environment variable for port

// Middleware

app.use(cors({ origin: process.env.CLIENT_URL })); // Allow requests from React frontend
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

  // Use "Valued Donor" if first_name is not provided
  const donorFirstName = first_name || 'Valued Donor';

  // Format the donation date in a user-friendly format (e.g., "October 1, 2024")
  const formattedDate = moment(date).format('MMMM D, YYYY');

  // Create the email content for admin (plain text)
  const adminMailContent = `
    New Donation Received:
    ------------------------------------
    Name: ${donorFirstName} ${last_name || ''}
    Email: ${email}
    Amount Donated: $${amount}
    Message: ${thoughts ? thoughts : 'No message provided'}
    Donation Date: ${formattedDate}
    Contributions Count: ${contributionsCount}
    Publish Name: ${publish_name ? 'Yes' : 'No'}
  `;

  const clientMailContent = `
  <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; padding: 20px; background: url('https://nepal-flood-support-image-server.onrender.com/images/thankyou.webp') no-repeat center center; background-size: cover;">
    <div style="background-color: rgba(255, 255, 255, 0.85); padding: 30px; border-radius: 12px; max-width: 600px; margin: 0 auto; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);">
      <h2 style="color: #4CAF50; text-align: center;">Thank You, ${donorFirstName}!</h2>
      <p style="color: #333; font-size: 16px;">
        Dear ${donorFirstName},<br><br>
        Thank you for your generous donation of <strong>$${amount}</strong> towards the Nepal Flood Relief efforts.
        We have received your contribution on <strong>${formattedDate}</strong>, and it will go a long way in helping those affected by the flood.
      </p>
      ${
        thoughts
          ? `<p style="color: #333; font-style: italic;">Your message: "${thoughts}"</p>`
          : ''
      }
      <p style="color: #333; font-size: 16px;">
        If you have any further thoughts or messages, feel free to reach out to us at 
        <a href="mailto:${
          process.env.ADMIN_EMAIL
        }" style="color: #4CAF50; text-decoration: none;">${
    process.env.ADMIN_EMAIL
  }</a>. 
        We truly appreciate your support.
      </p>
      <div style="border-top: 1px solid #ddd; margin-top: 30px; padding-top: 10px;">
        <p style="font-size: 14px; color: #777; text-align: center;">
          Warm regards,<br>
          <strong>Nepal Flood Relief Team</strong><br>
          <a href="https://nepal-flood-support.vercel.app/" style="color: #4CAF50; text-decoration: none;">Visit our website</a>
        </p>
      </div>
    </div>
  </div>
`;

  const adminMailOptions = {
    from: email,
    to: process.env.ADMIN_EMAIL,
    subject: `New Donation from ${donorFirstName} ${last_name || ''}`,
    text: adminMailContent,
  };

  const clientMailOptions = {
    from: process.env.EMAIL,
    to: email,
    subject: `Thank You ${donorFirstName} for Your Donation!`,
    html: clientMailContent,
  };

  // Send both emails (to admin and client)
  Promise.all([
    transporter.sendMail(adminMailOptions),
    transporter.sendMail(clientMailOptions),
  ])
    .then(() => {
      res.status(200).json({
        status: 'success',
        message:
          'Donation details sent successfully to admin, and acknowledgment sent to donor!',
      });
    })
    .catch(error => {
      console.error('Error sending email:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to send donation details.',
        error: error.message,
      });
    });
});

// to handle contact detail and message from contributor
app.post('/send-message', (req, res) => {
  const { name, email, message } = req.body;

  // Create the HTML email content
  const mailContent = `
    <h2>Message from curious donor</h2>
    <p><strong>Name:</strong> ${name}</p>
    <p><strong>Email:</strong> ${email}</p>
    <p><strong>Message:</strong> ${
      message ? message : 'No message provided'
    }</p>
  `;

  const mailOptions = {
    from: email,
    to: process.env.ADMIN_EMAIL,
    replyTo: email,
    subject: `New Message from Contributor: ${name}`,
    html: mailContent,
  };

  // Send the email
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending contact email:', error);
      return res.status(500).json({ error: 'Failed to send contact details.' });
    }
    return res
      .status(200)
      .json({ message: 'Contact details sent successfully!' });
  });
});

// Start the server and listen on all network interfaces
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://0.0.0.0:${PORT}`);
});

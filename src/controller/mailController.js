// mailController.js (ES Module)

import sendEmail from '../utility/sendEmail.js';

export async function sendContactEmail(req, res) {
  const { name, email, message } = req.body;

  // Check if the required fields are missing for admin email
  if (!name || !email || !message) {
    return res.status(400).json({ message: 'Please provide name, email, and message.' });
  }

  try {
    // Send email to admin (even if partial)
    const adminEmailResult = await sendEmail({
      name,
      email,
      message,
      toEmail: process.env.TO_EMAIL, // You can override with a specific admin email
      subject: `New Contact Form Submission from ${name}`,
      message: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`,
    });

    // Send a thank-you email to the user
    const userThankYouEmail = await sendEmail({
      name: 'Md Faruk Khan SEO',
      email: process.env.FROM_EMAIL,
      toEmail: email,
      subject: 'Thank You for Your Submission!',
      message: `Hello ${name},\n\nThank you for reaching out! We have received your meeting request and will get back to you on time.`,
    });

    // Respond back with success
    return res.status(200).json({
      message: 'Form submitted successfully, emails sent.',
      data: { adminEmailResult, userThankYouEmail },
    });
  } catch (error) {
    console.error('Email Controller Error:', error);
    return res.status(500).json({ message: 'Failed to send email', error: error.message });
  }
}

export async function sendPartialFormData(req, res) {
  const { name, email, message, ...rest } = req.body;

  try {
    // Format a detailed message including any extra fields
    let formattedMessage = '';

    if (name) formattedMessage += `Name: ${name}\n`;
    if (email) formattedMessage += `Email: ${email}\n`;
    if (message) formattedMessage += `Message: ${message}\n`;

    // Add any additional fields (like step 1 data, etc.)
    for (const [key, value] of Object.entries(rest)) {
      formattedMessage += `${key}: ${value}\n`;
    }

    // Send the email to admin
    const adminEmailResult = await sendEmail({
      name: name || 'Unknown User',
      email: email || 'Not provided',
      toEmail: process.env.TO_EMAIL, // Admin email
      subject: `Partial Form Submission${name ? ` from ${name}` : ''}`,
      message: formattedMessage || 'User exited the form without submitting any data.',
    });

    return res.status(200).json({
      message: 'Partial form data sent to admin.',
      data: adminEmailResult,
    });
  } catch (error) {
    console.error('Partial Form Email Error:', error);
    return res.status(500).json({
      message: 'Failed to send partial form data',
      error: error.message,
    });
  }
}

export async function sendVerificationCode(req, res) {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    // generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // save OTP temporarily (Redis, DB, or in-memory for demo)
    // Example: req.app.locals[email] = otp; (not safe for production)
    req.app.locals[email] = otp;

    await sendEmail({
      email: process.env.FROM_EMAIL,
      toEmail: email,
      subject: 'SEO Verification Code',
      message: `Your email verification code is: ${otp}`
    });

    return res.status(200).json({ message: 'Verification code sent' });
  } catch (error) {
    console.error('Verification Email Error:', error);
    return res.status(500).json({ message: 'Failed to send verification code' });
  }
}

export async function verifyCode(req, res) {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ message: 'Email and code are required' });
  }

  // Compare with stored code
  if (req.app.locals[email] === code) {
    delete req.app.locals[email]; // clear once verified
    return res.status(200).json({ message: 'Email verified successfully' });
  }

  return res.status(400).json({ message: 'Invalid or expired verification code' });
}
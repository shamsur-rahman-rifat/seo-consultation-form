import axios from 'axios';

async function sendEmail({
  name,
  email,
  toEmail,
  subject,
  message,
}) {
  const MJ_API_KEY = process.env.MJ_API_KEY;
  const MJ_API_SECRET = process.env.MJ_API_SECRET;
  const FROM_EMAIL = process.env.FROM_EMAIL;
  const TO_EMAIL = toEmail || process.env.TO_EMAIL; // allow override

  if (!MJ_API_KEY || !MJ_API_SECRET || !FROM_EMAIL || !TO_EMAIL) {
    throw new Error('Mailjet API credentials or emails not configured in environment variables');
  }

  const finalSubject =
    subject || (name ? `New Contact Form Submission from ${name}` : 'New Email');
  const finalTextPart = message || 'No message provided.';
  
  const payload = {
    Messages: [
      {
        From: {
          Email: FROM_EMAIL,
          Name: 'Md Faruk Khan SEO',
        },
        To: [
          {
            Email: TO_EMAIL,
            Name: 'Recipient',
          },
        ],
        Subject: finalSubject,
        TextPart: finalTextPart,
        CustomID: 'UniversalEmail',
      },
    ],
  };

  const response = await axios.post('https://api.mailjet.com/v3.1/send', payload, {
    auth: {
      username: MJ_API_KEY,
      password: MJ_API_SECRET,
    },
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return response.data;
}

export default sendEmail;

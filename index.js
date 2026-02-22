const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { parseArgs } = require('util');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ─────────────────────────────────────────
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));

app.use(express.json());

// ─── Health Check ───────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'MedConnect API is running.' });
});


// ─── Brevo Email Function ───────────────────────────────
async function sendMail(toEmail) {
  return axios.post(
    "https://api.brevo.com/v3/smtp/email",
    {
      sender: {
        name: "MedConnect",
        email: process.env.BREVO_EMAIL,
      },
      to: [
        {
          email: toEmail,
        },
      ],
      params: {
        email: toEmail,
      },
      subject: "Hello from MedConnect!",
      htmlContent: `
     
<!DOCTYPE html>
<html>
  <body style="margin:0; padding:0; background-color:#f4f6f8; font-family:Arial, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:12px; padding:40px; box-shadow:0 4px 12px rgba(0,0,0,0.08);">

            <!-- Logo / Header -->
            <tr>
              <td align="center" style="padding-bottom:20px;">
                <h1 style="margin:0; color:#2563eb;">🎉 Welcome to MedConnect!</h1>
              </td>
            </tr>

            <!-- Success Message -->
            <tr>
              <td style="text-align:center; padding:20px 0;">
                <h2 style="margin:0; color:#111827;">You’ve Successfully Onboarded!</h2>
                <p style="color:#6b7280; font-size:16px; line-height:24px; margin-top:15px;">
                  Congratulations! <sup>{{params.email}}</sup> </br> Your account has been successfully created and verified.
                  You are now ready to explore all the features MedConnect has to offer.
                </p>
              </td>
            </tr>

            <!-- CTA Button -->
           

            <!-- Divider -->
            <tr>
              <td style="border-top:1px solid #e5e7eb; padding-top:20px;">
                <p style="color:#9ca3af; font-size:14px; text-align:center;">
                  If you have any questions, feel free to contact our support team.
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding-top:20px; text-align:center;">
                <p style="font-size:12px; color:#9ca3af;">
                  © 2026 MedConnect. All rights reserved.
                </p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
      `,
    },
    {
      headers: {
        accept: "application/json",
        "api-key": process.env.BREVO_API_KEY,
        "content-type": "application/json",
      },
    }
  );
}


// ─── POST /api/send ─────────────────────────────────────
app.post('/api/send', async (req, res) => {
  const { selectedEmails } = req.body;


  if (!selectedEmails || !Array.isArray(selectedEmails)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid payload. Expected { selectedEmails: [] }',
    });
  }

  if (selectedEmails.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No emails provided.',
    });
  }

  try {
    // Send emails in parallel
    await Promise.all(selectedEmails.map(email => sendMail(email)));

    res.json({
      success: true,
      message: 'Emails sent successfully',
      count: selectedEmails.length
    });

  } catch (error) {
    console.error(error.response?.data || error.message);

    res.status(500).json({
      success: false,
      error: error.response?.data || error.message,
    });
  }
});


// ─── Start Server ───────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 MedConnect API running at http://localhost:${PORT}`);
});
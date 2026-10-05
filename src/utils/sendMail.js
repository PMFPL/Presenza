// const nodemailer = require('nodemailer');
// const dotenv = require("dotenv");
// const path = require("path");

// dotenv.config({ path: path.join(__dirname, "../../.env") });

// /* -------------------- Transporter -------------------- */
// const transporter = nodemailer.createTransport({
//   host: process.env.SMTP_HOST,
//   port: Number(process.env.SMTP_PORT),
//   secure: process.env.SMTP_SECURE === 'true', // true for 465, false for 587
//   auth: {
//     user: process.env.SMTP_USER,
//     pass: process.env.SMTP_PASS,
//   },
// });

// /* -------------------- Verify Transporter -------------------- */
// transporter.verify((error) => {
//   if (error) {
//     console.error('❌ Email service not ready:', error);
//   } else {
//   }
// });

// /* -------------------- Send Email -------------------- */
// const sendEmail = async (to, subject, text, html = null) => {
//   try {
//     const mailOptions = {
//       from: `"Paul Presenza" <${process.env.EMAIL_FROM}>`,
//       to,
//       subject,
//       text,
//       html,
//     };

//     await transporter.sendMail(mailOptions);
//     return true;
//   } catch (error) {
//     console.error('❌ Failed to send email:', error);
//     throw new Error('Email delivery failed');
//   }
// };

// module.exports = sendEmail;



const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const path = require('path');

// --------------------------------------------------
// Determine environment
// --------------------------------------------------

const nodeEnv = process.env.NODE_ENV || 'development';

const envFileMap = {
  development: '.env',
  uat: '.env.uat',
  production: '.env.prod',
};

const envFile = envFileMap[nodeEnv];

if (!envFile) {
  throw new Error(
    `Invalid NODE_ENV: ${nodeEnv}. Expected development, uat, or production.`
  );
}

// --------------------------------------------------
// Load environment configuration
// --------------------------------------------------

dotenv.config({
  path: path.join(__dirname, '../../', envFile),
  override: true,
});

console.log('=================================');
console.log('Email Service Configuration');
console.log('=================================');
console.log(`Environment: ${process.env.NODE_ENV}`);
console.log(`Env file: ${envFile}`);
console.log(`SMTP Host: ${process.env.SMTP_HOST}`);
console.log(`SMTP Port: ${process.env.SMTP_PORT}`);
console.log(`SMTP User: ${process.env.SMTP_USER}`);
console.log('=================================');

// --------------------------------------------------
// SMTP Transporter
// --------------------------------------------------

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,

  secure: process.env.SMTP_SECURE === 'true',

  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },

  // Reuse SMTP connections
  pool: true,

  // Maximum simultaneous SMTP connections
  maxConnections: 5,

  // Maximum messages per connection
  maxMessages: 100,

  // Connection timeout
  connectionTimeout: 10000,

  // SMTP greeting timeout
  greetingTimeout: 10000,

  // Socket timeout
  socketTimeout: 30000,
});

// --------------------------------------------------
// Verify SMTP connection
// --------------------------------------------------

transporter
  .verify()
  .then(() => {
    console.log(
      `✅ Email service ready | Environment: ${process.env.NODE_ENV}`
    );
  })
  .catch((error) => {
    console.error(
      `❌ Email service not ready | Environment: ${process.env.NODE_ENV}`,
      error.message
    );
  });

// --------------------------------------------------
// Send Email
// --------------------------------------------------

const sendEmail = async (to, subject, text, html = null) => {
  try {
    const mailOptions = {
      from: `"Paul Presenza" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
      to,
      subject,
      text,
    };

    if (html) {
      mailOptions.html = html;
    }

    const info = await transporter.sendMail(mailOptions);

    console.log(
      `📧 Email sent | Environment: ${process.env.NODE_ENV} | To: ${to} | MessageId: ${info.messageId}`
    );

    return true;
  } catch (error) {
    console.error('❌ Failed to send email:', {
      environment: process.env.NODE_ENV,
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
    });

    throw new Error('Email delivery failed');
  }
};

module.exports = sendEmail;

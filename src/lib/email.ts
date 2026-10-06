import nodemailer from "nodemailer";

interface SendMailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

// Create a transporter using SMTP
// If these are not configured, it will fail, which is expected for an unconfigured environment
const getTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_PORT === "465",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
};

export async function sendEmail({ to, subject, text, html }: SendMailOptions) {
  const isUnconfigured = !process.env.SMTP_HOST || process.env.SMTP_HOST === "smtp.yourprovider.com" || process.env.SMTP_HOST === "";

  // If SMTP config is completely missing or dummy, we handle it based on environment
  if (isUnconfigured) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[DEV] Password reset email service is not configured.");
      const resetUrlMatch = text.match(/https?:\/\/[^\s]+/);
      const resetUrl = resetUrlMatch ? resetUrlMatch[0] : "URL not found in text";
      console.warn(`[DEV] Reset URL: ${resetUrl}`);
      return;
    } else {
      throw new Error("Email configuration is missing in production.");
    }
  }

  const transporter = getTransporter();

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || '"Aryahs Support" <support@aryahs.example.com>',
    to,
    subject,
    text,
    html,
  });
}

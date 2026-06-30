import nodemailer from 'nodemailer';

const smtpPort = parseInt(process.env.SMTP_PORT || '587');

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: smtpPort,
  secure: smtpPort === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendMail({ to, subject, html }: { to: string; subject: string; html: string }) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('⚠️ SMTP config is missing. Mail not sent:', subject);
    return false;
  }

  try {
    await transporter.sendMail({
      from: `"Hệ thống" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`✅ Mail sent to ${to}: ${subject}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to send mail:', error);
    return false;
  }
}

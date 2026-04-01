import nodemailer from 'nodemailer';
import { env } from '@config/env.js';
import { logger } from './logger.js';

interface SendEmailOptions {
  to: string;
  subject: string;
  message: string;
  attachments?: { path: string }[];
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: env.EMAIL, pass: env.EMAIL_PASSWORD },
  tls: { rejectUnauthorized: false },
});

export const sendEmailService = async ({
  to,
  subject,
  message,
  attachments = [],
}: SendEmailOptions): Promise<boolean> => {
  try {
    const info = await transporter.sendMail({
      from: `"E-Commerce 🛒" <${env.EMAIL}>`,
      to,
      subject,
      html: message,
      attachments,
    });
    return info.accepted.length > 0;
  } catch (err) {
    logger.error('sendEmailService failed', { error: err, to });
    return false;
  }
};

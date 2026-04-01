import { env } from '@config/env.js';

interface EmailTemplateOptions {
  subject: string;
  link?: string;
  linkData?: string;
  otp?: string;
}

export const emailTemplate = ({ link, linkData, subject, otp }: EmailTemplateOptions): string => {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<style>
  body { background-color: #88BDBF; margin: 0; font-family: Arial, sans-serif; }
</style>
<body>
<table border="0" width="50%" style="margin:auto;padding:30px;background-color:#F3F3F3;border:1px solid #630E2B;">
  <tr><td>
    <table border="0" width="100%">
      <tr>
        <td><h1 style="color:#630E2B;">E-Commerce</h1></td>
        <td><p style="text-align:right;"><a href="${env.FRONTEND_URL}" style="text-decoration:none;">View Website</a></p></td>
      </tr>
    </table>
  </td></tr>
  <tr><td>
    <table border="0" cellpadding="0" cellspacing="0" style="text-align:center;width:100%;background-color:#fff;">
      <tr><td style="background-color:#630E2B;height:80px;font-size:36px;color:#fff;padding:10px;">🛒</td></tr>
      <tr><td><h1 style="padding-top:25px;color:#630E2B;">${subject}</h1></td></tr>
      <tr><td style="padding:20px 40px;">
        ${
          link && linkData
            ? `<a href="${link}" style="margin:10px 0 30px;border-radius:4px;padding:12px 24px;border:0;color:#fff;background-color:#630E2B;text-decoration:none;font-size:16px;">${linkData}</a>`
            : ''
        }
        ${otp ? `<h3>Your OTP Code: <span style="color:#630E2B;font-weight:bold;font-size:24px;margin-left:8px;">${otp}</span></h3><p style="color:#666;">This code expires in 1 hour.</p>` : ''}
      </td></tr>
    </table>
  </td></tr>
  <tr><td style="text-align:center;padding:20px 0;">
    ${env.FACEBOOK_LINK ? `<a href="${env.FACEBOOK_LINK}" style="margin:0 8px;">Facebook</a>` : ''}
    ${env.INSTAGRAM_LINK ? `<a href="${env.INSTAGRAM_LINK}" style="margin:0 8px;">Instagram</a>` : ''}
    ${env.TWITTER_LINK ? `<a href="${env.TWITTER_LINK}" style="margin:0 8px;">Twitter</a>` : ''}
  </td></tr>
</table>
</body>
</html>`;
};

import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

let transporter: Transporter | null = null;

async function getTransporter(): Promise<Transporter> {
  if (transporter) return transporter;

  if (process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host:   process.env.SMTP_HOST,
      port:   Number(process.env.SMTP_PORT ?? 587),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  } else {
    // Dev fallback: Ethereal catch-all account
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host:   'smtp.ethereal.email',
      port:   587,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass }
    });
    console.log('[email] No SMTP_HOST set — using Ethereal test account');
    console.log(`[email] Preview emails at https://ethereal.email (user: ${testAccount.user})`);
  }

  return transporter;
}

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  const t    = await getTransporter();
  const from = process.env.SMTP_FROM ?? 'noreply@example.com';

  const info = await t.sendMail({
    from,
    to,
    subject: 'Reset your password',
    text:    `You requested a password reset.\n\nClick the link below to set a new password (expires in 1 hour):\n\n${resetUrl}\n\nIf you did not request this, you can safely ignore this email.`,
    html:    `<p>You requested a password reset.</p><p><a href="${resetUrl}">Reset your password</a> (expires in 1 hour)</p><p>If you did not request this, you can safely ignore this email.</p>`
  });

  if (!process.env.SMTP_HOST) {
    console.log(`[email] Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
  }
}

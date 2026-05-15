import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { getTemplate } from './templates/index.js';

export { registerTemplate, getTemplate } from './templates/index.js';
export type { EmailTemplate, TemplateContext, RenderedEmail, EmailBlock } from './templates/index.js';

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

export async function sendEmail(opts: {
  to:      string;
  subject: string;
  html:    string;
  text:    string;
}): Promise<void> {
  const t    = await getTransporter();
  const from = process.env.SMTP_FROM ?? 'noreply@example.com';

  const info = await t.sendMail({ from, ...opts });

  if (!process.env.SMTP_HOST) {
    console.log(`[email] Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
  }
}

export async function sendInviteEmail(to: string, inviteUrl: string, inviterName?: string): Promise<void> {
  const appName = process.env.SMTP_FROM
    ? process.env.SMTP_FROM.replace(/^.*?<|>.*$/g, '').trim() || 'Architectonic'
    : 'Architectonic';

  const intro = inviterName
    ? `${inviterName} has invited you to join ${appName}.`
    : `You've been invited to join ${appName}.`;

  const template = getTemplate('default');
  const { subject, html, text } = template({
    appName,
    title:     `You're invited to ${appName}`,
    preheader: intro,
    blocks: [
      {
        type:    'text',
        content: `${intro} Click the button below to set up your account. This invitation expires in <strong>7 days</strong>.`
      },
      {
        type:  'action',
        url:   inviteUrl,
        label: 'Accept invitation'
      },
      { type: 'divider' },
      {
        type:    'note',
        content: 'If you were not expecting this invitation, you can safely ignore this email.'
      }
    ]
  });

  await sendEmail({ to, subject, html, text });
}

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  const appName = process.env.SMTP_FROM
    ? process.env.SMTP_FROM.replace(/^.*?<|>.*$/g, '').trim() || 'Architectonic'
    : 'Architectonic';

  const template = getTemplate('default');
  const { subject, html, text } = template({
    appName,
    title:     'Reset your password',
    preheader: 'We received a request to reset the password for your account.',
    blocks: [
      {
        type:    'text',
        content: 'We received a request to reset the password for your account. Click the button below to choose a new password. This link expires in <strong>1 hour</strong>.'
      },
      {
        type:  'action',
        url:   resetUrl,
        label: 'Reset password'
      },
      { type: 'divider' },
      {
        type:    'note',
        content: 'If you did not request a password reset, no action is needed — your password will remain unchanged.'
      }
    ]
  });

  await sendEmail({ to, subject, html, text });
}

import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

// ── Transporter (singleton) ──────────────────────────────────────────────────

let _transporter: Transporter | null = null;

async function getTransporter(): Promise<Transporter> {
  if (_transporter) return _transporter;

  if (process.env.SMTP_HOST) {
    _transporter = nodemailer.createTransport({
      host:   process.env.SMTP_HOST,
      port:   Number(process.env.SMTP_PORT ?? 587),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth:   { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  } else {
    const test = await nodemailer.createTestAccount();
    _transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email', port: 587, secure: false,
      auth: { user: test.user, pass: test.pass },
    });
    console.log('[email] No SMTP_HOST — using Ethereal. Preview at https://ethereal.email');
    console.log(`[email] Ethereal credentials: ${test.user} / ${test.pass}`);
  }

  return _transporter;
}

// ── Send wrapper ─────────────────────────────────────────────────────────────

async function sendMail(opts: {
  to:      string;
  subject: string;
  html:    string;
  text:    string;
}): Promise<void> {
  const t    = await getTransporter();
  const from = process.env.SMTP_FROM ?? 'noreply@example.com';
  const info = await t.sendMail({ from, ...opts });
  if (!process.env.SMTP_HOST) {
    console.log(`[email] "${opts.subject}" → ${opts.to}`);
    console.log(`[email] Preview: ${nodemailer.getTestMessageUrl(info)}`);
  }
}

// ── HTML layout template ──────────────────────────────────────────────────────
//
// Structural only — no inline styles. Style hooks:
//   .email-wrapper  .email-header  .email-brand
//   .email-body     .email-heading .email-cta  .email-cta-link
//   .email-footer   .email-note

interface LayoutOpts {
  heading: string;
  body:    string;                           // HTML — paragraphs, lists, etc.
  cta?:    { label: string; url: string };  // primary action button
  note?:   string;                          // footer note (expiry, ignore notice)
}

function layout(opts: LayoutOpts): string {
  const appName = process.env.APP_NAME ?? 'Architectonic';
  const cta = opts.cta
    ? `<p class="email-cta"><a class="email-cta-link" href="${opts.cta.url}">${opts.cta.label}</a></p>`
    : '';
  const footer = opts.note
    ? `<div class="email-footer"><p class="email-note">${opts.note}</p></div>`
    : '';
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${opts.heading}</title>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-header">
      <p class="email-brand">${appName}</p>
    </div>
    <div class="email-body">
      <h1 class="email-heading">${opts.heading}</h1>
      ${opts.body}
      ${cta}
    </div>
    ${footer}
  </div>
</body>
</html>`;
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function sendInviteEmail(to: string, inviteUrl: string, inviterName?: string): Promise<void> {
  const appName = process.env.APP_NAME ?? 'Architectonic';
  const intro = inviterName
    ? `${inviterName} has invited you to join ${appName}.`
    : `You've been invited to join ${appName}.`;
  await sendMail({
    to,
    subject: `You're invited to join ${appName}`,
    html: layout({
      heading: `You're invited to ${appName}`,
      body:    `<p>${intro}</p>
                <p>Click the button below to set up your account. This invitation expires in 7 days.</p>`,
      cta:  { label: 'Accept invitation', url: inviteUrl },
      note: 'If you were not expecting this invitation, you can safely ignore this email.',
    }),
    text: [
      `You're invited to join ${appName}`,
      '',
      intro,
      'Click the link below to set up your account (expires in 7 days):',
      '',
      inviteUrl,
      '',
      'If you were not expecting this invitation, you can safely ignore this email.',
    ].join('\n'),
  });
}

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  await sendMail({
    to,
    subject: 'Reset your password',
    html: layout({
      heading: 'Reset your password',
      body:    `<p>We received a request to reset the password for this account.</p>
                <p>Click the button below to choose a new password. This link expires in 1 hour.</p>`,
      cta:  { label: 'Reset password', url: resetUrl },
      note: 'If you did not request this, you can safely ignore this email.',
    }),
    text: [
      'Reset your password',
      '',
      'We received a request to reset the password for this account.',
      'Click the link below to choose a new password (expires in 1 hour):',
      '',
      resetUrl,
      '',
      'If you did not request this, you can safely ignore this email.',
    ].join('\n'),
  });
}

export async function sendPasswordSetEmail(to: string, firstName: string, setUrl: string): Promise<void> {
  await sendMail({
    to,
    subject: 'Create your password — Welcome to the Client Portal',
    html: layout({
      heading: `Welcome, ${firstName}`,
      body:    `<p>Your client portal account has been created.</p>
                <p>Click the button below to set your password and get started.
                   This link expires in 48 hours.</p>`,
      cta:  { label: 'Set your password', url: setUrl },
      note: 'If you did not expect this email, you can safely ignore it.',
    }),
    text: [
      `Welcome, ${firstName}`,
      '',
      'Your client portal account has been created.',
      'Set your password using the link below (expires in 48 hours):',
      '',
      setUrl,
      '',
      'If you did not expect this email, you can safely ignore it.',
    ].join('\n'),
  });
}

// ── Finance ───────────────────────────────────────────────────────────────────

export async function sendInvoiceEmail(to: string, opts: {
  invoiceNumber: string;
  total:         number;
  currency:      string;
  invoiceUrl:    string;
}): Promise<void> {
  const appName  = process.env.APP_NAME ?? 'Us';
  const formatted = new Intl.NumberFormat('en-US', { style: 'currency', currency: opts.currency }).format(opts.total);
  await sendMail({
    to,
    subject: `Invoice ${opts.invoiceNumber} from ${appName}`,
    html: layout({
      heading: `Invoice ${opts.invoiceNumber}`,
      body:    `<p>Please find your invoice of ${formatted} attached.</p>`,
      cta:     { label: 'View Invoice', url: opts.invoiceUrl },
      note:    'Reply to this email if you have any questions.',
    }),
    text: `Invoice ${opts.invoiceNumber}\n\nAmount: ${formatted}\n\nView: ${opts.invoiceUrl}`,
  });
}

export async function sendInvoiceOverdueEmail(to: string, opts: {
  invoiceNumber: string;
  total:         number;
  currency:      string;
  dueDate:       Date;
  invoiceUrl:    string;
}): Promise<void> {
  const formatted = new Intl.NumberFormat('en-US', { style: 'currency', currency: opts.currency }).format(opts.total);
  const dueDateStr = opts.dueDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  await sendMail({
    to,
    subject: `Invoice ${opts.invoiceNumber} is overdue`,
    html: layout({
      heading: `Invoice ${opts.invoiceNumber} is overdue`,
      body:    `<p>Your invoice of ${formatted} was due on ${dueDateStr} and has not been paid.</p>
                <p>Please arrange payment at your earliest convenience.</p>`,
      cta:     { label: 'View Invoice', url: opts.invoiceUrl },
      note:    'Reply to this email if you have any questions.',
    }),
    text: `Invoice ${opts.invoiceNumber} is overdue\n\nAmount: ${formatted}\nDue: ${dueDateStr}\n\nView: ${opts.invoiceUrl}`,
  });
}

export async function sendTicketNotificationEmail(to: string, opts: {
  ticketId:    string;
  title:       string;
  submittedBy: string;
  ticketUrl:   string;
}): Promise<void> {
  await sendMail({
    to,
    subject: `New support ticket: ${opts.title}`,
    html: layout({
      heading: 'New support ticket',
      body:    `<p><strong>${opts.submittedBy}</strong> submitted a new support ticket.</p>
                <p><strong>Title:</strong> ${opts.title}</p>`,
      cta:     { label: 'View ticket', url: opts.ticketUrl },
    }),
    text: `New support ticket\n\nFrom: ${opts.submittedBy}\nTitle: ${opts.title}\n\nView: ${opts.ticketUrl}`,
  });
}

// ── Calendar ──────────────────────────────────────────────────────────────────

export async function sendCalendarNewEventEmail(to: string, opts: {
  title:   string;
  label:   string;
  dateStr: string;
  url:     string;
}): Promise<void> {
  await sendMail({
    to,
    subject: `New event: ${opts.title}`,
    html: layout({
      heading: `New ${opts.label}: ${opts.title}`,
      body:    `<p>A new event has been shared with you.</p>
                <p><strong>Date:</strong> ${opts.dateStr}</p>`,
      cta: { label: 'View event', url: opts.url },
    }),
    text: [
      `New event: ${opts.title}`,
      '',
      `Date: ${opts.dateStr}`,
      '',
      opts.url,
    ].join('\n'),
  });
}

export async function sendCalendarReminderEmail(to: string, opts: {
  title:   string;
  dateStr: string;
  when:    string;
  url:     string;
}): Promise<void> {
  await sendMail({
    to,
    subject: `Reminder: ${opts.title} ${opts.when}`,
    html: layout({
      heading: `Reminder: ${opts.title}`,
      body:    `<p>This event ${opts.when}.</p>
                <p><strong>Date:</strong> ${opts.dateStr}</p>`,
      cta: { label: 'View event', url: opts.url },
    }),
    text: [
      `Reminder: ${opts.title} ${opts.when}`,
      '',
      `Date: ${opts.dateStr}`,
      '',
      opts.url,
    ].join('\n'),
  });
}

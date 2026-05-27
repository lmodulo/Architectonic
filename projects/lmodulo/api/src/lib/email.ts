import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import type { Db } from 'mongodb';

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

// ── Brand cache ───────────────────────────────────────────────────────────────

interface BrandConfig { name: string; logo: string }

let _emailBrand: BrandConfig = {
  name: process.env.APP_NAME ?? 'L Modulo',
  logo: '',
};

export async function initEmailBrand(db: Db): Promise<void> {
  const settings = await db.collection('settings')
    .find({ key: { $in: ['brand.name', 'brand.logo'] } })
    .toArray();
  const name = settings.find((s: any) => s.key === 'brand.name')?.value ?? _emailBrand.name;
  const logo = settings.find((s: any) => s.key === 'brand.logo')?.value ?? '';
  _emailBrand = { name: String(name), logo: String(logo) };
  console.log(`[email] Brand loaded: name="${_emailBrand.name}" logo="${_emailBrand.logo || 'none'}"`);
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

interface LayoutOpts {
  heading: string;
  body:    string;                           // HTML — paragraphs, lists, etc.
  cta?:    { label: string; url: string };  // primary action button
  note?:   string;                          // footer note (expiry, ignore notice)
}

function layout(opts: LayoutOpts): string {
  const { name: brandName, logo: brandLogo } = _emailBrand;

  // Only render logo if it's a non-SVG image (email clients don't support SVG)
  const showLogoImg = brandLogo && !brandLogo.endsWith('.svg');
  const appUrl = process.env.APP_URL ?? '';
  const logoSrc = showLogoImg
    ? (brandLogo.startsWith('http') ? brandLogo : `${appUrl}${brandLogo}`)
    : '';

  const headerContent = showLogoImg
    ? `<img src="${logoSrc}" alt="${brandName}" height="48" style="display:block;height:48px;max-width:240px;border:0;" />`
    : `<span style="font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:300;letter-spacing:6px;color:#ffffff;text-transform:uppercase;">${brandName}</span>`;

  const ctaHtml = opts.cta
    ? `<p style="margin:32px 0 0;text-align:center;">
         <a href="${opts.cta.url}" style="display:inline-block;background-color:#371840;color:#ffffff;font-family:-apple-system,Helvetica,Arial,sans-serif;font-size:15px;font-weight:500;text-decoration:none;padding:14px 32px;border-radius:6px;letter-spacing:0.3px;">${opts.cta.label}</a>
       </p>`
    : '';

  const footerHtml = opts.note
    ? `<tr>
         <td style="background-color:#f5f5f5;padding:24px 40px;text-align:center;border-top:1px solid #e8e8e8;">
           <p style="margin:0;font-family:-apple-system,Helvetica,Arial,sans-serif;font-size:12px;color:#999999;line-height:1.5;">${opts.note}</p>
         </td>
       </tr>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${opts.heading}</title>
</head>
<body style="margin:0;padding:0;background-color:#f0f0f0;-webkit-text-size-adjust:100%;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f0f0;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background-color:#371840;padding:48px 40px;text-align:center;">
              ${headerContent}
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;background-color:#ffffff;">
              <h1 style="margin:0 0 20px;font-family:-apple-system,Helvetica,Arial,sans-serif;font-size:22px;font-weight:600;color:#111111;line-height:1.3;">${opts.heading}</h1>
              <div style="font-family:-apple-system,Helvetica,Arial,sans-serif;font-size:15px;color:#444444;line-height:1.7;">
                ${opts.body}
              </div>
              ${ctaHtml}
            </td>
          </tr>

          ${footerHtml}

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function sendInviteEmail(to: string, inviteUrl: string, inviterName?: string): Promise<void> {
  const appName = _emailBrand.name;
  const intro = inviterName
    ? `${inviterName} has invited you to join ${appName}.`
    : `You've been invited to join ${appName}.`;
  await sendMail({
    to,
    subject: `You're invited to join ${appName}`,
    html: layout({
      heading: `You're invited to ${appName}`,
      body:    `<p style="margin:0 0 12px;">${intro}</p>
                <p style="margin:0;">Click the button below to set up your account. This invitation expires in 7 days.</p>`,
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
      body:    `<p style="margin:0 0 12px;">We received a request to reset the password for this account.</p>
                <p style="margin:0;">Click the button below to choose a new password. This link expires in 1 hour.</p>`,
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
      body:    `<p style="margin:0 0 12px;">Your client portal account has been created.</p>
                <p style="margin:0;">Click the button below to set your password and get started.
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
  const appName  = _emailBrand.name;
  const formatted = new Intl.NumberFormat('en-US', { style: 'currency', currency: opts.currency }).format(opts.total);
  await sendMail({
    to,
    subject: `Invoice ${opts.invoiceNumber} from ${appName}`,
    html: layout({
      heading: `Invoice ${opts.invoiceNumber}`,
      body:    `<p style="margin:0;">Please find your invoice of ${formatted} attached.</p>`,
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
      body:    `<p style="margin:0 0 12px;">Your invoice of ${formatted} was due on ${dueDateStr} and has not been paid.</p>
                <p style="margin:0;">Please arrange payment at your earliest convenience.</p>`,
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
      body:    `<p style="margin:0 0 12px;"><strong>${opts.submittedBy}</strong> submitted a new support ticket.</p>
                <p style="margin:0;"><strong>Title:</strong> ${opts.title}</p>`,
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
      body:    `<p style="margin:0 0 12px;">A new event has been shared with you.</p>
                <p style="margin:0;"><strong>Date:</strong> ${opts.dateStr}</p>`,
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

// ── Contracts ─────────────────────────────────────────────────────────────────

export async function sendContractSigningEmail(to: string, opts: {
  signerName:    string;
  contractTitle: string;
  signingUrl:    string;
  expiryDays:    number;
}): Promise<void> {
  const appName = _emailBrand.name;
  await sendMail({
    to,
    subject: `Please sign: ${opts.contractTitle}`,
    html: layout({
      heading: `Signature requested: ${opts.contractTitle}`,
      body:    `<p style="margin:0 0 12px;">Hi ${opts.signerName},</p>
                <p style="margin:0 0 12px;">${appName} has sent you a document for your electronic signature.</p>
                <p style="margin:0;">Please review and sign at your earliest convenience. This link expires in ${opts.expiryDays} days.</p>`,
      cta:  { label: 'Review & Sign', url: opts.signingUrl },
      note: 'If you were not expecting this request, please contact the sender directly.',
    }),
    text: [
      `Signature requested: ${opts.contractTitle}`,
      '',
      `Hi ${opts.signerName},`,
      '',
      `${appName} has sent you a document for your electronic signature.`,
      `Review and sign here (expires in ${opts.expiryDays} days):`,
      '',
      opts.signingUrl,
      '',
      'If you were not expecting this, contact the sender directly.',
    ].join('\n'),
  });
}

export async function sendContractSignedEmail(to: string, opts: {
  signerName:    string;
  contractTitle: string;
  contractUrl:   string;
  fullyExecuted: boolean;
}): Promise<void> {
  const heading = opts.fullyExecuted
    ? `${opts.contractTitle} — Fully Executed`
    : `${opts.signerName} signed ${opts.contractTitle}`;
  const body = opts.fullyExecuted
    ? `<p style="margin:0;">All parties have signed <strong>${opts.contractTitle}</strong>. The contract is now fully executed.</p>`
    : `<p style="margin:0 0 12px;"><strong>${opts.signerName}</strong> has signed <strong>${opts.contractTitle}</strong>.</p>
       <p style="margin:0;">Awaiting remaining signatures before the contract is fully executed.</p>`;
  await sendMail({
    to,
    subject: heading,
    html: layout({ heading, body, cta: { label: 'View Contract', url: opts.contractUrl } }),
    text: `${heading}\n\nView: ${opts.contractUrl}`,
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
      body:    `<p style="margin:0 0 12px;">This event ${opts.when}.</p>
                <p style="margin:0;"><strong>Date:</strong> ${opts.dateStr}</p>`,
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

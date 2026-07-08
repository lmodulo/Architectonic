import { sendEmail, getTemplate } from './email/index.js';

function resolveAppName(): string {
  return process.env.SMTP_FROM
    ? process.env.SMTP_FROM.replace(/^.*?<|>.*$/g, '').trim() || 'Architectonic'
    : 'Architectonic';
}

function fmtCurrency(total: number, currency: string): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(total);
}

export async function sendInvoiceEmail(to: string, opts: {
  invoiceNumber: string;
  total:         number;
  currency:      string;
  invoiceUrl:    string;
}): Promise<void> {
  const appName = resolveAppName();
  const formatted = fmtCurrency(opts.total, opts.currency);
  const template = getTemplate('default');
  const { subject, html, text } = template({
    appName,
    title:     `Invoice ${opts.invoiceNumber}`,
    preheader: `Your invoice of ${formatted} is ready.`,
    blocks: [
      { type: 'text', content: `Please find your invoice of ${formatted} attached.` },
      { type: 'action', url: opts.invoiceUrl, label: 'View Invoice' },
      { type: 'divider' },
      { type: 'note', content: 'Reply to this email if you have any questions.' }
    ]
  });

  await sendEmail({ to, subject, html, text });
}

export async function sendInvoiceOverdueEmail(to: string, opts: {
  invoiceNumber: string;
  total:         number;
  currency:      string;
  dueDate:       Date;
  invoiceUrl:    string;
}): Promise<void> {
  const appName    = resolveAppName();
  const formatted  = fmtCurrency(opts.total, opts.currency);
  const dueDateStr = opts.dueDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const template   = getTemplate('default');
  const { subject, html, text } = template({
    appName,
    title:     `Invoice ${opts.invoiceNumber} is overdue`,
    preheader: `Your invoice of ${formatted} was due on ${dueDateStr}.`,
    blocks: [
      {
        type:    'text',
        content: `Your invoice of ${formatted} was due on ${dueDateStr} and has not been paid. Please arrange payment at your earliest convenience.`
      },
      { type: 'action', url: opts.invoiceUrl, label: 'View Invoice' },
      { type: 'divider' },
      { type: 'note', content: 'Reply to this email if you have any questions.' }
    ]
  });

  await sendEmail({ to, subject, html, text });
}

import { sendEmail, getTemplate } from './email/index.js';

function resolveAppName(): string {
  return process.env.SMTP_FROM
    ? process.env.SMTP_FROM.replace(/^.*?<|>.*$/g, '').trim() || 'Architectonic'
    : 'Architectonic';
}

export async function sendContractSigningEmail(to: string, opts: {
  signerName:    string;
  contractTitle: string;
  signingUrl:    string;
  expiryDays:    number;
}): Promise<void> {
  const appName = resolveAppName();
  const template = getTemplate('default');
  const { subject, html, text } = template({
    appName,
    title:     `Signature requested: ${opts.contractTitle}`,
    preheader: `${appName} has sent you a document for your electronic signature.`,
    blocks: [
      {
        type:    'text',
        content: `Hi ${opts.signerName}, ${appName} has sent you a document for your electronic signature. Please review and sign at your earliest convenience. This link expires in <strong>${opts.expiryDays} days</strong>.`
      },
      { type: 'action', url: opts.signingUrl, label: 'Review & Sign' },
      { type: 'divider' },
      {
        type:    'note',
        content: 'If you were not expecting this request, please contact the sender directly.'
      }
    ]
  });

  await sendEmail({ to, subject, html, text });
}

export async function sendContractSignedEmail(to: string, opts: {
  signerName:    string;
  contractTitle: string;
  contractUrl:   string;
  fullyExecuted: boolean;
}): Promise<void> {
  const appName = resolveAppName();
  const title = opts.fullyExecuted
    ? `${opts.contractTitle} — Fully Executed`
    : `${opts.signerName} signed ${opts.contractTitle}`;
  const body = opts.fullyExecuted
    ? `All parties have signed <strong>${opts.contractTitle}</strong>. The contract is now fully executed.`
    : `<strong>${opts.signerName}</strong> has signed <strong>${opts.contractTitle}</strong>. Awaiting remaining signatures before the contract is fully executed.`;

  const template = getTemplate('default');
  const { subject, html, text } = template({
    appName,
    title,
    blocks: [
      { type: 'text', content: body },
      { type: 'action', url: opts.contractUrl, label: 'View Contract' }
    ]
  });

  await sendEmail({ to, subject, html, text });
}

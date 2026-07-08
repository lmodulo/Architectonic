import { sendEmail, getTemplate } from './email/index.js';

function resolveAppName(): string {
  return process.env.SMTP_FROM
    ? process.env.SMTP_FROM.replace(/^.*?<|>.*$/g, '').trim() || 'Architectonic'
    : 'Architectonic';
}

export async function sendPasswordSetEmail(to: string, firstName: string, setUrl: string): Promise<void> {
  const appName = resolveAppName();
  const template = getTemplate('default');
  const { subject, html, text } = template({
    appName,
    title:     `Welcome, ${firstName}`,
    preheader: 'Your client portal account has been created.',
    blocks: [
      {
        type:    'text',
        content: 'Your client portal account has been created. Click the button below to set your password and get started. This link expires in <strong>48 hours</strong>.'
      },
      { type: 'action', url: setUrl, label: 'Set your password' },
      { type: 'divider' },
      { type: 'note', content: 'If you did not expect this email, you can safely ignore it.' }
    ]
  });

  await sendEmail({ to, subject, html, text });
}

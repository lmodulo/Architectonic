import type { EmailTemplate, TemplateContext, RenderedEmail, EmailBlock } from './index.js';

function renderBlock(block: EmailBlock): { html: string; text: string } {
  switch (block.type) {
    case 'text':
      return {
        html: `<tr><td style="padding:0 0 18px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#374151;">${block.content}</td></tr>`,
        text: block.content + '\n\n'
      };

    case 'action':
      return {
        html: `<tr><td style="padding:8px 0 24px 0;">
<!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${block.url}" style="height:44px;v-text-anchor:middle;width:200px;" arcsize="0%" strokecolor="#111111" fillcolor="#111111"><w:anchorlock/><center style="color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;font-weight:600;">${block.label}</center></v:roundrect><![endif]-->
<!--[if !mso]><!-->
<a href="${block.url}" style="background-color:#111111;color:#ffffff;display:inline-block;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;font-weight:600;line-height:1;padding:13px 28px;text-decoration:none;mso-hide:all;">${block.label}</a>
<!--<![endif]-->
</td></tr>`,
        text: `${block.label}: ${block.url}\n\n`
      };

    case 'divider':
      return {
        html: `<tr><td style="padding:4px 0 20px 0;"><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td style="border-top:1px solid #e4e4e7;font-size:0;line-height:0;">&nbsp;</td></tr></table></td></tr>`,
        text: '---\n\n'
      };

    case 'note':
      return {
        html: `<tr><td style="padding:0 0 16px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;line-height:1.5;color:#6b7280;">${block.content}</td></tr>`,
        text: block.content + '\n\n'
      };
  }
}

export const defaultTemplate: EmailTemplate = (ctx: TemplateContext): RenderedEmail => {
  const blocksHtml = ctx.blocks.map(b => renderBlock(b).html).join('\n');
  const blocksText = ctx.blocks.map(b => renderBlock(b).text).join('');

  const preheader = ctx.preheader ?? ctx.title;
  const appName   = ctx.appName;

  const html = `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <title>${ctx.title}</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
  <style>
    #outlook a { padding: 0; }
    body { margin: 0; padding: 0; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;">

<span style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${preheader}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</span>

<!-- Outer wrapper -->
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f4f4f5;">
  <tr>
    <td style="padding:32px 16px;">

      <!--[if mso]><table role="presentation" align="center" border="0" cellpadding="0" cellspacing="0" width="600"><tr><td><![endif]-->
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;margin:0 auto;">

        <!-- Brand header -->
        <tr>
          <td bgcolor="#111111" style="background-color:#111111;padding:24px 32px;">
            <span style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:18px;font-weight:700;letter-spacing:-0.01em;color:#ffffff;">${appName}</span>
          </td>
        </tr>

        <!-- Card body -->
        <tr>
          <td bgcolor="#ffffff" style="background-color:#ffffff;padding:36px 32px 28px 32px;border:1px solid #e4e4e7;border-top:0;">
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">

              <!-- Title -->
              <tr>
                <td style="padding:0 0 24px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:22px;font-weight:700;line-height:1.3;color:#111111;">${ctx.title}</td>
              </tr>

              <!-- Content blocks -->
              ${blocksHtml}

            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 0 0 0;">
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:12px;line-height:1.5;color:#9ca3af;text-align:center;">
                  ${appName}<br>
                  You received this email because an action was taken on your account.<br>
                  If you did not request this, you can safely ignore this email.
                </td>
              </tr>
            </table>
          </td>
        </tr>

      </table>
      <!--[if mso]></td></tr></table><![endif]-->

    </td>
  </tr>
</table>

</body>
</html>`;

  const text = `${appName}\n${'='.repeat(appName.length)}\n\n${ctx.title}\n\n${blocksText}---\nYou received this email because an action was taken on your account.\nIf you did not request this, you can safely ignore this email.`;

  return { subject: ctx.title, html, text };
};

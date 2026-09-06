import { BRAND_NAME } from "@/lib/constants";

export function verificationEmailContent(input: {
  name: string;
  verifyUrl: string;
}): { subject: string; text: string; html: string } {
  const subject = `${BRAND_NAME} — E-posta adresinizi doğrulayın`;
  const text = [
    `Merhaba ${input.name},`,
    "",
    `${BRAND_NAME} hesabınızı tamamlamak için e-posta adresinizi doğrulayın:`,
    input.verifyUrl,
    "",
    "Bu bağlantı 24 saat geçerlidir. Siz kayıt olmadıysanız bu iletiyi yok sayın.",
  ].join("\n");

  const html = emailDocument(`
    <p style="letter-spacing:0.28em;text-transform:uppercase;font-size:12px;color:#A8998A;">${BRAND_NAME}</p>
    <h1 style="font-size:28px;font-weight:400;color:#0B0B0B;margin:12px 0 20px;">E-postanızı doğrulayın</h1>
    <p style="font-size:16px;line-height:24px;">Merhaba ${escapeHtml(input.name)},</p>
    <p style="font-size:16px;line-height:24px;">Hesabınızı açmak için aşağıdaki düğmeye dokunun. Bağlantı 24 saat geçerlidir.</p>
    ${emailCta(input.verifyUrl, "E-postayı doğrula")}
    <p style="font-size:13px;line-height:20px;color:#A8998A;">Siz kayıt olmadıysanız bu iletiyi yok sayın.</p>
  `);

  return { subject, text, html };
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function emailDocument(inner: string): string {
  return `<!DOCTYPE html>
<html lang="tr" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<meta name="x-apple-disable-message-reformatting">
<meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no">
<title>${BRAND_NAME}</title>
</head>
<body style="margin:0;padding:0;background-color:#F7F5F0;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#F7F5F0;">
    <tr>
      <td style="padding:32px 24px;font-family:Georgia,serif;color:#2A2825;">
        ${inner}
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function emailCta(href: string, label: string): string {
  const safeHref = escapeHtml(href);
  const safeLabel = escapeHtml(label);
  // Gmail/Apple Mail on phones strip padding on <a> and ignore td background taps.
  // Borders stay, so the whole dark rectangle is the link. No target=_blank (iOS Mail).
  return `
<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:28px 0;">
  <tr>
    <td>
      <a href="${safeHref}" style="background-color:#2A2825;border-top:16px solid #2A2825;border-right:28px solid #2A2825;border-bottom:16px solid #2A2825;border-left:28px solid #2A2825;color:#F7F5F0;display:inline-block;font-family:Georgia,serif;font-size:16px;line-height:20px;text-align:center;text-decoration:none;">${safeLabel}</a>
    </td>
  </tr>
</table>
<p style="margin:0 0 8px;font-size:16px;line-height:28px;">
  <a href="${safeHref}" style="color:#2A2825;font-size:16px;line-height:28px;text-decoration:underline;">${safeLabel} bağlantısı</a>
</p>
  `;
}

export function passwordResetEmailContent(input: {
  name: string;
  resetUrl: string;
}): { subject: string; text: string; html: string } {
  const subject = `${BRAND_NAME} — Şifrenizi yenileyin`;
  const text = [
    `Merhaba ${input.name},`,
    "",
    "Şifrenizi yenilemek için bu bağlantıya tıklayın:",
    input.resetUrl,
    "",
    "Bağlantı 24 saat geçerlidir. Bu isteği siz yapmadıysanız iletiyi yok sayın.",
  ].join("\n");

  const html = emailDocument(`
    <p style="letter-spacing:0.28em;text-transform:uppercase;font-size:12px;color:#A8998A;">${BRAND_NAME}</p>
    <h1 style="font-size:28px;font-weight:400;color:#0B0B0B;margin:12px 0 20px;">Şifrenizi yenileyin</h1>
    <p style="font-size:16px;line-height:24px;">Merhaba ${escapeHtml(input.name)},</p>
    <p style="font-size:16px;line-height:24px;">Hesabınız için bir şifre sıfırlama isteği aldık. Bağlantı 24 saat geçerlidir.</p>
    ${emailCta(input.resetUrl, "Şifreyi yenile")}
    <p style="font-size:13px;line-height:20px;color:#A8998A;">Bu isteği siz yapmadıysanız bu iletiyi yok sayın.</p>
  `);

  return { subject, text, html };
}

export function campaignEmailContent(input: {
  subject: string;
  body: string;
}): { subject: string; text: string; html: string } {
  const paragraphs = input.body
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);
  const htmlBody = paragraphs
    .map((part) => `<p>${escapeHtml(part).replaceAll("\n", "<br />")}</p>`)
    .join("");

  const html = `
    <div style="font-family:Georgia,serif;background:#F7F5F0;padding:32px;color:#2A2825;">
      <p style="letter-spacing:0.28em;text-transform:uppercase;font-size:12px;color:#A8998A;">${BRAND_NAME}</p>
      <h1 style="font-size:28px;font-weight:400;color:#0B0B0B;">${escapeHtml(input.subject)}</h1>
      ${htmlBody || `<p>${escapeHtml(input.body)}</p>`}
    </div>
  `;

  return {
    subject: `${BRAND_NAME} — ${input.subject}`,
    text: input.body,
    html,
  };
}

export const DEFAULT_WELCOME_SUBJECT = "Hoş geldiniz";

export const DEFAULT_WELCOME_BODY = `Merhaba {{name}},

Lucien Perrin ailesine hoş geldiniz. Hesabınız hazır; koleksiyonu keşfetmeye başlayabilirsiniz.

Sevgiyle,
${BRAND_NAME}`;

export function interpolateWelcomeTemplate(
  template: string,
  input: { name: string; email: string },
): string {
  return template
    .replaceAll("{{name}}", input.name)
    .replaceAll("{{email}}", input.email);
}

export function welcomeEmailContent(input: {
  name: string;
  email: string;
  subject: string;
  body: string;
}): { subject: string; text: string; html: string } {
  const subject = interpolateWelcomeTemplate(input.subject, input).trim() || DEFAULT_WELCOME_SUBJECT;
  const body =
    interpolateWelcomeTemplate(input.body, input).trim() ||
    interpolateWelcomeTemplate(DEFAULT_WELCOME_BODY, input);

  return campaignEmailContent({ subject, body });
}

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

  const html = `
    <div style="font-family:Georgia,serif;background:#F7F5F0;padding:32px;color:#2A2825;">
      <p style="letter-spacing:0.28em;text-transform:uppercase;font-size:12px;color:#A8998A;">${BRAND_NAME}</p>
      <h1 style="font-size:28px;font-weight:400;color:#0B0B0B;">E-postanızı doğrulayın</h1>
      <p>Merhaba ${escapeHtml(input.name)},</p>
      <p>Hesabınızı açmak için aşağıdaki bağlantıya tıklayın. Bağlantı 24 saat geçerlidir.</p>
      ${emailCta(input.verifyUrl, "E-postayı doğrula")}
      <p style="font-size:13px;color:#A8998A;">Siz kayıt olmadıysanız bu iletiyi yok sayın.</p>
    </div>
  `;

  return { subject, text, html };
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function emailCta(href: string, label: string): string {
  const safeHref = escapeHtml(href);
  const safeLabel = escapeHtml(label);
  return `
      <p style="margin:32px 0;font-size:18px;line-height:28px;">
        <a href="${safeHref}">${safeLabel}</a>
      </p>
      <p style="margin:0 0 16px;font-size:16px;line-height:24px;">
        Telefonda açılmazsa bu adresi kopyalayıp tarayıcıya yapıştırın:
      </p>
      <p style="margin:0;font-size:14px;line-height:22px;color:#2A2825;">
        ${safeHref}
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

  const html = `
    <div style="font-family:Georgia,serif;background:#F7F5F0;padding:32px;color:#2A2825;">
      <p style="letter-spacing:0.28em;text-transform:uppercase;font-size:12px;color:#A8998A;">${BRAND_NAME}</p>
      <h1 style="font-size:28px;font-weight:400;color:#0B0B0B;">Şifrenizi yenileyin</h1>
      <p>Merhaba ${escapeHtml(input.name)},</p>
      <p>Hesabınız için bir şifre sıfırlama isteği aldık. Bağlantı 24 saat geçerlidir.</p>
      ${emailCta(input.resetUrl, "Şifreyi yenile")}
      <p style="font-size:13px;color:#A8998A;">Bu isteği siz yapmadıysanız bu iletiyi yok sayın.</p>
    </div>
  `;

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

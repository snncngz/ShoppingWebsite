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
      <p style="margin:28px 0;">
        <a href="${escapeHtml(input.verifyUrl)}" style="display:inline-block;background:#2A2825;color:#F7F5F0;text-decoration:none;padding:14px 24px;letter-spacing:0.16em;text-transform:uppercase;font-size:12px;">Doğrula</a>
      </p>
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

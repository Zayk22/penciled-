// src/lib/email/index.ts

export type EmailRecipient = {
  email: string;
  name?: string;
};

export type SendEmailParams = {
  to: EmailRecipient[];
  subject: string;
  html: string;
  text: string;
  replyTo?: EmailRecipient;
};

export type EmailResult =
  | { ok: true; messageId: string }
  | { ok: false; errorCode: string };

export async function sendEmail(params: SendEmailParams): Promise<EmailResult> {
  const apiKey = process.env.BREVO_API_KEY;
  const fromAddress = process.env.EMAIL_FROM_ADDRESS;
  const fromName = process.env.EMAIL_FROM_NAME || "Penciled";

  if (!apiKey) return { ok: false, errorCode: "missing_api_key" };
  if (!fromAddress) return { ok: false, errorCode: "missing_from_address" };

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        sender: { email: fromAddress, name: fromName },
        to: params.to,
        subject: params.subject,
        htmlContent: params.html,
        textContent: params.text,
        ...(params.replyTo ? { replyTo: params.replyTo } : {}),
      }),
    });

    if (!response.ok) {
      return { ok: false, errorCode: `brevo_${response.status}` };
    }

    const data = await response.json();
    return { ok: true, messageId: data.messageId };
  } catch {
    return { ok: false, errorCode: "network_error" };
  }
}
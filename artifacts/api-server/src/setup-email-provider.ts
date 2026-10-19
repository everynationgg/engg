import nodemailer from "nodemailer";
import { registerEmailProvider, SendEmailOptions } from "./lib/email.js";

export function setupEmailProvider() {
  // 1. Resend Provider (HTTP API - immune to SMTP port blocks on cloud hosts)
  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey) {
    const fromAddress =
      process.env.RESEND_FROM ||
      process.env.SMTP_FROM ||
      '"Every Nation" <noreply@engg.online>';

    console.log(">>> Email provider: RESEND enabled (from: %s)", fromAddress);

    registerEmailProvider(async (options: SendEmailOptions) => {
      try {
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: fromAddress,
            to: [options.to],
            subject: options.subject,
            html: options.html,
            text: options.text,
          }),
        });

        if (!response.ok) {
          const errData = (await response.json().catch(() => ({}))) as Record<string, any>;
          throw new Error(
            errData.message || `Resend API failed with status ${response.status}`,
          );
        }
      } catch (err) {
        console.error("Resend email failed:", err);
        throw err;
      }
    });
    return;
  }

  // 2. SMTP Provider (Nodemailer fallback)
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 465;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure = process.env.SMTP_SECURE === "true" || port === 465;

  if (host && user && pass) {
    console.log(">>> Email provider: SMTP enabled (%s:%d)", host, port);

    const fromAddress =
      process.env.SMTP_FROM ||
      `"Every Nation" <${user}>`;

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
      tls: {
        rejectUnauthorized: false,
      },
      connectionTimeout: 10000,
      greetingTimeout: 5000,
      socketTimeout: 15000,
    });

    registerEmailProvider(async (options: SendEmailOptions) => {
      try {
        await transporter.sendMail({
          from: fromAddress,
          to: options.to,
          subject: options.subject,
          html: options.html,
          text: options.text,
        });
      } catch (err) {
        console.error("SMTP sendMail failed:", err);
        throw err;
      }
    });
    return;
  }

  console.warn(
    ">>> [WARN] No email provider configured (missing RESEND_API_KEY or SMTP credentials).",
  );
}

// Backwards-compatible export
export const setupSmtpEmailProvider = setupEmailProvider;


import nodemailer from "nodemailer";
import { registerEmailProvider, SendEmailOptions } from "./lib/email.js";

export function setupSmtpEmailProvider() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 465;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure = process.env.SMTP_SECURE === "true";

  if (!host || !port || !user || !pass) {
    throw new Error("SMTP config missing. Check SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in env.");
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });

  registerEmailProvider(async (options: SendEmailOptions) => {
    try {
      await transporter.sendMail({
        from: '"ERROR: NEWFORM DETECTED" <noreply@engg.online>',
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
}

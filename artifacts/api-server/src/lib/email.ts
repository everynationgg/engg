/**
 * Email service - flexible adapter for different email providers
 * Supports: Resend, SendGrid, Nodemailer, or custom implementations
 */

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

let emailProvider: ((options: SendEmailOptions) => Promise<void>) | null = null;

/**
 * Register email provider implementation
 * Call this on server startup to configure your email service
 */
export function registerEmailProvider(
  provider: (options: SendEmailOptions) => Promise<void>
) {
  emailProvider = provider;
}

/**
 * Send an email using the registered provider
 */
export async function sendEmail(options: SendEmailOptions): Promise<void> {
  if (!emailProvider) {
    // In development, just log the email
    if (process.env.NODE_ENV !== "production") {
      console.log("📧 Email (dev mode):", options.to, options.subject);
      console.log("Content:", options.html);
      return;
    }
    throw new Error("Email provider not configured");
  }

  return emailProvider(options);
}

/**
 * Send verification email
 */
export function generateVerificationEmailHTML(
  username: string,
  verificationCode: string
): string {
  const frontendUrl = process.env.FRONTEND_URL || "https://www.engg.online";
  const verifyLink = `${frontendUrl}/verify?token=${verificationCode}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Every Nation Account</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f8fafc; padding: 40px 15px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table role="presentation" width="100%" style="max-width: 560px; background-color: #ffffff; border-radius: 24px; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.04); overflow: hidden;" cellspacing="0" cellpadding="0" border="0">
          <!-- Brand Header -->
          <tr>
            <td style="padding: 36px 36px 20px 36px; text-align: center; border-bottom: 1px solid #f1f5f9;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center">
                    <span style="display: inline-block; font-size: 20px; font-weight: 900; letter-spacing: -0.03em; color: #0f172a;">ENGG</span>
                    <span style="color: #cbd5e1; margin: 0 8px;">|</span>
                    <span style="font-size: 13px; font-weight: 700;">
                      <span style="color: #7c3aed;">Gaming.</span>
                      <span style="color: #0f172a;">Community.</span>
                      <span style="color: #f97316;">Innovation.</span>
                    </span>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 16px;">
                    <span style="display: inline-block; background-color: #f3e8ff; color: #7c3aed; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; padding: 5px 14px; border-radius: 9999px;">
                      Account Verification
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 32px 36px;">
              <h1 style="margin: 0 0 12px 0; font-size: 24px; font-weight: 800; color: #0f172a; letter-spacing: -0.02em; text-align: center;">
                Verify Your Account
              </h1>
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #475569; text-align: center;">
                Hello <strong>${username}</strong>! Welcome to <strong>Every Nation GG</strong>. Enter the 6-digit verification code below to verify your email address and activate full access.
              </p>

              <!-- Verification Code Pill Block -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 28px 0;">
                <tr>
                  <td align="center" style="background-color: #faf5ff; border: 2px dashed #c084fc; border-radius: 18px; padding: 24px;">
                    <div style="font-size: 11px; font-weight: 700; color: #7c3aed; text-transform: uppercase; letter-spacing: 0.15em; margin-bottom: 8px;">
                      Your Verification Code
                    </div>
                    <div style="font-size: 38px; font-weight: 900; letter-spacing: 0.35em; color: #7c3aed; font-family: ui-monospace, Menlo, Consolas, monospace; line-height: 1.1; margin-left: 0.35em;">
                      ${verificationCode}
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Direct Click Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 20px 0 28px 0;">
                <tr>
                  <td align="center">
                    <a href="${verifyLink}" target="_blank" style="display: inline-block; background-color: #7c3aed; color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none; padding: 14px 34px; border-radius: 9999px; letter-spacing: 0.02em; box-shadow: 0 4px 14px rgba(124, 58, 237, 0.3);">
                      Verify Instantly →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Expiration & Security Notice -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top: 24px;">
                <tr>
                  <td style="background-color: #fffbeb; border: 1px solid #fef08a; border-radius: 12px; padding: 14px 18px; font-size: 12px; line-height: 1.5; color: #92400e;">
                    ⏱ <strong>Note:</strong> This verification code is valid for <strong>24 hours</strong>. If you did not create an account on Every Nation GG, you can safely ignore this email.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 36px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center;">
              <p style="margin: 0 0 6px 0; font-size: 11px; color: #94a3b8;">
                © 2026 Every Nation GG. All rights reserved.
              </p>
              <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                <a href="${frontendUrl}" target="_blank" style="color: #7c3aed; text-decoration: none; font-weight: 600;">engg.online</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Generate password reset email
 */
export function generatePasswordResetEmailHTML(
  username: string,
  resetLink: string
): string {
  const frontendUrl = process.env.FRONTEND_URL || "https://www.engg.online";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Every Nation Password</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f8fafc; padding: 40px 15px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table role="presentation" width="100%" style="max-width: 560px; background-color: #ffffff; border-radius: 24px; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.04); overflow: hidden;" cellspacing="0" cellpadding="0" border="0">
          <!-- Brand Header -->
          <tr>
            <td style="padding: 36px 36px 20px 36px; text-align: center; border-bottom: 1px solid #f1f5f9;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center">
                    <span style="display: inline-block; font-size: 20px; font-weight: 900; letter-spacing: -0.03em; color: #0f172a;">ENGG</span>
                    <span style="color: #cbd5e1; margin: 0 8px;">|</span>
                    <span style="font-size: 13px; font-weight: 700;">
                      <span style="color: #7c3aed;">Gaming.</span>
                      <span style="color: #0f172a;">Community.</span>
                      <span style="color: #f97316;">Innovation.</span>
                    </span>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 16px;">
                    <span style="display: inline-block; background-color: #f3e8ff; color: #7c3aed; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; padding: 5px 14px; border-radius: 9999px;">
                      Password Recovery
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 32px 36px;">
              <h1 style="margin: 0 0 12px 0; font-size: 24px; font-weight: 800; color: #0f172a; letter-spacing: -0.02em; text-align: center;">
                Reset Your Password
              </h1>
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #475569; text-align: center;">
                Hello <strong>${username}</strong>, we received a request to reset the password for your Every Nation GG account. Click the button below to set a new password:
              </p>

              <!-- Reset Password CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 28px 0;">
                <tr>
                  <td align="center">
                    <a href="${resetLink}" target="_blank" style="display: inline-block; background-color: #7c3aed; color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none; padding: 14px 36px; border-radius: 9999px; letter-spacing: 0.02em; box-shadow: 0 4px 14px rgba(124, 58, 237, 0.3);">
                      Reset Password →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Fallback Direct Link -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 20px 0;">
                <tr>
                  <td>
                    <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-bottom: 6px;">
                      Or copy and paste this link in your browser:
                    </div>
                    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px 14px; font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 12px; color: #64748b; word-break: break-all; line-height: 1.4;">
                      <a href="${resetLink}" style="color: #7c3aed; text-decoration: none;">${resetLink}</a>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Expiration & Security Notice -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top: 24px;">
                <tr>
                  <td style="background-color: #fffbeb; border: 1px solid #fef08a; border-radius: 12px; padding: 14px 18px; font-size: 12px; line-height: 1.5; color: #92400e;">
                    ⏱ <strong>Security Notice:</strong> This link expires in <strong>60 minutes</strong>. If you did not request a password reset, you can safely ignore this email — your account remains secure.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 36px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center;">
              <p style="margin: 0 0 6px 0; font-size: 11px; color: #94a3b8;">
                © 2026 Every Nation GG. All rights reserved.
              </p>
              <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                <a href="${frontendUrl}" target="_blank" style="color: #7c3aed; text-decoration: none; font-weight: 600;">engg.online</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}


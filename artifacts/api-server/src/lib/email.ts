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
  const brandColor = "#00f3ff";
  const bgColor = "#0d1117";
  const surfaceColor = "#161b22";
  const borderColor = "#30363d";
  const textColor = "#ffffff";
  const mutedText = "#8b949e";
  const fontStack = "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

  return `
<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>Identity Verification</title>
  <!--[if mso]>
  <xml>
    <o:OfficeDocumentSettings>
      <o:AllowPNG/>
      <o:PixelsPerInch>96</o:PixelsPerInch>
    </o:OfficeDocumentSettings>
  </xml>
  <![endif]-->
  <style>
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; background-color: ${bgColor}; }
    img { line-height: 100%; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; border: 0; }
    table { border-collapse: collapse !important; }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: ${bgColor}; color: ${textColor}; font-family: ${fontStack};">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="${bgColor}" style="background-color: ${bgColor};">
    <tr>
      <td align="center" style="padding: 40px 10px;">
        <!-- Container -->
        <table role="presentation" width="100%" style="max-width: 600px;" cellspacing="0" cellpadding="0" border="0" bgcolor="${surfaceColor}">
          <tr>
            <td style="padding: 30px; border-bottom: 3px solid ${brandColor}; background-color: #0d1117;">
              <h1 style="margin: 0; color: ${brandColor}; font-size: 16px; letter-spacing: 0.3em; text-transform: uppercase; font-weight: 800;">
                SECURE TRANSMISSION
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <div style="font-size: 13px; color: ${brandColor}; margin-bottom: 20px; font-weight: bold;">
                SUBJECT: [ ${username.toUpperCase()} ]
              </div>
              
              <div style="font-size: 15px; line-height: 1.6; color: ${textColor}; margin-bottom: 30px;">
                INITIALIZING IDENTITY SYNC PROTOCOL...<br><br>
                WE REQUIRE FINAL SYNCHRONIZATION TO ESTABLISH YOUR OPERATOR STATUS ON THE NETWORK.
              </div>
              
              <!-- Code Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 30px 0; border: 2px solid ${brandColor}; background-color: #000000;">
                <tr>
                  <td align="center" style="padding: 30px;">
                    <div style="font-size: 11px; color: ${mutedText}; margin-bottom: 15px; letter-spacing: 0.3em; font-weight: bold;">[ IDENTITY_SYNC_CODE ]</div>
                    <div style="font-size: 48px; color: ${brandColor}; letter-spacing: 0.4em; font-weight: 800; line-height: 1;">
                      ${verificationCode}
                    </div>
                  </td>
                </tr>
              </table>

              <div style="font-size: 12px; color: ${mutedText}; margin-bottom: 5px;">
                MANUAL OVERRIDE LINK:
              </div>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 30px; border-left: 3px solid ${brandColor}; background-color: #000000;">
                <tr>
                  <td style="padding: 15px; font-family: monospace; font-size: 12px; color: ${brandColor}; word-break: break-all;">
                    ${process.env.FRONTEND_URL || "https://engg.online"}/verify?token=${verificationCode}
                  </td>
                </tr>
              </table>

              <div style="color: #fca311; font-size: 12px; font-weight: bold;">
                [!] SECURITY WARNING: THIS KEY EXPIRES IN 24 HOURS.
              </div>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding: 20px 30px; font-size: 11px; color: ${mutedText}; border-top: 1px solid ${borderColor};">
              PROTOCOL: LOCKDOWN // STATUS: PENDING_VERIFICATION // © 2026
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * Generate password reset email
 */
export function generatePasswordResetEmailHTML(
  username: string,
  resetLink: string
): string {
  const brandColor = "#fca311";
  const bgColor = "#0d1117";
  const surfaceColor = "#161b22";
  const borderColor = "#30363d";
  const textColor = "#ffffff";
  const mutedText = "#8b949e";
  const fontStack = "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

  return `
<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>Security Alert</title>
  <!--[if mso]>
  <xml>
    <o:OfficeDocumentSettings>
      <o:AllowPNG/>
      <o:PixelsPerInch>96</o:PixelsPerInch>
    </o:OfficeDocumentSettings>
  </xml>
  <![endif]-->
  <style>
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; background-color: ${bgColor}; }
    img { line-height: 100%; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; border: 0; }
    table { border-collapse: collapse !important; }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: ${bgColor}; color: ${textColor}; font-family: ${fontStack};">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="${bgColor}" style="background-color: ${bgColor};">
    <tr>
      <td align="center" style="padding: 40px 10px;">
        <!-- Container -->
        <table role="presentation" width="100%" style="max-width: 600px;" cellspacing="0" cellpadding="0" border="0" bgcolor="${surfaceColor}">
          <tr>
            <td style="padding: 30px; border-bottom: 3px solid ${brandColor}; background-color: #0d1117;">
              <h1 style="margin: 0; color: ${brandColor}; font-size: 16px; letter-spacing: 0.3em; text-transform: uppercase; font-weight: 800;">
                SECURITY ALERT
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <div style="font-size: 13px; color: ${brandColor}; margin-bottom: 20px; font-weight: bold;">
                SUBJECT: [ ${username.toUpperCase()} ]
              </div>
              
              <div style="font-size: 15px; line-height: 1.6; color: ${textColor}; margin-bottom: 30px;">
                PROTOCOL: PASSWORD_RESET_REQUESTED<br>
                IDENTITY LOCK HAS BEEN OVERRIDDEN.<br><br>
                A SECURE BYPASS CHANNEL HAS BEEN CREATED. USE THE COMMAND BELOW TO RE-ESTABLISH YOUR CREDENTIALS.
              </div>
              
              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin: 40px 0;">
                <tr>
                  <td align="center" bgcolor="${brandColor}" style="border-radius: 4px;">
                    <a href="${resetLink}" target="_blank" style="display: inline-block; padding: 18px 45px; font-family: ${fontStack}; font-size: 14px; font-weight: 900; color: #000000; text-decoration: none; text-transform: uppercase; letter-spacing: 0.1em; border-radius: 4px; background-color: ${brandColor};">
                      OVERRIDE PASSWORD
                    </a>
                  </td>
                </tr>
              </table>

              <div style="font-size: 12px; color: ${mutedText}; margin-bottom: 5px;">
                DIRECT COMMAND LINK:
              </div>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 30px; border-left: 3px solid ${brandColor}; background-color: #000000;">
                <tr>
                  <td style="padding: 15px; font-family: monospace; font-size: 12px; color: #93c5fd; word-break: break-all;">
                    ${resetLink}
                  </td>
                </tr>
              </table>

              <div style="color: #ff6b6b; font-size: 12px; font-weight: bold;">
                [!] CRITICAL: THIS COMMAND EXPIRES IN 60 MINUTES.
              </div>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding: 20px 30px; font-size: 11px; color: ${mutedText}; border-top: 1px solid ${borderColor};">
              PROTOCOL: OVERRIDE // STATUS: AUTH_PENDING // © 2026
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

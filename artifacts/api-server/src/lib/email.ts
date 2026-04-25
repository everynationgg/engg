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
  const bgColor = "#0a0e14";
  const surfaceColor = "#1a2333";
  const borderColor = "#2d3b55";
  const textColor = "#ffffff"; // Pure white for readability

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap');
    
    body { 
      margin: 0; 
      padding: 0; 
      background-color: ${bgColor}; 
      font-family: 'JetBrains Mono', 'Courier New', Courier, monospace; 
      color: ${textColor};
    }
    .wrapper { padding: 40px 20px; background-color: ${bgColor}; }
    .container { 
      max-width: 600px; 
      margin: 0 auto; 
      background-color: ${surfaceColor}; 
      border: 1px solid ${borderColor};
      position: relative;
    }
    .hud-header {
      padding: 30px;
      border-bottom: 1px solid ${borderColor};
      text-align: left;
      background: linear-gradient(90deg, rgba(0, 243, 255, 0.05) 0%, transparent 100%);
    }
    .hud-title {
      color: ${brandColor};
      margin: 0;
      font-size: 14px;
      letter-spacing: 0.4em;
      text-transform: uppercase;
      font-weight: 700;
    }
    .hud-subtitle {
      font-size: 10px;
      color: #4a5568;
      margin-top: 5px;
      letter-spacing: 0.2em;
    }
    .content { padding: 40px 30px; }
    .operator-id {
      font-size: 12px;
      color: ${brandColor};
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 1px dashed ${borderColor};
    }
    .message {
      font-size: 14px;
      line-height: 1.6;
      margin-bottom: 30px;
    }
    .action-zone {
      text-align: center;
      padding: 40px 0;
      border-top: 1px solid ${borderColor};
      border-bottom: 1px solid ${borderColor};
      margin: 30px 0;
    }
    .btn-tactical {
      display: inline-block;
      padding: 18px 45px;
      background-color: transparent;
      color: ${brandColor} !important;
      text-decoration: none;
      font-weight: bold;
      font-size: 12px;
      letter-spacing: 0.3em;
      border: 1px solid ${brandColor};
      text-transform: uppercase;
      box-shadow: 0 0 15px rgba(0, 243, 255, 0.2);
    }
    .data-block {
      background-color: #000;
      padding: 15px;
      border-left: 2px solid ${brandColor};
      margin: 20px 0;
      font-size: 11px;
      color: #718096;
      word-break: break-all;
    }
    .hud-footer {
      padding: 20px 30px;
      font-size: 10px;
      color: #4a5568;
      text-align: center;
      letter-spacing: 0.1em;
    }
    .scanline {
      height: 1px;
      background: rgba(0, 243, 255, 0.1);
      width: 100%;
      margin: 5px 0;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="hud-header" style="position: relative;">
        <!-- Corner Brackets for Email -->
        <div style="position: absolute; top: 10px; left: 10px; width: 15px; height: 15px; border-top: 1px solid ${brandColor}; border-left: 1px solid ${brandColor}; opacity: 0.3;"></div>
        <div style="position: absolute; top: 10px; right: 10px; width: 15px; height: 15px; border-top: 1px solid ${brandColor}; border-right: 1px solid ${brandColor}; opacity: 0.3;"></div>
        
        <h1 class="hud-title">Secure Transmission</h1>
        <div class="hud-subtitle">ORIGIN: OPERATOR_IDENTITY_NODE_7</div>
      </div>
      
      <div class="content">
        <div class="operator-id">SUBJECT ID: [ ${username.toUpperCase()} ]</div>
        
        <div class="message">
          INITIALIZING BIOMETRIC LINK...<br>
          ENCRYPTED IDENTITY HANDSHAKE DETECTED.<br><br>
          WE REQUIRE FINAL SYNCHRONIZATION TO ESTABLISH YOUR OPERATOR STATUS ON THE NETWORK.
        </div>
        
        <div class="message" style="text-align: center; margin: 40px 0; padding: 30px; border: 1px dashed rgba(0, 243, 255, 0.2); background: rgba(0, 243, 255, 0.03);">
          <div style="font-size: 11px; color: #718096; margin-bottom: 15px; letter-spacing: 0.3em; font-weight: bold;">[ IDENTITY_SYNC_CODE ]</div>
          <div style="font-size: 48px; color: #00f3ff; letter-spacing: 0.4em; font-weight: 800; text-shadow: 0 0 20px rgba(0, 243, 255, 0.3);">
            ${verificationCode}
          </div>
        </div>

        <div class="message" style="font-size: 11px; color: #4a5568;">
          ALTERNATIVELY, INITIALIZE VIA DIRECT LINK:
        </div>
        <div class="data-block">
          ${process.env.FRONTEND_URL || "https://engg.online"}/verify?token=${verificationCode}
        </div>

        <div style="color: #ffaa00; font-size: 11px; margin-top: 40px; padding: 15px; border-left: 2px solid #ffaa00; background: rgba(255, 170, 0, 0.05);">
          [!] SECURITY WARNING: THIS KEY EXPIRES IN 24 HOURS.<br>
          UNAUTHORIZED ACCESS IS A BREACH OF ERROR NEWFORM DETECTED PROTOCOLS.
        </div>
      </div>
      
      <div class="hud-footer">
        PROTOCOL: LOCKDOWN // STATUS: PENDING_VERIFICATION // © 2026
      </div>
    </div>
  </div>
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
  const brandColor = "#ffaa00"; // Warning Amber for reset
  const bgColor = "#05070a";
  const surfaceColor = "#0c1016";
  const borderColor = "#2d2010";
  const textColor = "#a0aec0";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap');
    
    body { 
      margin: 0; 
      padding: 0; 
      background-color: ${bgColor}; 
      font-family: 'JetBrains Mono', 'Courier New', Courier, monospace; 
      color: ${textColor};
    }
    .wrapper { padding: 40px 20px; background-color: ${bgColor}; }
    .container { 
      max-width: 600px; 
      margin: 0 auto; 
      background-color: ${surfaceColor}; 
      border: 1px solid ${borderColor};
    }
    .hud-header {
      padding: 30px;
      border-bottom: 1px solid ${borderColor};
      text-align: left;
      background: linear-gradient(90deg, rgba(255, 170, 0, 0.05) 0%, transparent 100%);
    }
    .hud-title {
      color: ${brandColor};
      margin: 0;
      font-size: 14px;
      letter-spacing: 0.4em;
      text-transform: uppercase;
      font-weight: 700;
    }
    .content { padding: 40px 30px; }
    .operator-id {
      font-size: 12px;
      color: ${brandColor};
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 1px dashed ${borderColor};
    }
    .message {
      font-size: 14px;
      line-height: 1.6;
      margin-bottom: 30px;
    }
    .action-zone {
      text-align: center;
      padding: 40px 0;
      border-top: 1px solid ${borderColor};
      border-bottom: 1px solid ${borderColor};
      margin: 30px 0;
    }
    .btn-tactical {
      display: inline-block;
      padding: 18px 45px;
      background-color: transparent;
      color: ${brandColor} !important;
      text-decoration: none;
      font-weight: bold;
      font-size: 12px;
      letter-spacing: 0.3em;
      border: 1px solid ${brandColor};
      text-transform: uppercase;
      box-shadow: 0 0 15px rgba(255, 170, 0, 0.1);
    }
    .data-block {
      background-color: #000;
      padding: 15px;
      border-left: 2px solid ${brandColor};
      margin: 20px 0;
      font-size: 11px;
      color: #718096;
      word-break: break-all;
    }
    .hud-footer {
      padding: 20px 30px;
      font-size: 10px;
      color: #4a5568;
      text-align: center;
      letter-spacing: 0.1em;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="hud-header">
        <h1 class="hud-title">Security Alert</h1>
      </div>
      
      <div class="content">
        <div class="operator-id">SUBJECT ID: [ ${username.toUpperCase()} ]</div>
        
        <div class="message">
          PROTOCOL: PASSWORD_RESET_REQUESTED<br>
          IDENTITY LOCK HAS BEEN OVERRIDDEN.<br><br>
          A SECURE BYPASS CHANNEL HAS BEEN CREATED. USE THE COMMAND BELOW TO RE-ESTABLISH YOUR CREDENTIALS.
        </div>
        
        <div class="action-zone">
          <a href="${resetLink}" class="btn-tactical">OVERRIDE PASSWORD</a>
        </div>
        
        <div class="data-block">
          ${resetLink}
        </div>

        <div style="color: #ff6b6b; font-size: 10px; margin-top: 40px;">
          [!] CRITICAL: THIS COMMAND EXPIRES IN 60 MINUTES.<br>
          IF YOU DID NOT INITIATE THIS OVERRIDE, SECURE YOUR TERMINAL IMMEDIATELY.
        </div>
      </div>
      
      <div class="hud-footer">
        PROTOCOL: OVERRIDE // STATUS: AUTH_PENDING // © 2026
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

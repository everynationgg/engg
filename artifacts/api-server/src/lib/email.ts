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
  verificationLink: string
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; background-color: #0a0e27; color: #e0e0e0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%); padding: 20px; border-radius: 8px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 24px; }
    .content { background-color: #1a1f3a; padding: 20px; margin: 20px 0; border-radius: 8px; border: 1px solid #2a3f5f; }
    .button { background: linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; margin: 20px 0; }
    .footer { text-align: center; font-size: 12px; color: #888; margin-top: 30px; }
    .warning { color: #ff6b6b; font-size: 12px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🛸 Verify Your Email</h1>
    </div>
    
    <div class="content">
      <p>Hello <strong>${username}</strong>,</p>
      
      <p>Thank you for creating an account! To get started, please verify your email address by clicking the button below:</p>
      
      <div style="text-align: center;">
        <a href="${verificationLink}" class="button">VERIFY EMAIL</a>
      </div>
      
      <p>Or copy and paste this link in your browser:</p>
      <p style="word-break: break-all; color: #888; font-size: 12px;">${verificationLink}</p>
      
      <div class="warning">
        <p>This link will expire in 24 hours. If you didn't create this account, please ignore this email.</p>
      </div>
    </div>
    
    <div class="footer">
      <p>&copy; 2026 ERROR: NEWFORM DETECTED. All rights reserved.</p>
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
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; background-color: #0a0e27; color: #e0e0e0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #ff6b6b 0%, #ff9933 100%); padding: 20px; border-radius: 8px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 24px; }
    .content { background-color: #1a1f3a; padding: 20px; margin: 20px 0; border-radius: 8px; border: 1px solid #2a3f5f; }
    .button { background: linear-gradient(135deg, #ff6b6b 0%, #ff9933 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; margin: 20px 0; }
    .footer { text-align: center; font-size: 12px; color: #888; margin-top: 30px; }
    .warning { color: #ff6b6b; font-size: 12px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔓 Reset Your Password</h1>
    </div>
    
    <div class="content">
      <p>Hello <strong>${username}</strong>,</p>
      
      <p>We received a request to reset your password. Click the button below to set a new password:</p>
      
      <div style="text-align: center;">
        <a href="${resetLink}" class="button">RESET PASSWORD</a>
      </div>
      
      <p>Or copy and paste this link in your browser:</p>
      <p style="word-break: break-all; color: #888; font-size: 12px;">${resetLink}</p>
      
      <div class="warning">
        <p>This link will expire in 1 hour. If you didn't request a password reset, please ignore this email or contact us if you suspect unauthorized access.</p>
      </div>
    </div>
    
    <div class="footer">
      <p>&copy; 2026 ERROR: NEWFORM DETECTED. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;
}

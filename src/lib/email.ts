const SENDGRID_API_URL = 'https://api.sendgrid.com/v3/mail/send';

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  toName?: string;
}

export async function sendEmail({ to, subject, html, toName }: SendEmailOptions): Promise<boolean> {
  try {
    const response = await fetch(SENDGRID_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: to, name: toName || undefined }],
          },
        ],
        from: {
          email: process.env.SENDGRID_FROM_EMAIL,
          name: 'Local Review Responder',
        },
        subject,
        content: [
          {
            type: 'text/html',
            value: html,
          },
        ],
      }),
    });

    if (response.status === 202) {
      console.log(`Email sent successfully to ${to}`);
      return true;
    }

    const error = await response.text();
    console.error(`Failed to send email to ${to}:`, response.status, error);
    return false;
  } catch (error) {
    console.error('SendGrid error:', error);
    return false;
  }
}

export function getWelcomeEmailHtml(name?: string): string {
  const greeting = name ? `Hi ${name},` : 'Hi there,';
  const appUrl = process.env.NEXTAUTH_URL || 'https://local-review-responder.vercel.app';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Local Review Responder</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background-color: #2563eb; padding: 32px 40px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">
                ⭐ Local Review Responder
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <p style="color: #111827; font-size: 18px; font-weight: 600; margin: 0 0 16px 0;">
                ${greeting}
              </p>
              <p style="color: #4b5563; font-size: 16px; line-height: 24px; margin: 0 0 24px 0;">
                Welcome to Local Review Responder! You're one step away from managing your Google Business reviews with ease.
              </p>

              <!-- What you need box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 24px;">
                    <p style="color: #1e40af; font-size: 16px; font-weight: 600; margin: 0 0 12px 0;">
                      Before you connect, here's what you'll need:
                    </p>
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 4px 0; color: #1e40af; font-size: 14px; line-height: 22px;">
                          ✅ A Google Business Profile for your business
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; color: #1e40af; font-size: 14px; line-height: 22px;">
                          ✅ Owner or Manager access on that profile
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; color: #1e40af; font-size: 14px; line-height: 22px;">
                          ✅ The Google account (email) that has that access
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Steps -->
              <p style="color: #111827; font-size: 16px; font-weight: 600; margin: 0 0 16px 0;">
                Here's how to get started:
              </p>

              <table cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                <tr>
                  <td style="padding: 8px 0; vertical-align: top;">
                    <span style="display: inline-block; width: 28px; height: 28px; background-color: #2563eb; color: #ffffff; border-radius: 50%; text-align: center; line-height: 28px; font-size: 14px; font-weight: 600; margin-right: 12px;">1</span>
                  </td>
                  <td style="padding: 8px 0; color: #4b5563; font-size: 14px; line-height: 22px;">
                    <strong style="color: #111827;">Check your Google Business Profile access</strong><br>
                    Go to <a href="https://business.google.com" style="color: #2563eb; text-decoration: underline;">business.google.com</a> and sign in. If you can see your business, you're all set!
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; vertical-align: top;">
                    <span style="display: inline-block; width: 28px; height: 28px; background-color: #2563eb; color: #ffffff; border-radius: 50%; text-align: center; line-height: 28px; font-size: 14px; font-weight: 600; margin-right: 12px;">2</span>
                  </td>
                  <td style="padding: 8px 0; color: #4b5563; font-size: 14px; line-height: 22px;">
                    <strong style="color: #111827;">Don't have access yet?</strong><br>
                    Ask your business's current profile manager to add you as a Manager, or <a href="https://support.google.com/business/answer/2911778" style="color: #2563eb; text-decoration: underline;">claim your business</a> if no one has set it up yet.
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; vertical-align: top;">
                    <span style="display: inline-block; width: 28px; height: 28px; background-color: #2563eb; color: #ffffff; border-radius: 50%; text-align: center; line-height: 28px; font-size: 14px; font-weight: 600; margin-right: 12px;">3</span>
                  </td>
                  <td style="padding: 8px 0; color: #4b5563; font-size: 14px; line-height: 22px;">
                    <strong style="color: #111827;">Come back and connect</strong><br>
                    Log in to Local Review Responder and click "Connect Google Account" to link your profile. Your locations and reviews will sync automatically!
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 8px 0 24px 0;">
                    <a href="${appUrl}/login" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                      Log In to Your Account
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color: #4b5563; font-size: 14px; line-height: 22px; margin: 0;">
                Once connected, you'll get a 14-day free trial to try everything out — no credit card required to start.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px 40px; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; line-height: 18px; margin: 0; text-align: center;">
                You're receiving this email because you created an account on Local Review Responder.<br>
                Questions? Just reply to this email — we're here to help.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export function getAccountClosedEmailHtml(name?: string): string {
  const greeting = name ? `Hi ${name},` : 'Hi there,';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Account Closed — Local Review Responder</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background-color: #2563eb; padding: 32px 40px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">
                ⭐ Local Review Responder
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <p style="color: #111827; font-size: 18px; font-weight: 600; margin: 0 0 16px 0;">
                ${greeting}
              </p>
              <p style="color: #4b5563; font-size: 16px; line-height: 24px; margin: 0 0 24px 0;">
                Your Local Review Responder account has been closed and all associated data has been removed.
              </p>
              <p style="color: #4b5563; font-size: 16px; line-height: 24px; margin: 0 0 24px 0;">
                If you had any active subscriptions, they have been canceled and you will not be charged going forward.
              </p>
              <p style="color: #4b5563; font-size: 16px; line-height: 24px; margin: 0;">
                If you believe this was done in error or have any questions, please reply to this email and we'll be happy to help.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px 40px; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; line-height: 18px; margin: 0; text-align: center;">
                This is a confirmation that your account has been closed.<br>
                Questions? Just reply to this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

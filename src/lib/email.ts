import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

interface SendEmailOptions {
  to: string;
  toName?: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, toName, subject, html }: SendEmailOptions) {
  const msg = {
    to: toName ? { email: to, name: toName } : to,
    from: {
      email: 'support@localreviewresponder.com',
      name: 'Local Review Responder',
    },
    subject,
    html,
  };

  await sgMail.send(msg as any);
}

// ─── Welcome Email ────────────────────────────────────────────────────────────
export function getWelcomeEmailHtml(name?: string | null): string {
  const firstName = name ? name.split(' ')[0] : 'there';
  const dashboardUrl = 'https://app.localreviewresponder.com/dashboard';
  const gbpUrl = 'https://business.google.com';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to Local Review Responder</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f6f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f9;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1d4ed8,#2563eb);padding:36px 40px;text-align:center;">
              <img src="https://app.localreviewresponder.com/logo-white.png" alt="Local Review Responder" width="180" style="display:block;margin:0 auto 16px;" />
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">Welcome, ${firstName}!</h1>
              <p style="margin:8px 0 0;color:#bfdbfe;font-size:15px;">Your 14-day free trial has started.</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">

              <p style="margin:0 0 20px;color:#374151;font-size:15px;line-height:1.6;">
                Thanks for signing up for Local Review Responder. You're one step away from managing your Google reviews on autopilot.
              </p>

              <!-- What you'll get -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;margin-bottom:28px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 14px;color:#1e40af;font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;">Once connected, you can:</p>
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:5px 0;">
                          <span style="color:#2563eb;font-weight:700;margin-right:8px;">&#10003;</span>
                          <span style="color:#1e40af;font-size:14px;">Reply to Google reviews instantly with AI</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:5px 0;">
                          <span style="color:#2563eb;font-weight:700;margin-right:8px;">&#10003;</span>
                          <span style="color:#1e40af;font-size:14px;">Get email alerts when new reviews come in</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:5px 0;">
                          <span style="color:#2563eb;font-weight:700;margin-right:8px;">&#10003;</span>
                          <span style="color:#1e40af;font-size:14px;">Embed a review widget on your website</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Next step heading -->
              <h2 style="margin:0 0 16px;color:#111827;font-size:18px;font-weight:700;">Your next step: connect your business</h2>

              <!-- Steps -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;vertical-align:top;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:28px;vertical-align:top;">
                          <span style="display:inline-block;width:22px;height:22px;background:#2563eb;color:#fff;border-radius:50%;text-align:center;font-size:12px;font-weight:700;line-height:22px;">1</span>
                        </td>
                        <td style="padding-left:12px;vertical-align:top;">
                          <p style="margin:0;color:#111827;font-size:14px;font-weight:600;">Make sure you have a Google Business Profile</p>
                          <p style="margin:4px 0 0;color:#6b7280;font-size:13px;">Don't have one yet? <a href="${gbpUrl}" style="color:#2563eb;">Create one free at business.google.com</a></p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;vertical-align:top;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:28px;vertical-align:top;">
                          <span style="display:inline-block;width:22px;height:22px;background:#2563eb;color:#fff;border-radius:50%;text-align:center;font-size:12px;font-weight:700;line-height:22px;">2</span>
                        </td>
                        <td style="padding-left:12px;vertical-align:top;">
                          <p style="margin:0;color:#111827;font-size:14px;font-weight:600;">Confirm you have Owner or Manager access</p>
                          <p style="margin:4px 0 0;color:#6b7280;font-size:13px;">You'll need this level of access on the GBP profile to connect it.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 0;vertical-align:top;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:28px;vertical-align:top;">
                          <span style="display:inline-block;width:22px;height:22px;background:#2563eb;color:#fff;border-radius:50%;text-align:center;font-size:12px;font-weight:700;line-height:22px;">3</span>
                        </td>
                        <td style="padding-left:12px;vertical-align:top;">
                          <p style="margin:0;color:#111827;font-size:14px;font-weight:600;">Search for your business in the dashboard</p>
                          <p style="margin:4px 0 0;color:#6b7280;font-size:13px;">We'll sync your reviews automatically after you connect.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td align="center">
                    <a href="${dashboardUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:8px;">
                      Go to Dashboard &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.6;">
                If you have any questions, just reply to this email — we're happy to help.
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;padding:20px 40px;border-top:1px solid #e5e7eb;text-align:center;">
              <p style="margin:0;color:#9ca3af;font-size:12px;">
                &copy; ${new Date().getFullYear()} Local Review Responder &bull;
                <a href="https://app.localreviewresponder.com/dashboard/settings" style="color:#9ca3af;">Manage email preferences</a>
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

// ─── Account Closed Email ─────────────────────────────────────────────────────
export function getAccountClosedEmailHtml(name?: string | null): string {
  const firstName = name ? name.split(' ')[0] : 'there';
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><title>Account Closed</title></head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:#1d4ed8;padding:32px 40px;text-align:center;">
            <img src="https://app.localreviewresponder.com/logo-white.png" alt="Local Review Responder" width="160" style="display:block;margin:0 auto;" />
          </td>
        </tr>
        <tr>
          <td style="padding:36px 40px;">
            <h1 style="margin:0 0 16px;color:#111827;font-size:22px;">Your account has been closed, ${firstName}</h1>
            <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6;">
              We're sorry to see you go. Your account and all associated data have been removed from our system.
            </p>
            <p style="margin:0;color:#374151;font-size:15px;line-height:1.6;">
              If you ever want to come back, you're always welcome to create a new account at
              <a href="https://app.localreviewresponder.com/register" style="color:#2563eb;">localreviewresponder.com</a>.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#f9fafb;padding:20px 40px;border-top:1px solid #e5e7eb;text-align:center;">
            <p style="margin:0;color:#9ca3af;font-size:12px;">&copy; ${new Date().getFullYear()} Local Review Responder</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ─── New Reviews Email ────────────────────────────────────────────────────────
export function getNewReviewsEmailHtml(
  name: string | null | undefined,
  locationName: string,
  reviewCount: number,
  dashboardUrl: string = 'https://app.localreviewresponder.com/dashboard'
): string {
  const firstName = name ? name.split(' ')[0] : 'there';
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><title>New Reviews</title></head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:#1d4ed8;padding:32px 40px;text-align:center;">
            <img src="https://app.localreviewresponder.com/logo-white.png" alt="Local Review Responder" width="160" style="display:block;margin:0 auto;" />
          </td>
        </tr>
        <tr>
          <td style="padding:36px 40px;">
            <h1 style="margin:0 0 8px;color:#111827;font-size:22px;">You have ${reviewCount} new ${reviewCount === 1 ? 'review' : 'reviews'}!</h1>
            <p style="margin:0 0 24px;color:#6b7280;font-size:14px;">${locationName}</p>
            <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.6;">
              Hi ${firstName}, new reviews have come in for <strong>${locationName}</strong>. Head to your dashboard to view and respond.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center">
                  <a href="${dashboardUrl}" style="display:inline-block;background:#2563eb;color:#fff;font-size:15px;font-weight:700;text-decoration:none;padding:13px 32px;border-radius:8px;">
                    View &amp; Respond to Reviews &rarr;
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="background:#f9fafb;padding:20px 40px;border-top:1px solid #e5e7eb;text-align:center;">
            <p style="margin:0;color:#9ca3af;font-size:12px;">&copy; ${new Date().getFullYear()} Local Review Responder</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

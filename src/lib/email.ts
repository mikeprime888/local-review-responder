// SendGrid HTTP API (no npm package needed — SENDGRID_API_KEY set in Vercel env)
const SENDGRID_API_URL = 'https://api.sendgrid.com/v3/mail/send';
const FROM_EMAIL = 'support@localreviewresponder.com';
const FROM_NAME = 'Local Review Responder';

interface SendEmailOptions {
  to: string;
  toName?: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, toName, subject, html }: SendEmailOptions) {
  const response = await fetch(SENDGRID_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
    },
    body: JSON.stringify({
      personalizations: [
        {
          to: [toName ? { email: to, name: toName } : { email: to }],
        },
      ],
      from: { email: FROM_EMAIL, name: FROM_NAME },
      subject,
      content: [{ type: 'text/html', value: html }],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`SendGrid error ${response.status}: ${body}`);
  }
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
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fffcf5;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

          <!-- HEADER: logo image -->
          <tr>
            <td style="background:#fffcf5;padding:0;text-align:center;">
              <img src="https://app.localreviewresponder.com/lrr-email-header-v3.jpg" alt="Local Review Responder" width="600" style="display:block;width:100%;height:auto;" />
            </td>
          </tr>

          <!-- HERO: name + trial message -->
          <tr>
            <td style="background:transparent;padding:32px 40px;text-align:center;">
              <h1 style="margin:0 0 8px;color:#111827;font-size:24px;font-weight:700;">Welcome, ${firstName}!</h1>
              <p style="margin:0;color:#374151;font-size:15px;">Your 14-day free trial is active. Let's get your reviews connected.</p>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="padding:36px 40px;">

              <!-- QUALIFIER SECTION -->
              <h2 style="margin:0 0 16px;color:#111827;font-size:17px;font-weight:700;">Before you dive in — which situation is yours?</h2>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">

                <!-- Path 1: Ready to go -->
                <tr>
                  <td style="padding:12px 16px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;margin-bottom:8px;">
                    <p style="margin:0 0 4px;color:#166534;font-size:14px;font-weight:700;">&#9989;&nbsp; I own or manage a Google Business Profile</p>
                    <p style="margin:0;color:#166534;font-size:13px;">You're all set. Head to the dashboard and connect your account — it takes about 2 minutes.</p>
                  </td>
                </tr>
                <tr><td style="padding:4px 0;"></td></tr>

                <!-- Path 2: Needs access -->
                <tr>
                  <td style="padding:12px 16px;background:#fffbeb;border:1px solid #fde68a;border-radius:8px;">
                    <p style="margin:0 0 4px;color:#92400e;font-size:14px;font-weight:700;">&#9888;&#65039;&nbsp; I manage reviews for someone else's business</p>
                    <p style="margin:0;color:#92400e;font-size:13px;">You'll need Owner or Manager access on their Google Business Profile before connecting. Ask the owner to add you at <a href="${gbpUrl}" style="color:#92400e;">business.google.com</a>.</p>
                  </td>
                </tr>
                <tr><td style="padding:4px 0;"></td></tr>

                <!-- Path 3: No GBP yet -->
                <tr>
                  <td style="padding:12px 16px;background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;">
                    <p style="margin:0 0 4px;color:#075985;font-size:14px;font-weight:700;">&#10067;&nbsp; I don't have a Google Business Profile yet</p>
                    <p style="margin:0;color:#075985;font-size:13px;">Create one free at <a href="${gbpUrl}" style="color:#075985;">business.google.com</a>. Once it's verified, come back and connect it here.</p>
                  </td>
                </tr>

              </table>

              <!-- BENEFITS BOX -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;margin-bottom:28px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 14px;color:#1e40af;font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;">Once connected, you can:</p>
                    <table cellpadding="0" cellspacing="0">
                      <tr><td style="padding:5px 0;color:#1e40af;font-size:14px;">&#10003;&nbsp;&nbsp;Reply to Google reviews instantly with AI</td></tr>
                      <tr><td style="padding:5px 0;color:#1e40af;font-size:14px;">&#10003;&nbsp;&nbsp;Get email alerts when new reviews come in</td></tr>
                      <tr><td style="padding:5px 0;color:#1e40af;font-size:14px;">&#10003;&nbsp;&nbsp;Embed a review widget on your website</td></tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
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
                Questions? Just reply to this email &mdash; we're happy to help.
              </p>

            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background:#f9fafb;padding:20px 40px;border-top:1px solid #e5e7eb;text-align:center;">
              <p style="margin:0;color:#9ca3af;font-size:12px;">&copy; 2025 Local Review Responder. All rights reserved.</p>
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
            <p style="margin:0;color:#9ca3af;font-size:12px;">&copy; 2025 Local Review Responder</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ─── Password Reset Email ────────────────────────────────────────────────────
export function getPasswordResetEmailHtml(name: string | null | undefined, resetUrl: string): string {
  const firstName = name ? name.split(' ')[0] : 'there';
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><title>Reset Your Password</title></head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#1d4ed8,#2563eb);padding:32px 40px;text-align:center;">
            <img src="https://app.localreviewresponder.com/logo-white.png" alt="Local Review Responder" width="160" style="display:block;margin:0 auto;" />
          </td>
        </tr>
        <tr>
          <td style="padding:36px 40px;">
            <h1 style="margin:0 0 16px;color:#111827;font-size:22px;">Reset your password</h1>
            <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.6;">
              Hi ${firstName}, we received a request to reset your password. Click the button below to choose a new one. This link expires in 10 minutes.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
              <tr>
                <td align="center">
                  <a href="${resetUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:8px;">
                    Reset Password &rarr;
                  </a>
                </td>
              </tr>
            </table>
            <p style="margin:0 0 8px;color:#6b7280;font-size:13px;line-height:1.6;">
              If you didn&rsquo;t request this, you can safely ignore this email. Your password won&rsquo;t be changed.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#f9fafb;padding:20px 40px;border-top:1px solid #e5e7eb;text-align:center;">
            <p style="margin:0;color:#9ca3af;font-size:12px;">&copy; 2025 Local Review Responder</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ─── New Reviews Email ────────────────────────────────────────────────────────
// Callers pass: (name, reviewsArray) where each review has:
//   locationTitle, reviewerName, starRating, comment
export function getNewReviewsEmailHtml(
  name: string | null | undefined,
  reviews: Array<{
    locationTitle?: string;
    reviewerName?: string;
    starRating?: string | number;
    comment?: string | null;
  }>
): string {
  const firstName = name ? name.split(' ')[0] : 'there';
  const reviewCount = reviews.length;
  const locationTitle = reviews[0]?.locationTitle || 'your location';
  const dashboardUrl = 'https://app.localreviewresponder.com/dashboard';

  const stars = (rating: string | number | undefined) => {
    const n = typeof rating === 'number' ? rating : parseInt(String(rating || '0'));
    const filled = Math.min(5, Math.max(0, n));
    return '&#9733;'.repeat(filled) + '&#9734;'.repeat(5 - filled);
  };

  const reviewRows = reviews.slice(0, 3).map(r => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #f3f4f6;vertical-align:top;">
        <p style="margin:0 0 3px;color:#f59e0b;font-size:15px;">${stars(r.starRating)}</p>
        <p style="margin:0 0 4px;color:#111827;font-size:13px;font-weight:600;">${r.reviewerName || 'Anonymous'} &middot; <span style="color:#9ca3af;font-weight:400;">${r.locationTitle || ''}</span></p>
        ${r.comment
          ? `<p style="margin:0;color:#6b7280;font-size:13px;line-height:1.5;">${r.comment.substring(0, 160)}${r.comment.length > 160 ? '...' : ''}</p>`
          : `<p style="margin:0;color:#9ca3af;font-size:13px;font-style:italic;">No comment left</p>`
        }
      </td>
    </tr>
  `).join('');

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
            <h1 style="margin:0 0 4px;color:#111827;font-size:22px;">
              You have ${reviewCount} new ${reviewCount === 1 ? 'review' : 'reviews'}!
            </h1>
            <p style="margin:0 0 24px;color:#6b7280;font-size:14px;">${locationTitle}</p>
            <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6;">
              Hi ${firstName}, here's a quick look at your latest ${reviewCount === 1 ? 'review' : 'reviews'}:
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
              ${reviewRows}
            </table>
            ${reviewCount > 3 ? `<p style="margin:0 0 20px;color:#6b7280;font-size:13px;">+ ${reviewCount - 3} more in your dashboard</p>` : ''}
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
            <p style="margin:0;color:#9ca3af;font-size:12px;">&copy; 2025 Local Review Responder</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

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

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>Welcome to Local Review Responder</title>
  <style>
    body, table, td, p, a {
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }

    table, td {
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }

    table {
      border-collapse: collapse !important;
    }

    img {
      border: 0;
      outline: none;
      text-decoration: none;
      -ms-interpolation-mode: bicubic;
      display: block;
    }

    body {
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
      height: 100% !important;
      background-color: #f5f1ea;
      font-family: Arial, Helvetica, sans-serif;
      color: #0f172a;
    }

    a {
      color: #145da0;
      text-decoration: underline;
    }

    .preheader {
      display: none !important;
      visibility: hidden;
      opacity: 0;
      color: transparent;
      height: 0;
      width: 0;
      overflow: hidden;
      mso-hide: all;
      font-size: 1px;
      line-height: 1px;
    }

    .outer {
      width: 100%;
      background-color: #f5f1ea;
      padding: 25px 0;
    }

    .container {
      width: 100%;
      max-width: 680px;
      background-color: #ffffff;
      border-radius: 18px;
    }

    .pad {
      padding-left: 28px;
      padding-right: 28px;
    }

    .header {
      padding: 34px 28px 20px 28px;
      text-align: center;
      border-bottom: 1px solid #ece7df;
    }

    .brand-sub {
      font-size: 14px;
      line-height: 22px;
      color: #64748b;
      margin: 8px 0 0 0;
    }

    .eyebrow {
      font-size: 12px;
      line-height: 18px;
      font-weight: bold;
      letter-spacing: 1.2px;
      text-transform: uppercase;
      color: #145da0;
      margin: 0 0 10px 0;
    }

    .warm-opener {
      font-size: 16px;
      line-height: 28px;
      color: #475569;
      margin: 0 0 16px 0;
    }

    .hero-title {
      font-size: 34px;
      line-height: 42px;
      font-weight: bold;
      color: #0f172a;
      letter-spacing: -0.6px;
      margin: 0 0 14px 0;
    }

    .hero-copy {
      font-size: 18px;
      line-height: 30px;
      color: #475569;
      margin: 0;
    }

    .section-title {
      font-size: 18px;
      line-height: 26px;
      font-weight: bold;
      color: #0f172a;
      margin: 0;
    }

    .card {
      border-radius: 16px;
    }

    .card-green {
      background-color: #eef8f1;
      border: 1px solid #a7dbba;
    }

    .card-amber {
      background-color: #fdf7ec;
      border: 1px solid #e8c77a;
    }

    .card-blue {
      background-color: #eef5fe;
      border: 1px solid #a9c9f1;
    }

    .card-cell {
      padding: 22px 22px 22px 22px;
    }

    .icon-wrap {
      width: 44px;
      vertical-align: top;
      font-size: 28px;
      line-height: 30px;
      padding-right: 12px;
    }

    .card-title {
      font-size: 18px;
      line-height: 26px;
      font-weight: bold;
      margin: 0 0 8px 0;
      letter-spacing: -0.2px;
    }

    .card-title-green {
      color: #1d6b3b;
    }

    .card-title-amber {
      color: #9a5616;
    }

    .card-title-blue {
      color: #135d9c;
    }

    .card-copy {
      font-size: 16px;
      line-height: 27px;
      color: #334155;
      margin: 0;
    }

    .btn {
      display: inline-block;
      background-color: #145da0;
      color: #ffffff !important;
      text-decoration: none !important;
      font-size: 16px;
      line-height: 16px;
      font-weight: bold;
      padding: 16px 28px;
      border-radius: 999px;
    }

    .secondary-copy {
      font-size: 15px;
      line-height: 26px;
      color: #64748b;
      margin: 0;
    }

    .footer {
      border-top: 1px solid #ece7df;
      padding: 26px 28px 34px 28px;
      text-align: center;
    }

    .footer-copy {
      font-size: 13px;
      line-height: 22px;
      color: #64748b;
      margin: 0;
    }

    @media screen and (max-width: 600px) {
      .container {
        border-radius: 0 !important;
      }

      .pad {
        padding-left: 18px !important;
        padding-right: 18px !important;
      }

      .header {
        padding: 28px 18px 18px 18px !important;
      }

      .hero-title {
        font-size: 28px !important;
        line-height: 36px !important;
      }

      .hero-copy {
        font-size: 17px !important;
        line-height: 28px !important;
      }

      .card-title {
        font-size: 17px !important;
        line-height: 25px !important;
      }

      .card-copy {
        font-size: 15px !important;
        line-height: 25px !important;
      }

      .card-cell {
        padding: 18px !important;
      }
    }
  </style>
</head>
<body>
  <div class="preheader">
    Welcome to Local Review Responder. Here's what to do next based on how your Google Business Profile connection went.
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="outer" style="width:100%;background-color:#f5f1ea;padding:25px 0;">
    <tr>
      <td align="center" style="padding:25px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="container">

          <!-- Header -->
          <tr>
            <td class="header">
              <img src="https://app.localreviewresponder.com/lrr-email-logo.png"
                   alt="Local Review Responder"
                   width="400"
                   style="display:block; margin:0 auto; width:400px; max-width:100%; height:auto;" />
              <p class="brand-sub">Smarter review management for local businesses</p>
            </td>
          </tr>

          <!-- Intro -->
          <tr>
            <td class="pad" style="padding-top: 34px; padding-bottom: 12px;">
              <p class="eyebrow">Welcome aboard</p>
              <p class="warm-opener">Thanks for signing up, ${firstName} — great to have you here.</p>
              <h1 class="hero-title" style="margin: 0 0 14px 0;">How did your Google Business Profile connection go?</h1>
              <p class="hero-copy" style="margin: 0;">
                Depending on what happened when you tried to connect, here's exactly what to do next.
              </p>
            </td>
          </tr>

          <!-- Section heading -->
          <tr>
            <td class="pad" style="padding-top: 20px; padding-bottom: 8px;">
              <p class="section-title">Find your situation below:</p>
            </td>
          </tr>

          <!-- Card 1 -->
          <tr>
            <td class="pad" style="padding-top: 10px; padding-bottom: 8px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="card card-green">
                <tr>
                  <td class="card-cell">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td class="icon-wrap" style="color: #1d6b3b;">&#9989;</td>
                        <td valign="top">
                          <p class="card-title card-title-green" style="margin: 0 0 8px 0;">It connected — you're all set</p>
                          <p class="card-copy" style="margin: 0;">
                            Your reviews are syncing and your 14-day free trial has started. Head to your dashboard to start generating AI responses and see what's come in.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card 2 -->
          <tr>
            <td class="pad" style="padding-top: 8px; padding-bottom: 8px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="card card-amber">
                <tr>
                  <td class="card-cell">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td class="icon-wrap" style="color: #9a5616;">&#9888;&#65039;</td>
                        <td valign="top">
                          <p class="card-title card-title-amber" style="margin: 0 0 8px 0;">It didn't connect — access issue</p>
                          <p class="card-copy" style="margin: 0;">
                            You'll need <strong>Owner</strong> or <strong>Manager</strong> access on the Google Business Profile before connecting. Ask the profile owner to add you at
                            <strong><a href="https://business.google.com/" target="_blank">business.google.com</a></strong>, then come back and try again.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card 3 -->
          <tr>
            <td class="pad" style="padding-top: 8px; padding-bottom: 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="card card-blue">
                <tr>
                  <td class="card-cell">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td class="icon-wrap" style="color: #135d9c;">&#128506;&#65039;</td>
                        <td valign="top">
                          <p class="card-title card-title-blue" style="margin: 0 0 8px 0;">You don't have a Google Business Profile yet</p>
                          <p class="card-copy" style="margin: 0;">
                            No problem — create one free at
                            <strong><a href="https://business.google.com/" target="_blank">business.google.com</a></strong>. Once Google verifies it (usually a few days), come back and connect it to get started.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td class="pad" align="center" style="padding-top: 0; padding-bottom: 16px;">
              <a href="https://app.localreviewresponder.com/dashboard" target="_blank" class="btn">Go to My Dashboard</a>
            </td>
          </tr>

          <!-- Support -->
          <tr>
            <td class="pad" style="padding-top: 8px; padding-bottom: 32px;" align="center">
              <p class="secondary-copy" style="margin: 0;">
                Have a question or ran into something unexpected? Just reply to this email — we're happy to help.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td class="footer">
              <p class="footer-copy" style="margin: 0 0 8px 0;">Built to help local businesses respond faster, stay consistent, and make more of every review.</p>
              <p class="footer-copy" style="margin: 0;">&copy; 2026 Local Review Responder LLC.&nbsp; All rights reserved.</p>
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
// deploy trigger

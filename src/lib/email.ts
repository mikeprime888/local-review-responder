import nodemailer from 'nodemailer';

// Gmail SMTP (GMAIL_USER / GMAIL_APP_PASSWORD set in Vercel env)
const FROM_NAME = 'Local Review Responder';

interface SendEmailOptions {
  to: string;
  toName?: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, toName, subject, html }: SendEmailOptions) {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) {
    throw new Error('Email not configured: GMAIL_USER and GMAIL_APP_PASSWORD must be set');
  }

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user, pass },
  });

  await transporter.sendMail({
    from: { name: FROM_NAME, address: user },
    to: toName ? { name: toName, address: to } : to,
    subject,
    html,
  });
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
          <td style="background:#ffffff;padding:28px 40px;text-align:center;border-bottom:1px solid #ece7df;">
            <img src="https://app.localreviewresponder.com/lrr-email-logo.png" alt="Local Review Responder" width="400" style="display:block;margin:0 auto;max-width:100%;height:auto;" />
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

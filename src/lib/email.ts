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
  const greeting = name ? `Welcome aboard, ${name}!` : 'Welcome aboard!';
  const appUrl = process.env.NEXTAUTH_URL || 'https://local-review-responder.vercel.app';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Local Review Responder</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased;">

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6;">
    <tr>
      <td align="center" style="padding: 40px 16px;">

        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">

          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 36px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 700; letter-spacing: -0.3px;">Local Review Responder</h1>
              <p style="margin: 8px 0 0; color: rgba(255,255,255,0.85); font-size: 14px; font-weight: 400;">Manage your Google reviews with ease</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 36px 40px 0;">

              <p style="margin: 0 0 20px; font-size: 18px; font-weight: 600; color: #111827;">${greeting}</p>

              <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.65; color: #374151;">
                You're almost ready to start managing your Google Business reviews from one simple dashboard. We just need to connect your Google Business Profile. Here's how.
              </p>

              <!-- Step 1 -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
                <tr>
                  <td width="40" valign="top" style="padding-top: 2px;">
                    <div style="width: 32px; height: 32px; border-radius: 50%; background-color: #3b82f6; color: #ffffff; font-size: 14px; font-weight: 700; text-align: center; line-height: 32px;">1</div>
                  </td>
                  <td style="padding-left: 12px;">
                    <p style="margin: 0 0 4px; font-size: 15px; font-weight: 600; color: #111827;">Check if you have Google Business Profile access</p>
                    <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #4b5563;">
                      Go to <a href="https://business.google.com" style="color: #2563eb; text-decoration: underline;">business.google.com</a> and sign in with your Google account. If you can see your business listed, you're all set! Skip to Step 3.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Step 2 -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
                <tr>
                  <td width="40" valign="top" style="padding-top: 2px;">
                    <div style="width: 32px; height: 32px; border-radius: 50%; background-color: #3b82f6; color: #ffffff; font-size: 14px; font-weight: 700; text-align: center; line-height: 32px;">2</div>
                  </td>
                  <td style="padding-left: 12px;">
                    <p style="margin: 0 0 4px; font-size: 15px; font-weight: 600; color: #111827;">Don't see your business? Get access.</p>
                    <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #4b5563;">
                      Somebody at your company may be managing the listing. It's usually <strong>whoever set it up originally</strong>, your <strong>marketing agency</strong>, or your <strong>IT team</strong>.
                    </p>

                    <!-- How-to box -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top: 12px;">
                      <tr>
                        <td style="background-color: #eff6ff; border-left: 3px solid #3b82f6; border-radius: 0 6px 6px 0; padding: 14px 16px;">
                          <p style="margin: 0 0 4px; font-size: 13px; font-weight: 600; color: #1e40af;">Ask them to add you. It only takes 30 seconds:</p>
                          <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #374151;">
                            Ask them to go to <a href="https://business.google.com" style="color: #2563eb; text-decoration: underline;">business.google.com</a> &rarr; select the business &rarr; <strong>Users</strong> &rarr; <strong>Add user</strong> &rarr; enter your email &rarr; set role to <strong>Manager</strong>.
                          </p>
                        </td>
                      </tr>
                    </table>

                    <p style="margin: 12px 0 0; font-size: 14px; line-height: 1.6; color: #4b5563;">
                      If no one has claimed the listing yet, you can <a href="https://support.google.com/business/answer/2911778" style="color: #2563eb; text-decoration: underline;">claim it yourself through Google</a>.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Step 3 -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 8px;">
                <tr>
                  <td width="40" valign="top" style="padding-top: 2px;">
                    <div style="width: 32px; height: 32px; border-radius: 50%; background-color: #3b82f6; color: #ffffff; font-size: 14px; font-weight: 700; text-align: center; line-height: 32px;">3</div>
                  </td>
                  <td style="padding-left: 12px;">
                    <p style="margin: 0 0 4px; font-size: 15px; font-weight: 600; color: #111827;">Log in and connect your profile</p>
                    <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #4b5563;">
                      Sign in to Local Review Responder with the Google account that has access to your business profile. We'll automatically find your locations and start syncing reviews.
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td style="padding: 28px 40px 0;" align="center">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-radius: 8px; background-color: #2563eb;">
                    <a href="${appUrl}/login" target="_blank" style="display: inline-block; padding: 14px 36px; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; border-radius: 8px;">Log In to Your Account &rarr;</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Trial info -->
          <tr>
            <td style="padding: 20px 40px 0;" align="center">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background-color: #f0fdf4; border-radius: 8px; padding: 16px 20px; text-align: center;">
                    <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #166534;">
                      <strong>Your 14-day free trial</strong> starts when you choose a location to manage. Pick a plan, and you won't be charged until your trial ends. Cancel anytime.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Help section -->
          <tr>
            <td style="padding: 28px 40px 36px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-top: 1px solid #e5e7eb; padding-top: 24px;">
                    <p style="margin: 0 0 4px; font-size: 14px; font-weight: 600; color: #111827;">Need help getting set up?</p>
                    <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #4b5563;">
                      Just reply to this email and we'll walk you through it. Most people are up and running in under 5 minutes.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>

        <!-- Footer -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding: 24px 40px; text-align: center;">
              <p style="margin: 0 0 8px; font-size: 12px; color: #9ca3af;">
                You're receiving this because you created an account on Local Review Responder.
              </p>
              <p style="margin: 0 0 8px; font-size: 12px; color: #9ca3af;">
                &copy; 2026 Local Review Responder LLC. All rights reserved.
              </p>
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                <a href="#" style="color: #9ca3af; text-decoration: underline;">Unsubscribe</a> &middot; <a href="https://localreviewresponder.com" style="color: #9ca3af; text-decoration: underline;">localreviewresponder.com</a>
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


export function getNewReviewsEmailHtml(
  name: string | undefined,
  reviews: Array<{
    locationTitle: string;
    reviewerName: string;
    starRating: number;
    comment: string | null;
  }>
): string {
  const greeting = name ? `Hi ${name},` : 'Hi there,';
  const appUrl = process.env.NEXTAUTH_URL || 'https://local-review-responder.vercel.app';

  // Group reviews by location
  const byLocation = new Map<string, typeof reviews>();
  for (const review of reviews) {
    if (!byLocation.has(review.locationTitle)) {
      byLocation.set(review.locationTitle, []);
    }
    byLocation.get(review.locationTitle)!.push(review);
  }

  const stars = (rating: number) => '★'.repeat(rating) + '☆'.repeat(5 - rating);

  const reviewCards = Array.from(byLocation.entries())
    .map(
      ([location, locReviews]) => `
      <tr>
        <td style="padding: 0 0 24px;">
          <p style="margin: 0 0 12px; font-size: 15px; font-weight: 600; color: #111827;">
            📍 ${location}
            <span style="font-weight: 400; color: #6b7280; font-size: 13px;">
              — ${locReviews.length} new review${locReviews.length > 1 ? 's' : ''}
            </span>
          </p>
          ${locReviews
            .map(
              (r) => `
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 12px;">
            <tr>
              <td style="background-color: #f9fafb; border-radius: 8px; border-left: 4px solid ${
                r.starRating >= 4 ? '#22c55e' : r.starRating === 3 ? '#f59e0b' : '#ef4444'
              }; padding: 14px 16px;">
                <p style="margin: 0 0 4px; font-size: 14px;">
                  <span style="color: ${
                    r.starRating >= 4 ? '#16a34a' : r.starRating === 3 ? '#d97706' : '#dc2626'
                  }; letter-spacing: 1px;">${stars(r.starRating)}</span>
                  <span style="color: #374151; font-weight: 600; margin-left: 8px;">${r.reviewerName}</span>
                </p>
                ${
                  r.comment
                    ? `<p style="margin: 8px 0 0; font-size: 14px; line-height: 1.6; color: #4b5563;">"${
                        r.comment.length > 200 ? r.comment.substring(0, 200) + '...' : r.comment
                      }"</p>`
                    : `<p style="margin: 8px 0 0; font-size: 13px; color: #9ca3af; font-style: italic;">No comment left</p>`
                }
              </td>
            </tr>
          </table>`
            )
            .join('')}
        </td>
      </tr>`
    )
    .join('');

  const needsReply = reviews.filter((r) => !r.comment || r.starRating <= 3).length;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Reviews — Local Review Responder</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased;">

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6;">
    <tr>
      <td align="center" style="padding: 40px 16px;">

        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 28px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 700;">⭐ Local Review Responder</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 32px 40px 0;">
              <p style="margin: 0 0 8px; font-size: 18px; font-weight: 600; color: #111827;">${greeting}</p>
              <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #374151;">
                You have <strong>${reviews.length} new review${reviews.length > 1 ? 's' : ''}</strong> since your last sync. Here's a summary:
              </p>
            </td>
          </tr>

          <!-- Review Cards -->
          <tr>
            <td style="padding: 0 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                ${reviewCards}
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding: 8px 40px 0;" align="center">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-radius: 8px; background-color: #2563eb;">
                    <a href="${appUrl}/dashboard" target="_blank" style="display: inline-block; padding: 14px 36px; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; border-radius: 8px;">View & Respond to Reviews →</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Tip -->
          <tr>
            <td style="padding: 24px 40px 0;" align="center">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background-color: #fffbeb; border-radius: 8px; padding: 14px 20px; text-align: center;">
                    <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #92400e;">
                      💡 <strong>Tip:</strong> Responding to reviews within 24 hours boosts your local search ranking and builds customer trust.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 28px 40px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center;">
                    <p style="margin: 0 0 8px; font-size: 12px; color: #9ca3af;">
                      You're receiving this because you have active locations on Local Review Responder.
                    </p>
                    <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                      <a href="#" style="color: #9ca3af; text-decoration: underline;">Unsubscribe from review notifications</a> · <a href="https://localreviewresponder.com" style="color: #9ca3af; text-decoration: underline;">localreviewresponder.com</a>
                    </p>
                  </td>
                </tr>
              </table>
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

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sendEmail } from '@/lib/email';

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const firstName = session.user.name ? session.user.name.split(' ')[0] : 'there';

  try {
    await sendEmail({
      to: session.user.email,
      toName: session.user.name || undefined,
      subject: 'Reminder: Connect your Google Business Profile',
      html: `<p>Hi ${firstName},</p>
<p>You asked us to remind you to come back and connect your Google Business Profile to Local Review Responder.</p>
<p><a href="https://app.localreviewresponder.com/onboarding">Click here to continue →</a></p>
<p>If you have any questions, just reply to this email.</p>
<p>— The Local Review Responder Team</p>`,
    });

    return Response.json({ success: true });
  } catch (err) {
    console.error('Failed to send reminder email:', err);
    return Response.json({ error: 'Failed to send email' }, { status: 500 });
  }
}

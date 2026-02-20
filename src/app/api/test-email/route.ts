import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, getNewReviewsEmailHtml } from '@/lib/email';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const html = getNewReviewsEmailHtml('Michael', [
    {
      locationTitle: 'DE Storage Georgetown',
      reviewerName: 'Jane Smith',
      starRating: 5,
      comment: 'Excellent storage facility! Clean, secure, and the staff is incredibly helpful. Highly recommend!',
    },
    {
      locationTitle: 'DE Storage Georgetown',
      reviewerName: 'Bob Johnson',
      starRating: 4,
      comment: 'Great location and good prices. Only minor issue was the gate code took a moment to work.',
    },
    {
      locationTitle: 'DE Storage Dover',
      reviewerName: 'Sarah Williams',
      starRating: 2,
      comment: null,
    },
  ]);

  const sent = await sendEmail({
    to: 'mikeprime888@gmail.com',
    toName: 'Michael',
    subject: '📬 3 new reviews on Local Review Responder (TEST)',
    html,
  });

  return NextResponse.json({ sent });
}

import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: process.env.SENDGRID_FROM_EMAIL }],
          },
        ],
        from: {
          email: process.env.SENDGRID_FROM_EMAIL,
          name: 'Local Review Responder',
        },
        subject: 'SendGrid Test - Local Review Responder',
        content: [
          {
            type: 'text/html',
            value: '<h1>It works!</h1><p>SendGrid is configured correctly for Local Review Responder.</p>',
          },
        ],
      }),
    });

    if (response.status === 202) {
      return NextResponse.json({ success: true, message: 'Test email sent!' });
    }

    const error = await response.text();
    return NextResponse.json(
      { success: false, status: response.status, error },
      { status: 500 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

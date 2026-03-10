import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { randomBytes, createHash } from 'crypto';
import { sendEmail, getPasswordResetEmailHtml } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Always return success to prevent email enumeration
    const successResponse = NextResponse.json({
      message: 'If an account exists with that email, a password reset link has been sent.',
    });

    // Look up user — must have a password (skip Google-only accounts)
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true, password: true },
    });

    if (!user || !user.password) {
      return successResponse;
    }

    // Generate token and hash it for storage
    const rawToken = randomBytes(32).toString('hex');
    const hashedToken = createHash('sha256').update(rawToken).digest('hex');

    // Delete any existing reset tokens for this email
    await prisma.verificationToken.deleteMany({
      where: { identifier: email },
    });

    // Store hashed token with 10-minute expiry
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token: hashedToken,
        expires: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    // Send reset email with the raw (unhashed) token
    const baseUrl = process.env.NEXTAUTH_URL || 'https://app.localreviewresponder.com';
    const resetUrl = `${baseUrl}/reset-password?token=${rawToken}&email=${encodeURIComponent(email)}`;

    try {
      await sendEmail({
        to: email,
        toName: user.name || undefined,
        subject: 'Reset your Local Review Responder password',
        html: getPasswordResetEmailHtml(user.name, resetUrl),
      });
    } catch (err) {
      console.error('Failed to send password reset email:', err);
    }

    return successResponse;
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}

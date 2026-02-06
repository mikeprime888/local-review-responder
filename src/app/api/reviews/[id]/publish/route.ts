import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// PATCH /api/reviews/[id]/publish - Toggle review publish status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = params;

    // Find the review and verify ownership through location -> user
    const review = await prisma.review.findUnique({
      where: { id },
      include: { location: true },
    });

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    if (review.location.userId !== (session.user as any).id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Toggle isPublished
    const updatedReview = await prisma.review.update({
      where: { id },
      data: {
        isPublished: !review.isPublished,
        publishedAt: !review.isPublished ? new Date() : null,
      },
    });

    return NextResponse.json({
      id: updatedReview.id,
      isPublished: updatedReview.isPublished,
      publishedAt: updatedReview.publishedAt,
    });
  } catch (error: any) {
    console.error('Review publish toggle error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update review' },
      { status: 500 }
    );
  }
}

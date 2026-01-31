'use client';

import { Star, MessageSquare } from 'lucide-react';
import { formatRelativeTime, getInitials } from '@/lib/utils';
import Link from 'next/link';

interface Review {
  id: string;
  reviewer: string;
  reviewerPhoto: string | null;
  rating: number;
  comment: string | null;
  createTime: Date;
  locationId: string;
  response: { id: string } | null;
}

interface Location {
  id: string;
  name: string;
}

interface RecentReviewsProps {
  reviews: Review[];
  locations: Location[];
}

export function RecentReviews({ reviews, locations }: RecentReviewsProps) {
  const getLocationName = (locationId: string) => {
    const location = locations.find((l) => l.id === locationId);
    return location?.name || 'Unknown Location';
  };

  if (reviews.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Recent Reviews
        </h2>
        <div className="text-center py-12">
          <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No reviews yet
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Reviews will appear here once customers leave them on Google.
          </p>
          <div className="mt-6">
            <Link
              href="/dashboard/locations"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Connect Locations
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Recent Reviews</h2>
        <Link
          href="/dashboard/reviews"
          className="text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          View all →
        </Link>
      </div>

      <ul className="divide-y divide-gray-200">
        {reviews.map((review) => (
          <li
            key={review.id}
            className="px-6 py-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-start space-x-4">
              {/* Reviewer Avatar */}
              <div className="flex-shrink-0">
                {review.reviewerPhoto ? (
                  <img
                    className="h-10 w-10 rounded-full"
                    src={review.reviewerPhoto}
                    alt={review.reviewer}
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                    <span className="text-white font-medium text-sm">
                      {getInitials(review.reviewer)}
                    </span>
                  </div>
                )}
              </div>

              {/* Review Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium text-gray-900">
                      {review.reviewer}
                    </p>
                    <span className="text-gray-400">·</span>
                    <p className="text-sm text-gray-500">
                      {getLocationName(review.locationId)}
                    </p>
                  </div>
                  <time className="text-xs text-gray-500">
                    {formatRelativeTime(review.createTime)}
                  </time>
                </div>

                {/* Star Rating */}
                <div className="mt-1 flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-4 w-4 ${
                        star <= review.rating
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>

                {/* Review Comment */}
                {review.comment && (
                  <p className="mt-2 text-sm text-gray-700 line-clamp-2">
                    {review.comment}
                  </p>
                )}

                {/* Response Status */}
                <div className="mt-2">
                  {review.response ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Replied
                    </span>
                  ) : (
                    <button className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                      Reply
                    </button>
                  )}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

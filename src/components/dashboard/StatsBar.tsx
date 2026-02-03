'use client';

interface Stats {
  totalReviews: number;
  averageRating: number;
  ratingBreakdown: Record<number, number>;
  unreplied: number;
}

export function StatsBar({ stats }: { stats: Stats }) {
  const repliedCount = stats.totalReviews - stats.unreplied;
  const replyRate =
    stats.totalReviews > 0
      ? Math.round((repliedCount / stats.totalReviews) * 100)
      : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {/* Total Reviews */}
      <div className="bg-white rounded-xl shadow-sm border p-5">
        <div className="text-sm font-medium text-gray-500">Total Reviews</div>
        <div className="mt-1 text-3xl font-bold text-gray-900">
          {stats.totalReviews}
        </div>
      </div>

      {/* Average Rating */}
      <div className="bg-white rounded-xl shadow-sm border p-5">
        <div className="text-sm font-medium text-gray-500">Average Rating</div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-3xl font-bold text-gray-900">
            {stats.averageRating || '—'}
          </span>
          <span className="text-yellow-500 text-xl">★</span>
        </div>
        {/* Rating breakdown mini bar */}
        <div className="mt-2 flex gap-0.5 h-1.5 rounded overflow-hidden">
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = stats.ratingBreakdown[rating] || 0;
            const pct = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
            const colors: Record<number, string> = {
              5: 'bg-green-500',
              4: 'bg-green-400',
              3: 'bg-yellow-400',
              2: 'bg-orange-400',
              1: 'bg-red-500',
            };
            return (
              <div
                key={rating}
                className={`${colors[rating]}`}
                style={{ width: `${pct}%` }}
                title={`${rating}★: ${count} reviews`}
              />
            );
          })}
        </div>
      </div>

      {/* Needs Reply */}
      <div className="bg-white rounded-xl shadow-sm border p-5">
        <div className="text-sm font-medium text-gray-500">Needs Reply</div>
        <div className="mt-1 text-3xl font-bold text-orange-600">
          {stats.unreplied}
        </div>
      </div>

      {/* Reply Rate */}
      <div className="bg-white rounded-xl shadow-sm border p-5">
        <div className="text-sm font-medium text-gray-500">Reply Rate</div>
        <div className="mt-1 text-3xl font-bold text-gray-900">{replyRate}%</div>
        <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
          <div
            className="bg-blue-600 h-1.5 rounded-full transition-all"
            style={{ width: `${replyRate}%` }}
          />
        </div>
      </div>
    </div>
  );
}

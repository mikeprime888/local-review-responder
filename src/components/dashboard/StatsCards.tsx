'use client';

import { MessageSquare, Star, Clock, TrendingUp } from 'lucide-react';

interface StatsCardsProps {
  totalReviews: number;
  avgRating: number;
  pendingResponses: number;
  newThisWeek: number;
}

export function StatsCards({
  totalReviews,
  avgRating,
  pendingResponses,
  newThisWeek,
}: StatsCardsProps) {
  const stats = [
    {
      name: 'Total Reviews',
      value: totalReviews.toLocaleString(),
      icon: MessageSquare,
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
    },
    {
      name: 'Average Rating',
      value: avgRating.toFixed(1),
      suffix: '★',
      icon: Star,
      color: 'bg-yellow-500',
      textColor: 'text-yellow-600',
    },
    {
      name: 'Pending Responses',
      value: pendingResponses.toLocaleString(),
      icon: Clock,
      color: 'bg-orange-500',
      textColor: 'text-orange-600',
    },
    {
      name: 'New This Week',
      value: newThisWeek.toLocaleString(),
      icon: TrendingUp,
      color: 'bg-green-500',
      textColor: 'text-green-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.name}
            className="relative overflow-hidden rounded-lg bg-white px-4 py-5 shadow hover:shadow-md transition-shadow sm:px-6 sm:py-6"
          >
            <dt>
              <div className={`absolute rounded-md p-3 ${stat.color}`}>
                <Icon className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
              <p className="ml-16 truncate text-sm font-medium text-gray-500">
                {stat.name}
              </p>
            </dt>
            <dd className="ml-16 flex items-baseline">
              <p className={`text-2xl font-semibold ${stat.textColor}`}>
                {stat.value}
                {stat.suffix && (
                  <span className="ml-1 text-xl">{stat.suffix}</span>
                )}
              </p>
            </dd>
          </div>
        );
      })}
    </div>
  );
}

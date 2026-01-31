import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { StatsCards } from '@/components/dashboard/StatsCards';
import { RecentReviews } from '@/components/dashboard/RecentReviews';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { Sidebar } from '@/components/dashboard/Sidebar';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect('/login');
  }

  // Fetch user with locations and reviews
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      locations: {
        where: { active: true },
        include: {
          reviews: {
            orderBy: { createTime: 'desc' },
            take: 10,
            include: {
              response: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    redirect('/login');
  }

  // Calculate stats
  const allReviews = user.locations.flatMap((loc) => loc.reviews);
  const totalReviews = allReviews.length;
  const avgRating =
    totalReviews > 0
      ? allReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;
  const pendingResponses = allReviews.filter((r) => !r.response).length;

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const newThisWeek = allReviews.filter(
    (r) => new Date(r.createTime) > oneWeekAgo
  ).length;

  // Rating distribution
  const ratingCounts = {
    5: allReviews.filter((r) => r.rating === 5).length,
    4: allReviews.filter((r) => r.rating === 4).length,
    3: allReviews.filter((r) => r.rating === 3).length,
    2: allReviews.filter((r) => r.rating === 2).length,
    1: allReviews.filter((r) => r.rating === 1).length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <Sidebar user={user} />

        {/* Main Content */}
        <div className="flex-1 ml-64">
          <div className="p-8">
            {/* Header */}
            <DashboardHeader
              userName={user.name || 'User'}
              locationCount={user.locations.length}
            />

            {/* Stats Cards */}
            <StatsCards
              totalReviews={totalReviews}
              avgRating={avgRating}
              pendingResponses={pendingResponses}
              newThisWeek={newThisWeek}
            />

            {/* Grid Layout */}
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Reviews (2/3 width) */}
              <div className="lg:col-span-2">
                <RecentReviews
                  reviews={allReviews.slice(0, 5)}
                  locations={user.locations}
                />
              </div>

              {/* Sidebar Content */}
              <div className="space-y-6">
                <QuickActions />

                {/* Rating Distribution */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">
                    Rating Distribution
                  </h3>
                  <div className="space-y-3">
                    {[5, 4, 3, 2, 1].map((rating) => {
                      const count = ratingCounts[rating as keyof typeof ratingCounts];
                      const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                      const colors = {
                        5: 'bg-green-500',
                        4: 'bg-blue-500',
                        3: 'bg-yellow-500',
                        2: 'bg-orange-500',
                        1: 'bg-red-500',
                      };
                      return (
                        <div key={rating} className="flex items-center">
                          <span className="text-sm text-gray-600 w-12">
                            {rating} ★
                          </span>
                          <div className="flex-1 mx-3 bg-gray-200 rounded-full h-2">
                            <div
                              className={`${colors[rating as keyof typeof colors]} h-2 rounded-full transition-all duration-300`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-900 w-8 text-right">
                            {count}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

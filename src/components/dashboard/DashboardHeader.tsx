'use client';

interface DashboardHeaderProps {
  userName: string;
  locationCount: number;
}

export function DashboardHeader({ userName, locationCount }: DashboardHeaderProps) {
  const greeting = getGreeting();

  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-gray-900">
        {greeting}, {userName}! 👋
      </h1>
      <p className="mt-2 text-gray-600">
        {locationCount > 0 ? (
          <>
            Here&apos;s what&apos;s happening with your{' '}
            <span className="font-medium">{locationCount}</span>{' '}
            {locationCount === 1 ? 'location' : 'locations'} today.
          </>
        ) : (
          <>
            Get started by connecting your Google Business Profile locations.
          </>
        )}
      </p>
    </div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

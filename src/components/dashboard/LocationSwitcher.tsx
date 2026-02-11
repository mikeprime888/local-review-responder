'use client';

interface Location {
  id: string;
  title: string;
  address: string | null;
  averageRating: number | null;
  totalReviews: number;
  isActive: boolean;
}

interface LocationSwitcherProps {
  locations: Location[];
  selectedLocationId: string | null;
  onLocationChange: (locationId: string) => void;
}

export default function LocationSwitcher({
  locations,
  selectedLocationId,
  onLocationChange,
}: LocationSwitcherProps) {
  return (
    <div className="relative inline-flex items-center">
      {/* Pin icon */}
      <svg
        className="absolute left-3 w-4 h-4 text-gray-400 pointer-events-none"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>

      <select
        value={selectedLocationId || ''}
        onChange={(e) => onLocationChange(e.target.value)}
        className="appearance-none pl-9 pr-8 py-2 bg-white border border-gray-300 rounded-lg text-sm md:text-base font-medium text-gray-900 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer max-w-[65vw] md:max-w-xs"
      >
        {locations.length === 0 ? (
          <option value="" disabled>
            No locations
          </option>
        ) : (
          locations.map((location) => (
            <option key={location.id} value={location.id}>
              {location.title}
            </option>
          ))
        )}
      </select>

      {/* Chevron icon */}
      <svg
        className="absolute right-2.5 w-4 h-4 text-gray-400 pointer-events-none"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 9l-7 7-7-7"
        />
      </svg>
    </div>
  );
}

'use client';

interface Location {
  id: string;
  title: string;
  address: string | null;
  googleAccountName: string | null;
  averageRating: number | null;
  totalReviews: number;
  lastSyncedAt: string | null;
  _count?: { reviews: number };
}

interface LocationListProps {
  locations: Location[];
  selectedLocation: string | null;
  onSelectLocation: (id: string | null) => void;
}

export function LocationList({
  locations,
  selectedLocation,
  onSelectLocation,
}: LocationListProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border">
      <div className="p-4 border-b">
        <h2 className="font-semibold text-gray-900">Locations</h2>
        <p className="text-xs text-gray-500 mt-1">
          {locations.length} location{locations.length !== 1 ? 's' : ''} connected
        </p>
      </div>

      <div className="divide-y">
        {/* All Locations option */}
        <button
          onClick={() => onSelectLocation(null)}
          className={`w-full text-left p-4 hover:bg-gray-50 transition ${
            selectedLocation === null ? 'bg-blue-50 border-l-4 border-blue-600' : ''
          }`}
        >
          <div className="font-medium text-gray-900">All Locations</div>
          <div className="text-xs text-gray-500 mt-1">
            {locations.reduce((sum, l) => sum + l.totalReviews, 0)} total reviews
          </div>
        </button>

        {/* Individual locations */}
        {locations.map((loc) => (
          <button
            key={loc.id}
            onClick={() => onSelectLocation(loc.id)}
            className={`w-full text-left p-4 hover:bg-gray-50 transition ${
              selectedLocation === loc.id
                ? 'bg-blue-50 border-l-4 border-blue-600'
                : ''
            }`}
          >
            <div className="font-medium text-gray-900 text-sm">{loc.title}</div>
            {loc.googleAccountName && (
              <div className="text-xs text-gray-400 mt-0.5">
                {loc.googleAccountName}
              </div>
            )}
            {loc.address && (
              <div className="text-xs text-gray-500 mt-1 truncate">
                {loc.address}
              </div>
            )}
            <div className="flex items-center gap-3 mt-2">
              {loc.averageRating && (
                <span className="text-xs font-medium text-gray-700">
                  {loc.averageRating.toFixed(1)} <span className="text-yellow-500">★</span>
                </span>
              )}
              <span className="text-xs text-gray-500">
                {loc.totalReviews} review{loc.totalReviews !== 1 ? 's' : ''}
              </span>
            </div>
            {loc.lastSyncedAt && (
              <div className="text-xs text-gray-400 mt-1">
                Synced {new Date(loc.lastSyncedAt).toLocaleDateString()}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Google Business Profile API Integration
 * 
 * IMPORTANT: The GBP API uses THREE different base URLs:
 * 1. Account Management: mybusinessaccountmanagement.googleapis.com
 * 2. Business Information (locations): mybusinessbusinessinformation.googleapis.com  
 * 3. Reviews (still v4): mybusiness.googleapis.com
 * 
 * This was a common source of bugs - do NOT mix these up!
 */

// ============================================
// API Base URLs - Each sub-API has its own URL
// ============================================
const API_URLS = {
  accountManagement: 'https://mybusinessaccountmanagement.googleapis.com/v1',
  businessInformation: 'https://mybusinessbusinessinformation.googleapis.com/v1',
  mybusiness: 'https://mybusiness.googleapis.com/v4',
} as const;

// ============================================
// Types
// ============================================

export interface GBPAccount {
  name: string;          // "accounts/123456789"
  accountName: string;   // "My Business" 
  type: 'PERSONAL' | 'LOCATION_GROUP' | 'ORGANIZATION' | 'USER_GROUP';
  role?: 'OWNER' | 'CO_OWNER' | 'MANAGER' | 'PRIMARY_OWNER';
  state?: {
    status: string;
  };
  accountNumber?: string;
  permissionLevel?: string;
}

export interface GBPLocation {
  name: string;              // "locations/123456789"
  title: string;             // Business name (was "locationName" in old API)
  storefrontAddress?: {
    addressLines?: string[];
    locality?: string;
    administrativeArea?: string;
    postalCode?: string;
    regionCode?: string;
  };
  websiteUri?: string;       // Was "websiteUrl" in old API
  phoneNumbers?: {
    primaryPhone?: string;
    additionalPhones?: string[];
  };
  metadata?: {
    mapsUri?: string;
    newReviewUri?: string;
  };
}

export interface GBPReview {
  name: string;              // "accounts/x/locations/y/reviews/z"
  reviewId: string;
  reviewer: {
    profilePhotoUrl?: string;
    displayName?: string;
    isAnonymous?: boolean;
  };
  starRating: 'ONE' | 'TWO' | 'THREE' | 'FOUR' | 'FIVE';
  comment?: string;
  createTime: string;
  updateTime: string;
  reviewReply?: {
    comment: string;
    updateTime: string;
  };
}

export interface GBPError {
  code: number;
  message: string;
  status: string;
}

// ============================================
// Helper: Convert star rating string to number
// ============================================
export function starRatingToNumber(rating: string): number {
  const map: Record<string, number> = {
    'ONE': 1, 'TWO': 2, 'THREE': 3, 'FOUR': 4, 'FIVE': 5,
  };
  return map[rating] || 0;
}

// ============================================
// Helper: Make authenticated API request
// ============================================
async function gbpFetch<T>(
  url: string,
  accessToken: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const error = errorBody.error || {};
    
    console.error(`GBP API Error [${response.status}]:`, {
      url,
      status: response.status,
      error,
    });

    if (response.status === 401) {
      throw new Error('GOOGLE_AUTH_EXPIRED');
    }

    if (response.status === 403) {
      throw new Error(`GOOGLE_PERMISSION_DENIED: ${error.message || 'Permission denied'}`);
    }

    throw new Error(
      `Google API error (${response.status}): ${error.message || 'Unknown error'}`
    );
  }

  return response.json();
}

// ============================================
// 1. ACCOUNTS - Account Management API
// ============================================

/**
 * List all GBP accounts for the authenticated user
 * Endpoint: GET mybusinessaccountmanagement.googleapis.com/v1/accounts
 */
export async function listAccounts(accessToken: string): Promise<GBPAccount[]> {
  const url = `${API_URLS.accountManagement}/accounts`;
  
  const data = await gbpFetch<{ accounts?: GBPAccount[] }>(url, accessToken);
  return data.accounts || [];
}

// ============================================
// 2. LOCATIONS - Business Information API
// ============================================

/**
 * List all locations for a specific account
 * Endpoint: GET mybusinessbusinessinformation.googleapis.com/v1/accounts/{accountId}/locations
 * 
 * IMPORTANT: This API requires a readMask parameter!
 * The old API (v4) did not require this.
 */
export async function listLocations(
  accountId: string,
  accessToken: string
): Promise<GBPLocation[]> {
  // readMask is REQUIRED - specifies which fields to return
  const readMask = 'name,title,storefrontAddress,websiteUri,phoneNumbers,metadata';
  const url = `${API_URLS.businessInformation}/accounts/${accountId}/locations?readMask=${readMask}`;
  
  const data = await gbpFetch<{ locations?: GBPLocation[] }>(url, accessToken);
  return data.locations || [];
}

/**
 * List ALL locations across all accounts (uses wildcard)
 * Endpoint: GET mybusinessbusinessinformation.googleapis.com/v1/accounts/-/locations
 */
export async function listAllLocations(accessToken: string): Promise<GBPLocation[]> {
  const readMask = 'name,title,storefrontAddress,websiteUri,phoneNumbers,metadata';
  const url = `${API_URLS.businessInformation}/accounts/-/locations?readMask=${readMask}`;
  
  const data = await gbpFetch<{ locations?: GBPLocation[] }>(url, accessToken);
  return data.locations || [];
}

// ============================================
// 3. REVIEWS - Google My Business API (still v4!)
// ============================================

/**
 * List reviews for a specific location
 * Endpoint: GET mybusiness.googleapis.com/v4/accounts/{accountId}/locations/{locationId}/reviews
 * 
 * NOTE: Reviews are STILL on the v4 mybusiness.googleapis.com endpoint.
 * They have NOT been migrated to a new sub-API yet.
 */
export async function listReviews(
  accountId: string,
  locationId: string,
  accessToken: string,
  pageSize: number = 50,
  pageToken?: string
): Promise<{ reviews: GBPReview[]; nextPageToken?: string; totalReviewCount?: number; averageRating?: number }> {
  let url = `${API_URLS.mybusiness}/accounts/${accountId}/locations/${locationId}/reviews?pageSize=${pageSize}`;
  if (pageToken) {
    url += `&pageToken=${pageToken}`;
  }

  const data = await gbpFetch<{
    reviews?: GBPReview[];
    nextPageToken?: string;
    totalReviewCount?: number;
    averageRating?: number;
  }>(url, accessToken);

  return {
    reviews: data.reviews || [],
    nextPageToken: data.nextPageToken,
    totalReviewCount: data.totalReviewCount,
    averageRating: data.averageRating,
  };
}

/**
 * Get all reviews for a location (handles pagination)
 */
export async function listAllReviews(
  accountId: string,
  locationId: string,
  accessToken: string
): Promise<{ reviews: GBPReview[]; totalReviewCount?: number; averageRating?: number }> {
  const allReviews: GBPReview[] = [];
  let pageToken: string | undefined;
  let totalReviewCount: number | undefined;
  let averageRating: number | undefined;

  do {
    const result = await listReviews(accountId, locationId, accessToken, 50, pageToken);
    allReviews.push(...result.reviews);
    pageToken = result.nextPageToken;
    totalReviewCount = result.totalReviewCount;
    averageRating = result.averageRating;
  } while (pageToken);

  return { reviews: allReviews, totalReviewCount, averageRating };
}

/**
 * Reply to a review
 * Endpoint: PUT mybusiness.googleapis.com/v4/accounts/{accountId}/locations/{locationId}/reviews/{reviewId}/reply
 */
export async function replyToReview(
  accountId: string,
  locationId: string,
  reviewId: string,
  comment: string,
  accessToken: string
): Promise<{ comment: string; updateTime: string }> {
  const url = `${API_URLS.mybusiness}/accounts/${accountId}/locations/${locationId}/reviews/${reviewId}/reply`;

  return gbpFetch(url, accessToken, {
    method: 'PUT',
    body: JSON.stringify({ comment }),
  });
}

/**
 * Delete a reply to a review
 * Endpoint: DELETE mybusiness.googleapis.com/v4/accounts/{accountId}/locations/{locationId}/reviews/{reviewId}/reply
 */
export async function deleteReply(
  accountId: string,
  locationId: string,
  reviewId: string,
  accessToken: string
): Promise<void> {
  const url = `${API_URLS.mybusiness}/accounts/${accountId}/locations/${locationId}/reviews/${reviewId}/reply`;

  await gbpFetch(url, accessToken, {
    method: 'DELETE',
  });
}

// ============================================
// Token Management
// ============================================

/**
 * Refresh an expired Google OAuth access token
 */
export async function refreshAccessToken(refreshToken: string): Promise<{
  access_token: string;
  expires_in: number;
  token_type: string;
}> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    console.error('Token refresh failed:', error);
    throw new Error('Failed to refresh Google access token');
  }

  return response.json();
}

// ============================================
// Helper: Extract IDs from resource names
// ============================================

/**
 * Extract account ID from resource name
 * "accounts/123456" -> "123456"
 */
export function extractAccountId(name: string): string {
  return name.replace('accounts/', '');
}

/**
 * Extract location ID from resource name
 * "locations/789012" -> "789012"
 */
export function extractLocationId(name: string): string {
  const match = name.match(/locations\/(\d+)/);
  return match ? match[1] : name.replace('locations/', '');
}

/**
 * Extract review ID from resource name
 * "accounts/x/locations/y/reviews/z" -> "z"
 */
export function extractReviewId(name: string): string {
  const match = name.match(/reviews\/(.+)$/);
  return match ? match[1] : name;
}

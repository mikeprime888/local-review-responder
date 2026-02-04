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
 * List all locations for a specific account (with pagination)
 * Endpoint: GET mybusinessbusinessinformation.googleapis.com/v1/accounts/{accountId}/locations
 * 
 * IMPORTANT: This API requires a readMask parameter!
 * The old API (v4) did not require this.
 */
export async function l

// Widget Settings Types
export interface WidgetSettings {
  id: string;
  locationId: string;
  
  // Layout & Display
  layout: 'list' | 'grid' | 'carousel';
  theme: 'light' | 'dark' | 'auto';
  accentColor: string;
  maxReviews: number;
  
  // Filtering
  minStars: number;
  autoPublish: boolean;
  autoPublishStars: number;
  
  // Display Options
  showDate: boolean;
  showReviewerName: boolean;
  showReviewerPhoto: boolean;
  showRating: boolean;
  showReply: boolean;
  showSummary: boolean;
  showBadge: boolean;
  
  // Review Link
  showReviewLink: boolean;
  googleReviewUrl: string | null;
  
  createdAt: Date;
  updatedAt: Date;
}

// Review with widget-specific fields
export interface ReviewWithPublishStatus {
  id: string;
  locationId: string;
  googleReviewId: string;
  reviewerName: string | null;
  reviewerPhoto: string | null;
  starRating: number;
  comment: string | null;
  reviewReply: string | null;
  replyTime: Date | null;
  googleCreatedAt: Date;
  googleUpdatedAt: Date;
  isPublished: boolean;
  publishedAt: Date | null;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Widget API Response
export interface WidgetApiResponse {
  reviews: {
    id: string;
    reviewerName: string;
    reviewerPhoto: string | null;
    starRating: number;
    comment: string | null;
    reply: string | null;
    date: Date | null;
    isFeatured: boolean;
  }[];
  settings: {
    layout: string;
    theme: string;
    accentColor: string;
    showDate: boolean;
    showReviewerName: boolean;
    showReviewerPhoto: boolean;
    showRating: boolean;
    showReply: boolean;
    showSummary: boolean;
    showBadge: boolean;
    showReviewLink: boolean;
    googleReviewUrl: string | null;
  };
  summary: {
    averageRating: number;
    totalReviews: number;
    starDistribution: {
      5: number;
      4: number;
      3: number;
      2: number;
      1: number;
    };
    businessName: string;
  } | null;
  active: boolean;
}

// Bulk publish actions
export type BulkPublishAction = 
  | 'publish_all'
  | 'unpublish_all'
  | 'publish_by_stars'
  | 'publish_selected'
  | 'unpublish_selected';

export interface BulkPublishRequest {
  locationId: string;
  action: BulkPublishAction;
  minStars?: number;
  reviewIds?: string[];
}

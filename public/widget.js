/**
 * Local Review Responder - Review Widget
 * Embed this script on any website to display reviews
 * 
 * Usage:
 * <div id="lrr-reviews" data-location="YOUR_LOCATION_ID"></div>
 * <script src="https://your-domain.com/widget.js" async></script>
 */

(function() {
  'use strict';

  // Configuration
  const API_BASE = window.LRR_API_BASE || 'https://local-review-responder.vercel.app';
  const WIDGET_VERSION = '1.0.0';

  // Find the widget container
  const container = document.getElementById('lrr-reviews');
  if (!container) {
    console.warn('LRR Widget: No container found with id="lrr-reviews"');
    return;
  }

  const locationId = container.dataset.location;
  if (!locationId) {
    console.warn('LRR Widget: No data-location attribute found');
    return;
  }

  // Inject styles
  const styles = `
    .lrr-widget {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      max-width: 100%;
      margin: 0 auto;
    }
    .lrr-widget * {
      box-sizing: border-box;
    }
    .lrr-widget.lrr-dark {
      color: #f3f4f6;
    }
    .lrr-widget.lrr-light {
      color: #1f2937;
    }
    
    /* Summary Section */
    .lrr-summary {
      display: flex;
      align-items: center;
      gap: 24px;
      padding: 20px;
      border-radius: 12px;
      margin-bottom: 20px;
    }
    .lrr-light .lrr-summary {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
    }
    .lrr-dark .lrr-summary {
      background: #1f2937;
      border: 1px solid #374151;
    }
    .lrr-summary-rating {
      text-align: center;
    }
    .lrr-summary-number {
      font-size: 48px;
      font-weight: 700;
      line-height: 1;
    }
    .lrr-summary-stars {
      margin: 8px 0;
    }
    .lrr-summary-count {
      font-size: 14px;
      opacity: 0.7;
    }
    .lrr-summary-bars {
      flex: 1;
    }
    .lrr-bar-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;
      font-size: 13px;
    }
    .lrr-bar-label {
      width: 20px;
      text-align: right;
    }
    .lrr-bar-track {
      flex: 1;
      height: 8px;
      border-radius: 4px;
      overflow: hidden;
    }
    .lrr-light .lrr-bar-track {
      background: #e5e7eb;
    }
    .lrr-dark .lrr-bar-track {
      background: #374151;
    }
    .lrr-bar-fill {
      height: 100%;
      border-radius: 4px;
      transition: width 0.3s ease;
    }
    .lrr-bar-count {
      width: 30px;
      font-size: 12px;
      opacity: 0.6;
    }
    
    /* Review List */
    .lrr-reviews-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .lrr-reviews-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 16px;
    }
    
    /* Review Card */
    .lrr-review {
      padding: 20px;
      border-radius: 12px;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .lrr-light .lrr-review {
      background: #ffffff;
      border: 1px solid #e5e7eb;
    }
    .lrr-dark .lrr-review {
      background: #1f2937;
      border: 1px solid #374151;
    }
    .lrr-review:hover {
      transform: translateY(-2px);
    }
    .lrr-light .lrr-review:hover {
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    .lrr-dark .lrr-review:hover {
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    }
    .lrr-review-featured {
      position: relative;
    }
    .lrr-review-featured::before {
      content: '★ Featured';
      position: absolute;
      top: -10px;
      right: 16px;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
    }
    .lrr-review-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
    }
    .lrr-reviewer-photo {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      object-fit: cover;
    }
    .lrr-reviewer-placeholder {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 18px;
    }
    .lrr-light .lrr-reviewer-placeholder {
      background: #e5e7eb;
      color: #6b7280;
    }
    .lrr-dark .lrr-reviewer-placeholder {
      background: #374151;
      color: #9ca3af;
    }
    .lrr-reviewer-info {
      flex: 1;
    }
    .lrr-reviewer-name {
      font-weight: 600;
      font-size: 15px;
    }
    .lrr-review-date {
      font-size: 13px;
      opacity: 0.6;
    }
    .lrr-review-stars {
      margin-bottom: 12px;
    }
    .lrr-review-text {
      font-size: 15px;
      line-height: 1.6;
    }
    .lrr-review-reply {
      margin-top: 16px;
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 14px;
    }
    .lrr-light .lrr-review-reply {
      background: #f3f4f6;
      border-left: 3px solid;
    }
    .lrr-dark .lrr-review-reply {
      background: #111827;
      border-left: 3px solid;
    }
    .lrr-reply-label {
      font-weight: 600;
      font-size: 12px;
      text-transform: uppercase;
      margin-bottom: 4px;
      opacity: 0.7;
    }
    
    /* Star Rating */
    .lrr-stars {
      display: inline-flex;
      gap: 2px;
    }
    .lrr-star {
      width: 18px;
      height: 18px;
    }
    .lrr-star-filled {
      fill: #fbbf24;
    }
    .lrr-star-empty {
      fill: #d1d5db;
    }
    .lrr-dark .lrr-star-empty {
      fill: #4b5563;
    }
    
    /* Review Link Button */
    .lrr-review-link {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 12px 24px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 15px;
      text-decoration: none;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      margin-top: 20px;
    }
    .lrr-review-link:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    
    /* Powered By Badge */
    .lrr-badge {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      margin-top: 24px;
      padding: 12px;
      font-size: 12px;
      opacity: 0.6;
      text-decoration: none;
      transition: opacity 0.2s ease;
    }
    .lrr-badge:hover {
      opacity: 1;
    }
    .lrr-light .lrr-badge {
      color: #6b7280;
    }
    .lrr-dark .lrr-badge {
      color: #9ca3af;
    }
    
    /* Loading State */
    .lrr-loading {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px;
    }
    .lrr-spinner {
      width: 32px;
      height: 32px;
      border: 3px solid #e5e7eb;
      border-top-color: #3b82f6;
      border-radius: 50%;
      animation: lrr-spin 0.8s linear infinite;
    }
    @keyframes lrr-spin {
      to { transform: rotate(360deg); }
    }
    
    /* Empty State */
    .lrr-empty {
      text-align: center;
      padding: 40px;
      opacity: 0.6;
    }

    /* Responsive */
    @media (max-width: 640px) {
      .lrr-summary {
        flex-direction: column;
        text-align: center;
      }
      .lrr-summary-bars {
        width: 100%;
      }
    }
  `;

  // Inject stylesheet
  const styleEl = document.createElement('style');
  styleEl.textContent = styles;
  document.head.appendChild(styleEl);

  // Star SVG helper
  function starSVG(filled) {
    return `<svg class="lrr-star ${filled ? 'lrr-star-filled' : 'lrr-star-empty'}" viewBox="0 0 20 20" fill="currentColor">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
    </svg>`;
  }

  // Render stars
  function renderStars(rating) {
    let html = '<div class="lrr-stars">';
    for (let i = 1; i <= 5; i++) {
      html += starSVG(i <= rating);
    }
    html += '</div>';
    return html;
  }

  // Format date
  function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }

  // Get initials
  function getInitials(name) {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  // Show loading
  container.innerHTML = '<div class="lrr-widget lrr-light"><div class="lrr-loading"><div class="lrr-spinner"></div></div></div>';

  // Fetch data
  fetch(`${API_BASE}/api/widget/${locationId}`, {
    headers: { 'Accept': 'application/json' }
  })
  .then(res => res.json())
  .then(data => {
    if (!data.active || data.reviews.length === 0) {
      container.innerHTML = '';
      return;
    }

    const { reviews, settings, summary } = data;
    const theme = settings.theme === 'dark' ? 'lrr-dark' : 'lrr-light';
    const layoutClass = settings.layout === 'grid' ? 'lrr-reviews-grid' : 'lrr-reviews-list';

    let html = `<div class="lrr-widget ${theme}">`;

    // Summary section
    if (settings.showSummary && summary) {
      const maxCount = Math.max(...Object.values(summary.starDistribution), 1);
      html += `
        <div class="lrr-summary">
          <div class="lrr-summary-rating">
            <div class="lrr-summary-number" style="color: ${settings.accentColor}">${summary.averageRating}</div>
            <div class="lrr-summary-stars">${renderStars(Math.round(summary.averageRating))}</div>
            <div class="lrr-summary-count">${summary.totalReviews} reviews</div>
          </div>
          <div class="lrr-summary-bars">
            ${[5,4,3,2,1].map(star => `
              <div class="lrr-bar-row">
                <span class="lrr-bar-label">${star}</span>
                <div class="lrr-bar-track">
                  <div class="lrr-bar-fill" style="width: ${(summary.starDistribution[star] / maxCount) * 100}%; background: ${settings.accentColor}"></div>
                </div>
                <span class="lrr-bar-count">${summary.starDistribution[star]}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    // Reviews
    html += `<div class="${layoutClass}">`;
    
    reviews.forEach(review => {
      const featuredClass = review.isFeatured ? 'lrr-review-featured' : '';
      html += `
        <div class="lrr-review ${featuredClass}" ${review.isFeatured ? `style="border-color: ${settings.accentColor}"` : ''}>
          ${review.isFeatured ? `<style>.lrr-review-featured::before { background: ${settings.accentColor}; color: white; }</style>` : ''}
          <div class="lrr-review-header">
            ${settings.showReviewerPhoto && review.reviewerPhoto 
              ? `<img src="${review.reviewerPhoto}" alt="${review.reviewerName}" class="lrr-reviewer-photo">`
              : `<div class="lrr-reviewer-placeholder">${getInitials(review.reviewerName)}</div>`
            }
            <div class="lrr-reviewer-info">
              ${settings.showReviewerName ? `<div class="lrr-reviewer-name">${review.reviewerName}</div>` : ''}
              ${settings.showDate && review.date ? `<div class="lrr-review-date">${formatDate(review.date)}</div>` : ''}
            </div>
          </div>
          ${settings.showRating ? `<div class="lrr-review-stars">${renderStars(review.starRating)}</div>` : ''}
          ${review.comment ? `<div class="lrr-review-text">${review.comment}</div>` : ''}
          ${settings.showReply && review.reply ? `
            <div class="lrr-review-reply" style="border-left-color: ${settings.accentColor}">
              <div class="lrr-reply-label">Response from ${summary?.businessName || 'Owner'}</div>
              ${review.reply}
            </div>
          ` : ''}
        </div>
      `;
    });

    html += '</div>';

    // Leave a Review link
    if (settings.showReviewLink && settings.googleReviewUrl) {
      html += `
        <a href="${settings.googleReviewUrl}" target="_blank" rel="noopener" class="lrr-review-link" style="background: ${settings.accentColor}; color: white;">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
          </svg>
          Leave us a review
        </a>
      `;
    }

    // Powered by badge
    if (settings.showBadge) {
      html += `
        <a href="https://localreviewresponder.com?ref=widget" target="_blank" rel="noopener" class="lrr-badge">
          Powered by Local Review Responder
        </a>
      `;
    }

    html += '</div>';
    
    container.innerHTML = html;
  })
  .catch(err => {
    console.error('LRR Widget error:', err);
    container.innerHTML = '';
  });

})();

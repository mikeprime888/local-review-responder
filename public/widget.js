(function() {
  var container = document.getElementById('lrr-reviews');
  if (!container) return;

  var locationId = container.getAttribute('data-location');
  if (!locationId) return;

  var origin = (function() {
    var scripts = document.getElementsByTagName('script');
    for (var i = 0; i < scripts.length; i++) {
      if (scripts[i].src && scripts[i].src.indexOf('widget.js') !== -1) {
        return scripts[i].src.replace('/widget.js', '');
      }
    }
    return '';
  })();

  fetch(origin + '/api/widget/' + locationId)
    .then(function(res) { return res.json(); })
    .then(function(data) {
      if (!data.reviews || data.reviews.length === 0) return;

      var s = data.settings || {};
      var theme = s.theme || 'light';
      var accent = s.accentColor || '#4F46E5';
      var layout = s.layout || 'carousel';
      var showName = s.showName !== false;
      var showDate = s.showDate !== false;
      var showBadge = s.showBadge !== false;

      var isDark = theme === 'dark';
      var bg = isDark ? '#1f2937' : '#ffffff';
      var textColor = isDark ? '#f3f4f6' : '#1f2937';
      var subText = isDark ? '#9ca3af' : '#6b7280';
      var border = isDark ? '#374151' : '#e5e7eb';

      function stars(rating) {
        var html = '';
        for (var i = 0; i < 5; i++) {
          html += '<span style="color:' + (i < rating ? '#facc15' : '#d1d5db') + ';font-size:16px;">&#9733;</span>';
        }
        return html;
      }

      function card(review) {
        var html = '<div style="background:' + bg + ';border:1px solid ' + border + ';border-radius:12px;padding:20px;min-width:280px;max-width:360px;flex-shrink:0;">';
        html += '<div style="margin-bottom:8px;">' + stars(review.starRating) + '</div>';
        if (review.comment) {
          html += '<p style="color:' + textColor + ';font-size:14px;line-height:1.5;margin:0 0 12px 0;">' + review.comment + '</p>';
        }
        if (showName && review.reviewerName) {
          html += '<p style="color:' + subText + ';font-size:13px;margin:0;font-weight:500;">' + review.reviewerName;
          if (showDate && review.googleCreatedAt) {
            html += ' &middot; ' + new Date(review.googleCreatedAt).toLocaleDateString();
          }
          html += '</p>';
        } else if (showDate && review.googleCreatedAt) {
          html += '<p style="color:' + subText + ';font-size:13px;margin:0;">' + new Date(review.googleCreatedAt).toLocaleDateString() + '</p>';
        }
        html += '</div>';
        return html;
      }

      var wrapper = '';
      wrapper += '<div style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;">';

      if (data.location) {
        wrapper += '<div style="text-align:center;margin-bottom:20px;">';
        wrapper += '<div style="font-size:24px;font-weight:700;color:' + textColor + ';">' + stars(Math.round(data.location.averageRating || 0)) + '</div>';
        wrapper += '<p style="color:' + subText + ';font-size:14px;margin:4px 0 0 0;">' + (data.location.averageRating || 0).toFixed(1) + ' average from ' + (data.location.totalReviews || 0) + ' reviews</p>';
        wrapper += '</div>';
      }

      if (layout === 'carousel') {
        wrapper += '<div style="display:flex;gap:16px;overflow-x:auto;padding-bottom:8px;scroll-snap-type:x mandatory;">';
        data.reviews.forEach(function(r) { wrapper += '<div style="scroll-snap-align:start;">' + card(r) + '</div>'; });
        wrapper += '</div>';
      } else if (layout === 'grid') {
        wrapper += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px;">';
        data.reviews.forEach(function(r) { wrapper += card(r); });
        wrapper += '</div>';
      } else {
        wrapper += '<div style="display:flex;flex-direction:column;gap:12px;">';
        data.reviews.forEach(function(r) { wrapper += card(r); });
        wrapper += '</div>';
      }

      if (showBadge) {
        wrapper += '<div style="text-align:center;margin-top:16px;">';
        wrapper += '<a href="https://localreviewresponder.com" target="_blank" rel="noopener" style="color:' + subText + ';font-size:11px;text-decoration:none;">Powered by Local Review Responder</a>';
        wrapper += '</div>';
      }

      wrapper += '</div>';
      container.innerHTML = wrapper;
    })
    .catch(function(err) {
      console.error('LRR Widget Error:', err);
    });
})();

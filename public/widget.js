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

  // ── Avatar color palette ──────────────────────────────────────────
  var avatarColors = [
    '#4285F4', '#EA4335', '#FBBC05', '#34A853', '#FF6D01',
    '#46BDC6', '#7B61FF', '#E91E63', '#00BCD4', '#8BC34A'
  ];

  function hashName(name) {
    var h = 0;
    for (var i = 0; i < name.length; i++) {
      h = name.charCodeAt(i) + ((h << 5) - h);
    }
    return Math.abs(h);
  }

  function getInitial(name) {
    if (!name) return '?';
    return name.trim().charAt(0).toUpperCase();
  }

  // ── Google "G" SVG icon ───────────────────────────────────────────
  var googleGIcon = '<svg viewBox="0 0 48 48" style="width:20px;height:20px;flex-shrink:0;">' +
    '<path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>' +
    '<path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>' +
    '<path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>' +
    '<path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>' +
    '</svg>';

  // ── Star rendering ────────────────────────────────────────────────
  function stars(rating, size) {
    var s = size || 18;
    var html = '';
    for (var i = 0; i < 5; i++) {
      html += '<span style="color:' + (i < rating ? '#F4B400' : '#dadce0') + ';font-size:' + s + 'px;line-height:1;">&#9733;</span>';
    }
    return html;
  }

  // ── Date formatting ───────────────────────────────────────────────
  function formatDate(dateStr) {
    var d = new Date(dateStr);
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
  }

  // ── Truncate & "Read more" ────────────────────────────────────────
  function truncateText(text, max) {
    if (!text || text.length <= max) return text || '';
    return text.substring(0, max) + '...';
  }

  // ── Fetch & render ────────────────────────────────────────────────
  fetch(origin + '/api/widget/' + locationId)
    .then(function(res) { return res.json(); })
    .then(function(data) {
      if (!data.reviews || data.reviews.length === 0) return;

      var s = data.settings || {};
      var theme = s.theme || 'light';
      var accent = s.accentColor || '#4285F4';
      var layout = s.layout || 'carousel';
      var showName = s.showName !== false;
      var showDate = s.showDate !== false;
      var showBadge = s.showBadge !== false;

      var isDark = theme === 'dark';
      var containerBg = isDark ? '#1a1a2e' : '#EBF2FA';
      var cardBg = isDark ? '#1f2937' : '#ffffff';
      var textColor = isDark ? '#f3f4f6' : '#1f2937';
      var subText = isDark ? '#9ca3af' : '#5f6368';
      var borderColor = isDark ? '#374151' : '#e8eaed';
      var arrowBg = isDark ? '#374151' : '#ffffff';
      var arrowColor = isDark ? '#d1d5db' : '#5f6368';
      var dotActive = accent;
      var dotInactive = isDark ? '#4b5563' : '#dadce0';

      var maxChars = 180;
      var reviews = data.reviews;
      var totalPages = Math.ceil(reviews.length / 3);
      var currentPage = 0;
      var autoInterval = null;

      // ── Build card HTML ─────────────────────────────────────────
      function card(review) {
        var name = review.reviewerName || 'Anonymous';
        var photo = review.reviewerPhoto;
        var color = avatarColors[hashName(name) % avatarColors.length];
        var initial = getInitial(name);
        var hasLongComment = review.comment && review.comment.length > maxChars;
        var displayComment = hasLongComment ? truncateText(review.comment, maxChars) : (review.comment || '');
        var reviewId = 'lrr-review-' + review.id;

        var html = '<div style="background:' + cardBg + ';border:1px solid ' + borderColor + ';border-radius:16px;padding:24px;flex:0 0 calc(33.333% - 12px);min-width:280px;box-sizing:border-box;display:flex;flex-direction:column;gap:12px;">';

        // Header row: avatar + name/date + Google icon
        html += '<div style="display:flex;align-items:center;gap:12px;">';

        // Avatar
        if (photo) {
          html += '<img src="' + photo + '" alt="' + name + '" style="width:44px;height:44px;border-radius:50%;object-fit:cover;flex-shrink:0;" onerror="this.style.display=\'none\';this.nextSibling.style.display=\'flex\';" />';
          html += '<div style="display:none;width:44px;height:44px;border-radius:50%;background:' + color + ';align-items:center;justify-content:center;flex-shrink:0;color:#fff;font-size:18px;font-weight:600;">' + initial + '</div>';
        } else {
          html += '<div style="display:flex;width:44px;height:44px;border-radius:50%;background:' + color + ';align-items:center;justify-content:center;flex-shrink:0;color:#fff;font-size:18px;font-weight:600;">' + initial + '</div>';
        }

        // Name + date
        html += '<div style="flex:1;min-width:0;">';
        if (showName) {
          html += '<div style="font-size:15px;font-weight:600;color:' + textColor + ';white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + name + '</div>';
        }
        if (showDate && review.googleCreatedAt) {
          html += '<div style="font-size:13px;color:' + subText + ';margin-top:2px;">' + formatDate(review.googleCreatedAt) + '</div>';
        }
        html += '</div>';

        // Google icon
        html += googleGIcon;

        html += '</div>'; // end header row

        // Stars
        html += '<div>' + stars(review.starRating) + '</div>';

        // Comment with Read more
        if (displayComment) {
          html += '<div style="font-size:14px;line-height:1.6;color:' + textColor + ';margin:0;">';
          html += '<span id="' + reviewId + '-short">' + displayComment + '</span>';
          if (hasLongComment) {
            html += '<span id="' + reviewId + '-full" style="display:none;">' + review.comment + '</span>';
            html += ' <a href="javascript:void(0)" style="color:' + accent + ';text-decoration:none;font-weight:500;font-size:13px;cursor:pointer;" onclick="(function(e){var s=document.getElementById(\'' + reviewId + '-short\');var f=document.getElementById(\'' + reviewId + '-full\');if(s.style.display!==\'none\'){s.style.display=\'none\';f.style.display=\'inline\';e.textContent=\'Show less\';}else{s.style.display=\'inline\';f.style.display=\'none\';e.textContent=\'Read more\';}})(this)">Read more</a>';
          }
          html += '</div>';
        }

        html += '</div>';
        return html;
      }

      // ── Main widget wrapper ─────────────────────────────────────
      var widgetId = 'lrr-widget-' + locationId.substring(0, 8);
      var wrapper = '';
      wrapper += '<div id="' + widgetId + '" style="font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,Oxygen,Ubuntu,Cantarell,sans-serif;background:' + containerBg + ';border-radius:20px;padding:32px;max-width:100%;box-sizing:border-box;">';

      // ── Header: Overall rating + Write a review ───────────────
      if (data.location) {
        var avg = (data.location.averageRating || 0).toFixed(1);
        var total = data.location.totalReviews || 0;
        var reviewUrl = data.location.mapsUri || '#';

        wrapper += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;flex-wrap:wrap;gap:12px;">';

        // Left side: rating info
        wrapper += '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">';
        wrapper += '<span style="font-size:22px;font-weight:700;color:' + textColor + ';">Overall rating</span>';
        wrapper += '<span style="font-size:22px;font-weight:700;color:' + textColor + ';">' + avg + '</span>';
        wrapper += '<span style="color:#F4B400;font-size:22px;">&#9733;</span>';
        wrapper += '<span style="font-size:16px;color:' + subText + ';margin-left:4px;">|&nbsp; ' + total + ' reviews</span>';
        wrapper += '</div>';

        // Right side: Write a review button
        if (reviewUrl !== '#') {
          wrapper += '<a href="' + reviewUrl + '" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;padding:12px 24px;background:' + accent + ';color:#ffffff;border-radius:8px;font-size:15px;font-weight:600;text-decoration:none;white-space:nowrap;transition:opacity 0.2s;" onmouseover="this.style.opacity=\'0.9\'" onmouseout="this.style.opacity=\'1\'">Write a review</a>';
        }

        wrapper += '</div>';
      }

      // ── Carousel layout ───────────────────────────────────────
      if (layout === 'carousel' && reviews.length > 0) {
        var trackId = widgetId + '-track';
        var dotsId = widgetId + '-dots';

        // Carousel container with arrows
        wrapper += '<div style="position:relative;">';

        // Left arrow
        wrapper += '<button id="' + widgetId + '-prev" onclick="(function(){var w=document.getElementById(\'' + widgetId + '\');if(w&&w._lrrPrev)w._lrrPrev();})()" style="position:absolute;left:-16px;top:50%;transform:translateY(-50%);z-index:2;width:44px;height:44px;border-radius:50%;border:1px solid ' + borderColor + ';background:' + arrowBg + ';color:' + arrowColor + ';font-size:20px;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.1);transition:box-shadow 0.2s;" onmouseover="this.style.boxShadow=\'0 4px 12px rgba(0,0,0,0.15)\'" onmouseout="this.style.boxShadow=\'0 2px 8px rgba(0,0,0,0.1)\'">&#8249;</button>';

        // Track
        wrapper += '<div style="overflow:hidden;margin:0 20px;">';
        wrapper += '<div id="' + trackId + '" style="display:flex;gap:16px;transition:transform 0.4s ease;">';
        reviews.forEach(function(r) { wrapper += card(r); });
        wrapper += '</div>';
        wrapper += '</div>';

        // Right arrow
        wrapper += '<button id="' + widgetId + '-next" onclick="(function(){var w=document.getElementById(\'' + widgetId + '\');if(w&&w._lrrNext)w._lrrNext();})()" style="position:absolute;right:-16px;top:50%;transform:translateY(-50%);z-index:2;width:44px;height:44px;border-radius:50%;border:1px solid ' + borderColor + ';background:' + arrowBg + ';color:' + arrowColor + ';font-size:20px;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.1);transition:box-shadow 0.2s;" onmouseover="this.style.boxShadow=\'0 4px 12px rgba(0,0,0,0.15)\'" onmouseout="this.style.boxShadow=\'0 2px 8px rgba(0,0,0,0.1)\'">&#8250;</button>';

        wrapper += '</div>';

        // Dots
        if (totalPages > 1) {
          wrapper += '<div id="' + dotsId + '" style="display:flex;justify-content:center;gap:8px;margin-top:20px;">';
          for (var p = 0; p < totalPages; p++) {
            wrapper += '<button onclick="(function(){var w=document.getElementById(\'' + widgetId + '\');if(w&&w._lrrGoTo)w._lrrGoTo(' + p + ');})()" style="width:10px;height:10px;border-radius:50%;border:none;cursor:pointer;padding:0;background:' + (p === 0 ? dotActive : dotInactive) + ';transition:background 0.3s;"></button>';
          }
          wrapper += '</div>';
        }

      } else if (layout === 'grid') {
        // ── Grid layout ───────────────────────────────────────────
        wrapper += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px;">';
        reviews.forEach(function(r) { wrapper += card(r); });
        wrapper += '</div>';

      } else {
        // ── List layout ───────────────────────────────────────────
        wrapper += '<div style="display:flex;flex-direction:column;gap:16px;">';
        reviews.forEach(function(r) { wrapper += card(r); });
        wrapper += '</div>';
      }

      // ── Powered by badge ──────────────────────────────────────
      if (showBadge) {
        wrapper += '<div style="text-align:center;margin-top:20px;">';
        wrapper += '<a href="https://localreviewresponder.com" target="_blank" rel="noopener" style="color:' + subText + ';font-size:11px;text-decoration:none;opacity:0.7;">Powered by Local Review Responder</a>';
        wrapper += '</div>';
      }

      wrapper += '</div>';
      container.innerHTML = wrapper;

      // ── Carousel controller ─────────────────────────────────────
      if (layout === 'carousel' && reviews.length > 0) {
        var widgetEl = document.getElementById(widgetId);
        var track = document.getElementById(widgetId + '-track');
        var dotsContainer = document.getElementById(widgetId + '-dots');

        function getCardsPerView() {
          var trackParent = track.parentElement;
          var containerW = trackParent.offsetWidth;
          if (containerW >= 900) return 3;
          if (containerW >= 580) return 2;
          return 1;
        }

        function updateCarousel() {
          var cardsPerView = getCardsPerView();
          var maxPage = Math.max(0, Math.ceil(reviews.length / cardsPerView) - 1);
          if (currentPage > maxPage) currentPage = maxPage;

          var cards = track.children;
          if (cards.length === 0) return;

          var cardWidth = cards[0].offsetWidth;
          var gap = 16;
          var offset = currentPage * cardsPerView * (cardWidth + gap);
          track.style.transform = 'translateX(-' + offset + 'px)';

          // Update dots
          if (dotsContainer) {
            var dots = dotsContainer.children;
            var newTotalPages = maxPage + 1;

            // Rebuild dots if count changed
            if (dots.length !== newTotalPages) {
              dotsContainer.innerHTML = '';
              for (var dp = 0; dp < newTotalPages; dp++) {
                var dot = document.createElement('button');
                dot.style.cssText = 'width:10px;height:10px;border-radius:50%;border:none;cursor:pointer;padding:0;transition:background 0.3s;';
                (function(page) {
                  dot.onclick = function() { widgetEl._lrrGoTo(page); };
                })(dp);
                dotsContainer.appendChild(dot);
              }
              dots = dotsContainer.children;
            }

            for (var d = 0; d < dots.length; d++) {
              dots[d].style.background = d === currentPage ? dotActive : dotInactive;
            }
          }
        }

        function goTo(page) {
          var cardsPerView = getCardsPerView();
          var maxPage = Math.max(0, Math.ceil(reviews.length / cardsPerView) - 1);
          currentPage = Math.max(0, Math.min(page, maxPage));
          updateCarousel();
        }

        function next() {
          var cardsPerView = getCardsPerView();
          var maxPage = Math.max(0, Math.ceil(reviews.length / cardsPerView) - 1);
          currentPage = currentPage >= maxPage ? 0 : currentPage + 1;
          updateCarousel();
        }

        function prev() {
          var cardsPerView = getCardsPerView();
          var maxPage = Math.max(0, Math.ceil(reviews.length / cardsPerView) - 1);
          currentPage = currentPage <= 0 ? maxPage : currentPage - 1;
          updateCarousel();
        }

        // Attach methods to widget element
        widgetEl._lrrNext = next;
        widgetEl._lrrPrev = prev;
        widgetEl._lrrGoTo = goTo;

        // Auto-rotate every 5 seconds
        function startAuto() {
          stopAuto();
          autoInterval = setInterval(next, 5000);
        }
        function stopAuto() {
          if (autoInterval) { clearInterval(autoInterval); autoInterval = null; }
        }

        widgetEl.addEventListener('mouseenter', stopAuto);
        widgetEl.addEventListener('mouseleave', startAuto);

        // Responsive resize
        var resizeTimer;
        window.addEventListener('resize', function() {
          clearTimeout(resizeTimer);
          resizeTimer = setTimeout(updateCarousel, 150);
        });

        // Initialize
        updateCarousel();
        startAuto();
      }

    })
    .catch(function(err) {
      console.error('LRR Widget Error:', err);
    });
})();

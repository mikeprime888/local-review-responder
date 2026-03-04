(function() {
  var container = document.getElementById('lrr-widget');
  if (!container) return;

  var locationId = container.getAttribute('data-location-id');
  if (!locationId) return;

  var origin = (function() {
    var scripts = document.getElementsByTagName('script');
    for (var i = 0; i < scripts.length; i++) {
      if (scripts[i].src && scripts[i].src.indexOf('widget.js') !== -1) {
        return scripts[i].src.replace('/widget.js', '');
      }
    }
    return 'https://app.localreviewresponder.com';
  })();

  // ── Avatar color palette ──────────────────────────────────────────────────
  var avatarColors = [
    '#4285F4','#EA4335','#FBBC05','#34A853',
    '#FF6D01','#46BDC6','#7B61FF','#E91E63','#00BCD4','#8BC34A'
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

  // ── Google "G" SVG icon ───────────────────────────────────────────────────
  var googleGIcon = '<svg viewBox="0 0 48 48" style="width:20px;height:20px;flex-shrink:0;">' +
    '<path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>' +
    '<path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>' +
    '<path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>' +
    '<path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>' +
    '</svg>';

  // ── Star rendering ────────────────────────────────────────────────────────
  function stars(rating, size) {
    var s = size || 16;
    var html = '';
    for (var i = 0; i < 5; i++) {
      html += '<span style="color:' + (i < rating ? '#F4B400' : '#dadce0') + ';font-size:' + s + 'px;line-height:1;">&#9733;</span>';
    }
    return html;
  }

  // ── Date formatting ───────────────────────────────────────────────────────
  function formatDate(dateStr) {
    var d = new Date(dateStr);
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return months[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
  }

  // ── Truncate text ─────────────────────────────────────────────────────────
  function truncateText(text, max) {
    if (!text || text.length <= max) return text || '';
    return text.substring(0, max) + '...';
  }

  // ── Fetch & render ────────────────────────────────────────────────────────
  fetch(origin + '/api/widget/' + locationId)
    .then(function(res) { return res.json(); })
    .then(function(data) {
      if (!data.reviews || data.reviews.length === 0) return;

      var s = data.settings || {};
      var theme      = s.theme      || 'light';
      var accent     = s.accentColor || '#4285F4';
      var layout     = s.layout     || 'carousel';
      var showName   = s.showName   !== false;
      var showDate   = s.showDate   !== false;
      var showBadge  = s.showBadge  !== false;

      var isDark       = theme === 'dark';
      var containerBg  = isDark ? '#1a1a2e' : '#EBF2FA';
      var cardBg       = isDark ? '#1f2937' : '#ffffff';
      var textColor    = isDark ? '#f3f4f6' : '#1f2937';
      var subText      = isDark ? '#9ca3af' : '#5f6368';
      var borderColor  = isDark ? '#374151' : '#e8eaed';
      var arrowBg      = isDark ? '#374151' : '#ffffff';
      var arrowColor   = isDark ? '#d1d5db' : '#5f6368';
      var dotActive    = accent;
      var dotInactive  = isDark ? '#4b5563' : '#dadce0';

      var maxChars     = 180;
      var reviews      = data.reviews;
      var CARDS_PER_PAGE = 3;
      var currentPage  = 0;
      var autoInterval = null;

      // ── Build single card HTML ──────────────────────────────────────────
      function buildCard(review) {
        var name    = review.reviewerName || 'Anonymous';
        var photo   = review.reviewerPhoto;
        var color   = avatarColors[hashName(name) % avatarColors.length];
        var initial = getInitial(name);
        var comment = review.comment || '';
        var hasLong = comment.length > maxChars;
        var short   = hasLong ? truncateText(comment, maxChars) : comment;
        var reviewId = 'lrr-r-' + review.id;

        var html = '<div style="background:' + cardBg + ';border:1px solid ' + borderColor + ';border-radius:16px;padding:20px;box-sizing:border-box;display:flex;flex-direction:column;gap:10px;min-width:0;">';

        // Header: avatar + name/date + Google icon
        html += '<div style="display:flex;align-items:center;gap:10px;">';

        if (photo) {
          html += '<img src="' + photo + '" alt="' + name + '" style="width:40px;height:40px;border-radius:50%;object-fit:cover;flex-shrink:0;" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\';" />';
          html += '<div style="display:none;width:40px;height:40px;border-radius:50%;background:' + color + ';align-items:center;justify-content:center;flex-shrink:0;color:#fff;font-size:16px;font-weight:600;">' + initial + '</div>';
        } else {
          html += '<div style="display:flex;width:40px;height:40px;border-radius:50%;background:' + color + ';align-items:center;justify-content:center;flex-shrink:0;color:#fff;font-size:16px;font-weight:600;">' + initial + '</div>';
        }

        html += '<div style="flex:1;min-width:0;">';
        if (showName) {
          html += '<div style="font-size:14px;font-weight:600;color:' + textColor + ';white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + name + '</div>';
        }
        html += '<div style="display:flex;align-items:center;gap:6px;margin-top:2px;">' + stars(review.starRating) + googleGIcon + '</div>';
        html += '</div>';
        html += '</div>';

        // Date
        if (showDate && review.googleCreatedAt) {
          html += '<div style="font-size:12px;color:' + subText + ';">' + formatDate(review.googleCreatedAt) + '</div>';
        }

        // Comment + Read more (inline expand)
        if (comment) {
          html += '<div style="font-size:13px;line-height:1.6;color:' + textColor + ';">';
          html += '<span id="' + reviewId + '-s">' + short + '</span>';
          if (hasLong) {
            html += '<span id="' + reviewId + '-f" style="display:none;">' + comment + '</span>';
            html += ' <a href="javascript:void(0)" style="color:' + accent + ';font-size:13px;font-weight:500;text-decoration:none;" ' +
              'onclick="(function(el){' +
              'var s=document.getElementById(\'' + reviewId + '-s\');' +
              'var f=document.getElementById(\'' + reviewId + '-f\');' +
              'if(s.style.display!==\'none\'){s.style.display=\'none\';f.style.display=\'inline\';el.textContent=\'Show less\';}' +
              'else{s.style.display=\'inline\';f.style.display=\'none\';el.textContent=\'Read more\';}' +
              '})(this)">Read more</a>';
          }
          html += '</div>';
        }

        html += '</div>';
        return html;
      }

      // ── Widget shell ────────────────────────────────────────────────────
      var widgetId = 'lrr-w-' + locationId.substring(0, 8);

      var wrapper = '<div id="' + widgetId + '" style="' +
        'font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;' +
        'background:' + containerBg + ';' +
        'border-radius:20px;padding:28px;max-width:100%;box-sizing:border-box;">';

      // ── Header: overall rating + write a review ─────────────────────────
      if (data.location) {
        var avg = (data.location.averageRating || 0).toFixed(1);
        var total = data.location.totalReviews || 0;

        wrapper += '<div style="text-align:center;margin-bottom:20px;">';
        wrapper += '<div style="display:inline-flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:center;">';
        wrapper += '<span style="font-size:32px;font-weight:700;color:' + textColor + ';">Overall Rating</span>';
        wrapper += '<span style="font-size:32px;font-weight:700;color:' + textColor + ';">' + avg + '</span>';
        wrapper += '<span style="color:#F4B400;font-size:32px;line-height:1;">&#9733;</span>';
        wrapper += '<span style="font-size:16px;color:' + subText + ';margin-left:4px;">| ' + total + ' reviews</span>';
        wrapper += '</div>';
        wrapper += '</div>';
      }

      // ── Carousel layout ─────────────────────────────────────────────────
      if (layout === 'carousel') {
        var trackId = widgetId + '-track';
        var dotsId  = widgetId + '-dots';

        // Page container: arrow | cards | arrow
        wrapper += '<div style="display:flex;align-items:center;gap:10px;">';

        // Left arrow
        wrapper += '<button id="' + widgetId + '-prev" ' +
          'onclick="(function(){var w=document.getElementById(\'' + widgetId + '\');if(w&&w._lrrPrev)w._lrrPrev();})()" ' +
          'style="flex-shrink:0;width:36px;height:36px;border-radius:50%;border:1px solid ' + borderColor + ';' +
          'background:' + arrowBg + ';color:' + arrowColor + ';font-size:18px;cursor:pointer;' +
          'display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,0.1);">&#8249;</button>';

        // Cards grid
        wrapper += '<div id="' + trackId + '" style="flex:1;display:grid;grid-template-columns:repeat(' + CARDS_PER_PAGE + ',1fr);gap:12px;">';
        // Render first page
        var firstPage = reviews.slice(0, CARDS_PER_PAGE);
        for (var i = 0; i < firstPage.length; i++) {
          wrapper += buildCard(firstPage[i]);
        }
        wrapper += '</div>';

        // Right arrow
        wrapper += '<button id="' + widgetId + '-next" ' +
          'onclick="(function(){var w=document.getElementById(\'' + widgetId + '\');if(w&&w._lrrNext)w._lrrNext();})()" ' +
          'style="flex-shrink:0;width:36px;height:36px;border-radius:50%;border:1px solid ' + borderColor + ';' +
          'background:' + arrowBg + ';color:' + arrowColor + ';font-size:18px;cursor:pointer;' +
          'display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,0.1);">&#8250;</button>';

        wrapper += '</div>'; // end flex row

        // Dots
        var totalPages = Math.ceil(reviews.length / CARDS_PER_PAGE);
        if (totalPages > 1) {
          wrapper += '<div id="' + dotsId + '" style="display:flex;justify-content:center;gap:8px;margin-top:16px;">';
          for (var p = 0; p < totalPages; p++) {
            wrapper += '<button onclick="(function(){var w=document.getElementById(\'' + widgetId + '\');if(w&&w._lrrGoTo)w._lrrGoTo(' + p + ');})()" ' +
              'style="width:' + (p === 0 ? '24px' : '8px') + ';height:8px;border-radius:4px;border:none;cursor:pointer;padding:0;' +
              'background:' + (p === 0 ? dotActive : dotInactive) + ';transition:all 0.3s;"></button>';
          }
          wrapper += '</div>';
        }

      // ── Grid layout ─────────────────────────────────────────────────────
      } else if (layout === 'grid') {
        wrapper += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px;">';
        for (var gi = 0; gi < reviews.length; gi++) {
          wrapper += buildCard(reviews[gi]);
        }
        wrapper += '</div>';

      // ── List layout ─────────────────────────────────────────────────────
      } else {
        wrapper += '<div style="display:flex;flex-direction:column;gap:12px;">';
        for (var li = 0; li < reviews.length; li++) {
          wrapper += buildCard(reviews[li]);
        }
        wrapper += '</div>';
      }

      // ── Powered-by footer ────────────────────────────────────────────────
      wrapper += '<div style="text-align:center;margin-top:16px;">';
      wrapper += '<a href="https://localreviewresponder.com" target="_blank" rel="noopener noreferrer" ' +
        'style="font-size:10px;font-variant:small-caps;letter-spacing:0.5px;color:' + subText + ';text-decoration:none;opacity:0.7;">' +
        'powered by Local Review Responder LLC</a>';
      wrapper += '</div>';

      wrapper += '</div>'; // end widget shell
      container.innerHTML = wrapper;

      // ── Modal for "Read more" ─────────────────────────────────────────────
      var modalId = widgetId + '-modal';
      var modalHtml =
        '<div id="' + modalId + '" onclick="(function(e){if(e.target.id==='' + modalId + ''){document.getElementById('' + modalId + '').style.display='none';}})(event)" ' +
        'style="display:none;position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.5);backdrop-filter:blur(4px);' +
        'align-items:center;justify-content:center;padding:16px;">' +
        '<div id="' + modalId + '-inner" style="background:' + cardBg + ';border-radius:16px;padding:28px;max-width:500px;width:100%;' +
        'max-height:80vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,0.3);position:relative;">' +
        '<button onclick="document.getElementById('' + modalId + '').style.display='none';" ' +
        'style="position:absolute;top:12px;right:12px;background:' + (isDark?'#374151':'#f3f4f6') + ';border:none;border-radius:50%;' +
        'width:30px;height:30px;cursor:pointer;font-size:15px;color:' + subText + ';display:flex;align-items:center;justify-content:center;">&#10005;</button>' +
        '<div id="' + modalId + '-avatar" style="display:flex;align-items:center;gap:14px;margin-bottom:16px;"></div>' +
        '<p id="' + modalId + '-text" style="color:' + textColor + ';font-size:14px;line-height:1.7;margin:0;"></p>' +
        '<div id="' + modalId + '-date" style="color:' + subText + ';font-size:12px;margin-top:12px;"></div>' +
        '</div></div>';
      document.body.insertAdjacentHTML('beforeend', modalHtml);

      window._lrrOpenModal = function(name, initial, color, photo, rating, comment, date) {
        var modal = document.getElementById(modalId);
        var avatarEl = document.getElementById(modalId + '-avatar');
        var textEl = document.getElementById(modalId + '-text');
        var dateEl = document.getElementById(modalId + '-date');

        var avatarHtml = photo
          ? '<img src="' + photo + '" style="width:48px;height:48px;border-radius:50%;object-fit:cover;flex-shrink:0;" onerror="this.style.display='none';this.nextSibling.style.display='flex';" />' +
            '<div style="display:none;width:48px;height:48px;border-radius:50%;background:' + color + ';align-items:center;justify-content:center;flex-shrink:0;color:#fff;font-size:20px;font-weight:600;">' + initial + '</div>'
          : '<div style="display:flex;width:48px;height:48px;border-radius:50%;background:' + color + ';align-items:center;justify-content:center;flex-shrink:0;color:#fff;font-size:20px;font-weight:600;">' + initial + '</div>';

        avatarHtml += '<div><div style="font-weight:600;font-size:16px;color:' + textColor + ';">' + name + '</div>' +
          '<div style="display:flex;align-items:center;gap:6px;margin-top:4px;">' + stars(rating, 18) + googleGIcon + '</div></div>';

        avatarEl.innerHTML = avatarHtml;
        textEl.textContent = comment;
        dateEl.textContent = date;
        modal.style.display = 'flex';
      };

      // ── Carousel controller ───────────────────────────────────────────────
      if (layout === 'carousel') {
        var widgetEl    = document.getElementById(widgetId);
        var track       = document.getElementById(widgetId + '-track');
        var dotsEl      = document.getElementById(widgetId + '-dots');
        var totalPgs    = Math.ceil(reviews.length / CARDS_PER_PAGE);

        function renderPage(page) {
          var start = page * CARDS_PER_PAGE;
          var pageReviews = reviews.slice(start, start + CARDS_PER_PAGE);
          var html = '';
          for (var ri = 0; ri < pageReviews.length; ri++) {
            html += buildCard(pageReviews[ri]);
          }
          track.innerHTML = html;

          // Update grid columns for partial last page
          track.style.gridTemplateColumns = 'repeat(' + Math.min(pageReviews.length, CARDS_PER_PAGE) + ',1fr)';

          // Update dots
          if (dotsEl) {
            var dots = dotsEl.children;
            for (var d = 0; d < dots.length; d++) {
              dots[d].style.background = d === page ? dotActive : dotInactive;
              dots[d].style.width = d === page ? '24px' : '8px';
            }
          }
        }

        function goTo(page) {
          currentPage = Math.max(0, Math.min(page, totalPgs - 1));
          renderPage(currentPage);
        }

        function next() {
          currentPage = currentPage >= totalPgs - 1 ? 0 : currentPage + 1;
          renderPage(currentPage);
        }

        function prev() {
          currentPage = currentPage <= 0 ? totalPgs - 1 : currentPage - 1;
          renderPage(currentPage);
        }

        widgetEl._lrrNext  = next;
        widgetEl._lrrPrev  = prev;
        widgetEl._lrrGoTo  = goTo;

        function startAuto() {
          stopAuto();
          autoInterval = setInterval(next, 5000);
        }
        function stopAuto() {
          if (autoInterval) { clearInterval(autoInterval); autoInterval = null; }
        }

        widgetEl.addEventListener('mouseenter', stopAuto);
        widgetEl.addEventListener('mouseleave', startAuto);
        startAuto();
      }
    })
    .catch(function(err) {
      console.error('LRR Widget Error:', err);
    });
})();

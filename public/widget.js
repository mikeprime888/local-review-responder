(function () {
  var container = document.getElementById('lrr-widget');
  if (!container) return;

  var locationId = container.getAttribute('data-location-id');
  if (!locationId) return;

  var origin = (function () {
    var scripts = document.getElementsByTagName('script');
    for (var i = 0; i < scripts.length; i++) {
      if (scripts[i].src && scripts[i].src.indexOf('widget.js') !== -1) {
        return scripts[i].src.replace('/widget.js', '');
      }
    }
    return 'https://app.localreviewresponder.com';
  })();

  var avatarColors = ['#4285F4','#EA4335','#FBBC05','#34A853','#FF6D01','#46BDC6','#7B61FF','#E91E63','#00BCD4','#8BC34A'];

  function hashName(name) {
    var h = 0;
    for (var i = 0; i < name.length; i++) { h = name.charCodeAt(i) + ((h << 5) - h); }
    return Math.abs(h);
  }

  function getInitial(name) {
    return name ? name.trim().charAt(0).toUpperCase() : '?';
  }

  var googleGIcon = '<svg viewBox="0 0 48 48" style="width:18px;height:18px;flex-shrink:0;">'
    + '<path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>'
    + '<path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>'
    + '<path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>'
    + '<path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>'
    + '</svg>';

  function renderStars(rating, size) {
    var s = size || 16;
    var h = '';
    for (var i = 0; i < 5; i++) {
      h += '<span style="color:' + (i < rating ? '#F4B400' : '#dadce0') + ';font-size:' + s + 'px;line-height:1;">&#9733;</span>';
    }
    return h;
  }

  function formatDate(str) {
    var d = new Date(str);
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return months[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
  }

  function truncate(text, max) {
    if (!text || text.length <= max) return text || '';
    return text.substring(0, max) + '...';
  }

  fetch(origin + '/api/widget/' + locationId)
    .then(function (res) { return res.json(); })
    .then(function (data) {
      if (!data.reviews || data.reviews.length === 0) return;

      var cfg        = data.settings || {};
      var theme      = cfg.theme      || 'light';
      var accent     = cfg.accentColor || '#4285F4';
      var layout     = cfg.layout     || 'carousel';
      var showName   = cfg.showName   !== false;
      var showDate   = cfg.showDate   !== false;

      var isDark      = theme === 'dark';
      var bgWrap      = isDark ? '#1a1a2e' : '#EBF2FA';
      var bgCard      = isDark ? '#1f2937' : '#ffffff';
      var colText     = isDark ? '#f3f4f6' : '#1f2937';
      var colSub      = isDark ? '#9ca3af' : '#5f6368';
      var colBorder   = isDark ? '#374151' : '#e8eaed';
      var colArrowBg  = isDark ? '#374151' : '#ffffff';
      var colArrow    = isDark ? '#d1d5db' : '#5f6368';
      var dotOn       = accent;
      var dotOff      = isDark ? '#4b5563' : '#dadce0';
      var maxChars    = 180;
      var PER_PAGE    = 3;
      var reviews     = data.reviews;
      var currentPage = 0;
      var autoTimer   = null;
      var widgetId    = 'lrr-w-' + locationId.substring(0, 8);
      var modalId     = widgetId + '-modal';

      // ── Card builder ────────────────────────────────────────────────────
      function buildCard(review) {
        var name    = review.reviewerName || 'Anonymous';
        var photo   = review.reviewerPhoto || '';
        var color   = avatarColors[hashName(name) % avatarColors.length];
        var initial = getInitial(name);
        var comment = review.comment || '';
        var hasLong = comment.length > maxChars;
        var short   = hasLong ? truncate(comment, maxChars) : comment;

        var h = '<div style="background:' + bgCard + ';border:1px solid ' + colBorder + ';border-radius:16px;padding:20px;'
              + 'box-sizing:border-box;display:flex;flex-direction:column;gap:10px;min-width:0;">';

        // Avatar + name + stars row
        h += '<div style="display:flex;align-items:center;gap:10px;">';
        if (photo) {
          h += '<img src="' + photo + '" alt="" style="width:40px;height:40px;border-radius:50%;object-fit:cover;flex-shrink:0;"'
             + ' onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\';" />';
          h += '<div style="display:none;width:40px;height:40px;border-radius:50%;background:' + color
             + ';align-items:center;justify-content:center;flex-shrink:0;color:#fff;font-size:16px;font-weight:600;">' + initial + '</div>';
        } else {
          h += '<div style="display:flex;width:40px;height:40px;border-radius:50%;background:' + color
             + ';align-items:center;justify-content:center;flex-shrink:0;color:#fff;font-size:16px;font-weight:600;">' + initial + '</div>';
        }
        h += '<div style="flex:1;min-width:0;">';
        if (showName) {
          h += '<div style="display:flex;align-items:center;gap:6px;">';
          h += '<div style="font-size:14px;font-weight:600;color:' + colText + ';white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1;min-width:0;">' + name + '</div>';
          h += googleGIcon;
          h += '</div>';
        }
        h += '<div style="display:flex;align-items:center;gap:2px;margin-top:3px;">' + renderStars(review.starRating) + '</div>';
        h += '</div></div>';

        // Date
        if (showDate && review.googleCreatedAt) {
          h += '<div style="font-size:12px;color:' + colSub + ';">' + formatDate(review.googleCreatedAt) + '</div>';
        }

        // Comment + Read more → modal
        if (comment) {
          h += '<div style="font-size:13px;line-height:1.6;color:' + colText + ';flex:1;overflow:hidden;">' + short;
          if (hasLong) {
            // Pass data via data attributes to avoid inline quote nightmares
            var safeId = 'lrr-rm-' + review.id;
            h += ' <a href="javascript:void(0)" id="' + safeId + '"'
               + ' style="color:' + accent + ';font-size:13px;font-weight:500;text-decoration:none;"'
               + ' data-name="' + name.replace(/"/g, '&quot;') + '"'
               + ' data-initial="' + initial + '"'
               + ' data-color="' + color + '"'
               + ' data-photo="' + photo.replace(/"/g, '&quot;') + '"'
               + ' data-rating="' + review.starRating + '"'
               + ' data-comment="' + comment.replace(/"/g, '&quot;').replace(/\n/g, '&#10;') + '"'
               + ' data-date="' + (showDate && review.googleCreatedAt ? formatDate(review.googleCreatedAt) : '') + '"'
               + ' data-modal="' + modalId + '"'
               + ' onclick="lrrOpenModal(this)">Read more</a>';
          }
          h += '</div>';
        }

        h += '</div>';
        return h;
      }

      // ── Widget wrapper ──────────────────────────────────────────────────
      var html = '<div id="' + widgetId + '" style="font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;'
               + 'background:' + bgWrap + ';border-radius:20px;padding:28px;max-width:100%;box-sizing:border-box;">';

      // Header
      if (data.location) {
        var avg   = (data.location.averageRating || 0).toFixed(1);
        var total = data.location.totalReviews || 0;
        html += '<div style="text-align:center;margin-bottom:20px;">';
        html += '<div style="display:inline-flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:6px;">';
        html += '<span style="font-size:clamp(20px,4vw,32px);font-weight:700;color:' + colText + ';">Overall Rating</span>';
        html += '<span style="font-size:clamp(20px,4vw,32px);font-weight:700;color:' + colText + ';">' + avg + '</span>';
        html += '<span style="color:#F4B400;font-size:clamp(20px,4vw,32px);line-height:1;">&#9733;</span>';
        html += '<span style="font-size:clamp(13px,2vw,16px);color:' + colSub + ';">| ' + total + ' reviews</span>';
        html += '</div>';
        html += '</div>';
      }

      var totalPages = Math.ceil(reviews.length / PER_PAGE);

      // Carousel
      if (layout === 'carousel') {
        html += '<div style="display:flex;align-items:center;gap:10px;">';
        html += '<button id="' + widgetId + '-prev" style="flex-shrink:0;width:36px;height:36px;border-radius:50%;border:1px solid '
              + colBorder + ';background:' + colArrowBg + ';color:' + colArrow + ';font-size:20px;cursor:pointer;'
              + 'display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,0.1);">&#8249;</button>';
        html += '<div id="' + widgetId + '-track" style="flex:1;display:grid;grid-template-columns:repeat(3,1fr);gap:12px;">';
        var first = reviews.slice(0, PER_PAGE);
        for (var i = 0; i < first.length; i++) { html += buildCard(first[i]); }
        html += '</div>';
        // Will be corrected after mount by getColsForWidth()
        html += '<button id="' + widgetId + '-next" style="flex-shrink:0;width:36px;height:36px;border-radius:50%;border:1px solid '
              + colBorder + ';background:' + colArrowBg + ';color:' + colArrow + ';font-size:20px;cursor:pointer;'
              + 'display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,0.1);">&#8250;</button>';
        html += '</div>';
        if (totalPages > 1) {
          html += '<div id="' + widgetId + '-dots" style="display:flex;justify-content:center;gap:8px;margin-top:16px;">';
          for (var p = 0; p < totalPages; p++) {
            html += '<button style="width:' + (p === 0 ? '24px' : '8px') + ';height:8px;border-radius:4px;border:none;cursor:pointer;padding:0;'
                  + 'background:' + (p === 0 ? dotOn : dotOff) + ';transition:all 0.3s;"></button>';
          }
          html += '</div>';
        }
      } else if (layout === 'grid') {
        html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px;">';
        for (var gi = 0; gi < reviews.length; gi++) { html += buildCard(reviews[gi]); }
        html += '</div>';
      } else {
        html += '<div style="display:flex;flex-direction:column;gap:12px;">';
        for (var li = 0; li < reviews.length; li++) { html += buildCard(reviews[li]); }
        html += '</div>';
      }

      // Powered-by footer
      html += '<div style="text-align:center;margin-top:16px;">';
      html += '<a href="https://localreviewresponder.com" target="_blank" rel="noopener noreferrer" '
            + 'style="font-size:10px;font-variant:small-caps;letter-spacing:0.5px;color:' + colSub + ';text-decoration:none;opacity:0.7;">'
            + 'powered by Local Review Responder LLC</a>';
      html += '</div>';
      html += '</div>'; // end widget wrapper

      container.innerHTML = html;

      // ── Modal (injected into body) ──────────────────────────────────────
      var modalDiv = document.createElement('div');
      modalDiv.id = modalId;
      modalDiv.style.cssText = 'display:none;position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.5);'
        + 'backdrop-filter:blur(4px);align-items:center;justify-content:center;padding:16px;';
      modalDiv.innerHTML = '<div id="' + modalId + '-inner" style="background:' + bgCard + ';border-radius:16px;padding:28px;'
        + 'max-width:500px;width:100%;max-height:80vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,0.3);position:relative;">'
        + '<button id="' + modalId + '-close" style="position:absolute;top:12px;right:12px;background:' + (isDark ? '#374151' : '#f3f4f6') + ';'
        + 'border:none;border-radius:50%;width:30px;height:30px;cursor:pointer;font-size:15px;color:' + colSub
        + ';display:flex;align-items:center;justify-content:center;">&#10005;</button>'
        + '<div id="' + modalId + '-avatar" style="display:flex;align-items:center;gap:14px;margin-bottom:16px;"></div>'
        + '<p id="' + modalId + '-text" style="color:' + colText + ';font-size:14px;line-height:1.7;margin:0;white-space:pre-wrap;"></p>'
        + '<div id="' + modalId + '-date" style="color:' + colSub + ';font-size:12px;margin-top:12px;"></div>'
        + '</div>';
      document.body.appendChild(modalDiv);

      // Close handlers
      document.getElementById(modalId + '-close').addEventListener('click', function () {
        document.getElementById(modalId).style.display = 'none';
      });
      modalDiv.addEventListener('click', function (e) {
        if (e.target === modalDiv) modalDiv.style.display = 'none';
      });

      // Global open function — reads data attributes to avoid inline quote issues
      window.lrrOpenModal = function (el) {
        var name    = el.getAttribute('data-name');
        var initial = el.getAttribute('data-initial');
        var color   = el.getAttribute('data-color');
        var photo   = el.getAttribute('data-photo');
        var rating  = parseInt(el.getAttribute('data-rating'), 10);
        var comment = el.getAttribute('data-comment').replace(/&#10;/g, '\n');
        var date    = el.getAttribute('data-date');
        var mid     = el.getAttribute('data-modal');

        var avatarHtml = photo
          ? '<img src="' + photo + '" style="width:48px;height:48px;border-radius:50%;object-fit:cover;flex-shrink:0;" />'
          : '<div style="display:flex;width:48px;height:48px;border-radius:50%;background:' + color
            + ';align-items:center;justify-content:center;flex-shrink:0;color:#fff;font-size:20px;font-weight:600;">' + initial + '</div>';
        avatarHtml += '<div><div style="font-weight:600;font-size:16px;color:' + colText + ';">' + name + '</div>'
          + '<div style="display:flex;align-items:center;gap:6px;margin-top:4px;">' + renderStars(rating, 18) + googleGIcon + '</div></div>';

        document.getElementById(mid + '-avatar').innerHTML = avatarHtml;
        document.getElementById(mid + '-text').textContent = comment;
        document.getElementById(mid + '-date').textContent = date;
        document.getElementById(mid).style.display = 'flex';
      };

      // ── Carousel controller ─────────────────────────────────────────────
      if (layout === 'carousel') {
        var widgetEl = document.getElementById(widgetId);
        var track    = document.getElementById(widgetId + '-track');
        var dotsEl   = document.getElementById(widgetId + '-dots');

        function getColsForWidth() {
          var w = widgetEl.offsetWidth;
          if (w >= 700) return 3;
          if (w >= 440) return 2;
          return 1;
        }

        function renderPage(page) {
          var cols = getColsForWidth();
          var pageReviews = reviews.slice(page * cols, page * cols + cols);
          var h = '';
          for (var ri = 0; ri < pageReviews.length; ri++) { h += buildCard(pageReviews[ri]); }
          track.innerHTML = h;
          track.style.gridTemplateColumns = 'repeat(' + cols + ',1fr)';
        }

        function getTotalPages() {
          return Math.max(1, Math.ceil(reviews.length / getColsForWidth()));
        }

        function updateDots() {
          if (!dotsEl) return;
          var tp = getTotalPages();
          // Rebuild dots if count changed
          if (dotsEl.children.length !== tp) {
            dotsEl.innerHTML = '';
            for (var di2 = 0; di2 < tp; di2++) {
              var db = document.createElement('button');
              db.style.cssText = 'height:8px;border-radius:4px;border:none;cursor:pointer;padding:0;transition:all 0.3s;';
              dotsEl.appendChild(db);
            }
          }
          var dots = dotsEl.children;
          for (var d = 0; d < dots.length; d++) {
            dots[d].style.background = d === currentPage ? dotOn : dotOff;
            dots[d].style.width      = d === currentPage ? '24px' : '8px';
          }
        }

        function goTo(page) {
          var tp = getTotalPages();
          currentPage = Math.max(0, Math.min(page, tp - 1));
          renderPage(currentPage);
          updateDots();
        }
        function next() {
          var tp = getTotalPages();
          currentPage = currentPage >= tp - 1 ? 0 : currentPage + 1;
          renderPage(currentPage);
          updateDots();
        }
        function prev() {
          var tp = getTotalPages();
          currentPage = currentPage <= 0 ? tp - 1 : currentPage - 1;
          renderPage(currentPage);
          updateDots();
        }

        document.getElementById(widgetId + '-next').addEventListener('click', next);
        document.getElementById(widgetId + '-prev').addEventListener('click', prev);

        if (dotsEl) {
          (function () {
            var dotBtns = dotsEl.children;
            for (var di = 0; di < dotBtns.length; di++) {
              (function (idx) { dotBtns[idx].addEventListener('click', function () { goTo(idx); }); })(di);
            }
          })();
        }

        function startAuto() { stopAuto(); autoTimer = setInterval(next, 5000); }
        function stopAuto()  { if (autoTimer) { clearInterval(autoTimer); autoTimer = null; } }

        widgetEl.addEventListener('mouseenter', stopAuto);
        widgetEl.addEventListener('mouseleave', startAuto);

        // Resize handler — recalculate cols and re-render
        var resizeTimer;
        window.addEventListener('resize', function() {
          clearTimeout(resizeTimer);
          resizeTimer = setTimeout(function() {
            renderPage(currentPage);
            updateDots();
          }, 150);
        });

        // Initial responsive render after DOM is ready
        renderPage(0);
        updateDots();
        startAuto();
      }
    })
    .catch(function (err) { console.error('LRR Widget Error:', err); });
})();

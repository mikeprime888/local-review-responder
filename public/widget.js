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

  // HTML-escape review-derived values at innerHTML render boundaries.
  // & must be replaced first to avoid double-encoding.
  function escapeHtml(s){
    return String(s)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;')
      .replace(/'/g,'&#39;');
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

  // Pick a readable text color for a given hex background using WCAG relative luminance.
  // Returns near-black on light backgrounds, near-white on dark.
  function readableOn(hex){var c=hex.replace('#','');if(c.length===3){c=c[0]+c[0]+c[1]+c[1]+c[2]+c[2];}var r=parseInt(c.substr(0,2),16)/255,g=parseInt(c.substr(2,2),16)/255,b=parseInt(c.substr(4,2),16)/255;function L(x){return x<=0.03928?x/12.92:Math.pow((x+0.055)/1.055,2.4);}var lum=0.2126*L(r)+0.7152*L(g)+0.0722*L(b);return lum>0.5?'#1f2937':'#f3f4f6';}

  // Keep a link legible AS a color on a given background: use the accent if it
  // has >=3:1 WCAG contrast on bg, else fall back to a safe link blue. Used for
  // the "Read more" link, which sits on the white card (not on the accent).
  function linkColorOn(accentHex, bgHex){
    function lum(hex){var c=hex.replace('#','');if(c.length===3){c=c[0]+c[0]+c[1]+c[1]+c[2]+c[2];}var r=parseInt(c.substr(0,2),16)/255,g=parseInt(c.substr(2,2),16)/255,b=parseInt(c.substr(4,2),16)/255;function L(x){return x<=0.03928?x/12.92:Math.pow((x+0.055)/1.055,2.4);}return 0.2126*L(r)+0.7152*L(g)+0.0722*L(b);}
    function ratio(a,b){var la=lum(a),lb=lum(b);var hi=Math.max(la,lb),lo=Math.min(la,lb);return (hi+0.05)/(lo+0.05);}
    return ratio(accentHex,bgHex) >= 3 ? accentHex : '#1a73e8';
  }

  fetch(origin + '/api/widget/' + locationId)
    .then(function (res) { return res.json(); })
    .then(function (data) {
      if (!data.reviews || data.reviews.length === 0) return;

      var cfg                = data.settings || {};
      var theme              = cfg.theme      || 'light';
      var accent             = cfg.accentColor || '#4285F4';
      var layout             = cfg.layout     || 'carousel';
      var showName           = cfg.showName   !== false;
      var showDate           = cfg.showDate   !== false;
      var showHeaderBar      = cfg.showHeaderBar      !== false;
      var showWriteBtn       = cfg.showWriteReviewButton !== false;
      var newReviewUri       = (data.location && data.location.newReviewUri) || '';

      var isDark      = theme === 'dark';
      var bgWrap      = cfg.backgroundColor || (isDark ? '#1a1a2e' : '#EBF2FA');
      var headerText  = readableOn(bgWrap);
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

        var h = '<div style="background:' + bgCard + ';border:1px solid ' + colBorder + ';border-radius:16px;padding:20px;'
              + 'box-sizing:border-box;display:flex;flex-direction:column;gap:8px;min-width:0;height:100%;">';

        // Avatar + name + stars row
        h += '<div style="display:flex;align-items:center;gap:10px;">';
        if (photo) {
          h += '<img src="' + escapeHtml(photo) + '" alt="" style="width:40px;height:40px;border-radius:50%;object-fit:cover;flex-shrink:0;"'
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
          h += '<div style="font-size:18px;font-weight:600;color:' + colText + ';white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1;min-width:0;">' + escapeHtml(name) + '</div>';
          h += googleGIcon;
          h += '</div>';
        }
        h += '<div style="display:flex;align-items:center;gap:2px;margin-top:3px;">' + renderStars(review.starRating, 18) + '</div>';
        h += '</div></div>';

        // Date
        if (showDate && review.googleCreatedAt) {
          h += '<div style="font-size:13px;color:' + colSub + ';">' + formatDate(review.googleCreatedAt) + '</div>';
        }

        // Comment (full text, visually clamped to 5 lines) + Read more sibling.
        // The "Read more" link is a SIBLING after the clamp box — anything
        // placed INSIDE a -webkit-line-clamp box gets clamped away. It is
        // always emitted but hidden; checkOverflow() reveals it only when the
        // text actually overflows the clamp (measured layout, not char count),
        // so the visual truncation and the link can never disagree.
        if (comment) {
          h += '<div class="lrr-cmt" id="lrr-cmt-' + review.id + '"'
             + ' style="font-size:15px;line-height:1.6;color:' + colText + ';flex:1;overflow:hidden;display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;">'
             + escapeHtml(comment) + '</div>';
          // Read more — sibling below the clamp, hidden until overflow measured.
          // Modal plumbing (data-* attributes + onclick) unchanged.
          h += '<a href="javascript:void(0)" class="lrr-rm" id="lrr-rm-' + review.id + '"'
             + ' style="display:none;color:' + linkColorOn(accent, '#ffffff') + ';font-size:16px;font-weight:500;text-decoration:none;"'
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
        return h;
      }

      // ── Overflow-driven "Read more" ─────────────────────────────────────
      // Reveal each card's "Read more" link only when its comment actually
      // overflows the line-clamp. We compare the comment's TRUE content height
      // against the CLAMP height (clamp lines × line-height) — NOT the element's
      // clientHeight. The card stretches .lrr-cmt via flex:1, so clientHeight can
      // exceed the clamp and a 1-line overflow would read as "fits" (and, for a
      // short comment, the stretched scrollHeight would read as "overflows").
      // To get the real content height we briefly neutralize that flex stretch,
      // read scrollHeight, then restore it — no paint happens in between.
      function checkOverflow(root) {
        if (!root) return;
        var cmts = root.querySelectorAll('.lrr-cmt');
        for (var i = 0; i < cmts.length; i++) {
          var el = cmts[i];
          var link = document.getElementById('lrr-rm-' + el.id.replace('lrr-cmt-', ''));
          if (!link) continue;
          var cs = getComputedStyle(el);
          var lineH = parseFloat(cs.lineHeight) || (parseFloat(cs.fontSize) * 1.6) || 24;
          var clampN = parseInt(cs.webkitLineClamp, 10) || 4;
          var clampH = lineH * clampN;
          var prevFlex = el.style.flex;
          el.style.flex = '0 0 auto';        // collapse the flex:1 stretch
          var contentH = el.scrollHeight;    // true (clamped-box) content height
          el.style.flex = prevFlex;          // restore before any paint
          link.style.display = (contentH > clampH + lineH * 0.5) ? '' : 'none';
        }
      }

      // Run checkOverflow once the root's cards have real, settled dimensions —
      // and again whenever they change — via ResizeObserver. Replaces a single
      // requestAnimationFrame(checkOverflow), which could sample before layout
      // settled: an early zero-height reading was skipped and never retried, so
      // overflowing cards never got their link. Measures EVERY card under root,
      // including off-screen carousel panels (laid out under translateX, so
      // measurable). Double-rAF fallback where ResizeObserver is unavailable.
      function observeOverflow(root) {
        if (!root) return null;
        checkOverflow(root); // best-effort immediate pass
        if (typeof ResizeObserver !== 'undefined') {
          var pending = false;
          var ro = new ResizeObserver(function () {
            if (pending) return;
            pending = true;
            requestAnimationFrame(function () { pending = false; checkOverflow(root); });
          });
          var cmts = root.querySelectorAll('.lrr-cmt');
          for (var i = 0; i < cmts.length; i++) ro.observe(cmts[i]);
          return ro;
        }
        requestAnimationFrame(function () {
          requestAnimationFrame(function () { checkOverflow(root); });
        });
        return null;
      }

      // ── Widget wrapper ──────────────────────────────────────────────────
      var html = '<div id="' + widgetId + '" style="font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;'
               + '-webkit-text-size-adjust:100%;text-size-adjust:100%;'
               + 'background:' + bgWrap + ';border-radius:20px;padding:28px;padding-top:43px;max-width:100%;box-sizing:border-box;">';

      // Header (overall rating + optional inline Write a review button)
      if (showHeaderBar && data.location) {
        var avg   = (data.location.averageRating || 0).toFixed(1);
        var total = data.location.totalReviews || 0;
        html += '<div style="margin-bottom:18px;display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:18px;">';
        // Rating heading — kept as one cohesive group
        html += '<div style="display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:8px;text-align:center;line-height:1.2;">';
        html += '<span style="font-size:30px;font-weight:500;color:' + headerText + ';">Overall rating</span>';
        html += '<span style="font-size:30px;font-weight:700;color:' + headerText + ';">' + avg + '</span>';
        html += '<span style="color:#F4B400;font-size:30px;line-height:1;">&#9733;</span>';
        html += '<span style="font-size:30px;font-weight:500;color:' + headerText + ';">based on</span>';
        html += '<span style="font-size:30px;font-weight:700;color:' + headerText + ';">' + total + '</span>';
        html += '<span style="font-size:30px;font-weight:500;color:' + headerText + ';">reviews</span>';
        html += '</div>';
        // Write a review button — inline beside the heading (wraps below on narrow widths)
        if (showWriteBtn && newReviewUri) {
          html += '<a href="' + newReviewUri + '" target="_blank" rel="noopener" '
                + 'style="background:' + accent + ';color:' + readableOn(accent) + ';text-decoration:none;font-size:15px;font-weight:600;'
                + 'padding:10px 22px;border-radius:8px;display:inline-block;white-space:nowrap;">Write a review</a>';
        }
        html += '</div>';
      }

      var totalPages = Math.ceil(reviews.length / PER_PAGE);

      // Carousel
      if (layout === 'carousel') {
        html += '<div style="display:flex;align-items:center;gap:10px;">';
        html += '<button id="' + widgetId + '-prev" style="flex-shrink:0;width:36px;height:36px;border-radius:50%;border:1px solid '
              + colBorder + ';background:' + colArrowBg + ';color:' + colArrow + ';font-size:20px;cursor:pointer;'
              + 'display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,0.1);">&#8249;</button>';
        html += '<div id="' + widgetId + '-track" style="flex:1;overflow:hidden;">';
        html += '<div id="' + widgetId + '-rail" style="display:flex;width:100%;height:100%;align-items:stretch;">';
        html += '<div style="flex:0 0 100%;display:grid;grid-template-columns:repeat(3,1fr);gap:12px;align-items:stretch;">';
        var first = reviews.slice(0, PER_PAGE);
        for (var i = 0; i < first.length; i++) { html += buildCard(first[i]); }
        html += '</div>';
        html += '</div>';
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

      // Powered-by footer — inside the wrapper. Uses headerText so it
      // contrasts against the configurable wrapper background.
      html += '<div style="text-align:center;margin-top:18px;">';
      html += '<a href="https://localreviewresponder.com" target="_blank" rel="noopener noreferrer" '
            + 'style="font-size:10px;font-variant:small-caps;letter-spacing:0.5px;color:' + headerText + ';text-decoration:none;opacity:0.7;">'
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
          ? '<img src="' + escapeHtml(photo) + '" style="width:48px;height:48px;border-radius:50%;object-fit:cover;flex-shrink:0;" />'
          : '<div style="display:flex;width:48px;height:48px;border-radius:50%;background:' + color
            + ';align-items:center;justify-content:center;flex-shrink:0;color:#fff;font-size:20px;font-weight:600;">' + initial + '</div>';
        avatarHtml += '<div><div style="font-weight:600;font-size:16px;color:' + colText + ';">' + escapeHtml(name) + '</div>'
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
        var rail     = document.getElementById(widgetId + '-rail');
        var dotsEl   = document.getElementById(widgetId + '-dots');
        var overflowRO = null;

        function getColsForWidth() {
          var w = widgetEl.offsetWidth;
          if (w >= 700) return 3;
          if (w >= 440) return 2;
          return 1;
        }

        // Build all pages side-by-side as 100%-width panels in the rail, for the
        // current responsive column count. Each panel is exactly one viewport
        // wide (flex:0 0 100%), so the rail (width:100%) overflows horizontally
        // and is clipped by the track (overflow:hidden); translateX then slides
        // whole pages into view.
        function buildRail() {
          var cols = getColsForWidth();
          var tp   = Math.max(1, Math.ceil(reviews.length / cols));
          var h = '';
          for (var pg = 0; pg < tp; pg++) {
            var pageReviews = reviews.slice(pg * cols, pg * cols + cols);
            h += '<div style="flex:0 0 100%;display:grid;grid-template-columns:repeat(' + cols + ',1fr);gap:12px;align-items:stretch;">';
            for (var ri = 0; ri < pageReviews.length; ri++) { h += buildCard(pageReviews[ri]); }
            h += '</div>';
          }
          rail.innerHTML = h;
          // Mobile (cols:1) is swipe-only: hide the prev/next arrows. They are
          // flex-shrink:0 flex siblings, so display:none removes them from layout
          // and drops their gaps, reclaiming the full ~92px so the track widens.
          var arrowDisp = cols === 1 ? 'none' : 'flex';
          var prevBtn = document.getElementById(widgetId + '-prev');
          var nextBtn = document.getElementById(widgetId + '-next');
          if (prevBtn) prevBtn.style.display = arrowDisp;
          if (nextBtn) nextBtn.style.display = arrowDisp;
          // On mobile (cols:1) trim the wrapper's side padding so the now
          // full-width card gets more room (comfortable margin, not a narrow
          // column). Desktop keeps the default 28px. Top/bottom unchanged.
          var sidePad = cols === 1 ? '16px' : '28px';
          widgetEl.style.paddingLeft = sidePad;
          widgetEl.style.paddingRight = sidePad;
          // Lock track height so the widget doesn't jump between pages. Kept
          // fixed deliberately (no content-fit) so swiping never changes height.
          // Mobile value lowered to shrink the empty void on short/null cards.
          var cardH = cols === 1 ? 255 : 260;
          track.style.height = cardH + 'px';
          // Reveal "Read more" for cards that overflow. ResizeObserver fires once
          // these freshly built cards have settled dimensions (and again on any
          // later change), measuring every panel — no single-frame race.
          if (overflowRO) overflowRO.disconnect();
          overflowRO = observeOverflow(track);
        }

        // Position the rail at currentPage. animate=true → user-driven (prev/next/
        // dot) slides with a transition; animate=false → initial render / resize
        // rebuild jumps with the transition suppressed (disable, set, force reflow,
        // re-enable) so a layout rebuild never animates.
        function setPage(animate) {
          if (animate) {
            rail.style.transition = 'transform 0.75s ease';
            rail.style.transform  = 'translateX(-' + (currentPage * 100) + '%)';
          } else {
            rail.style.transition = 'none';
            rail.style.transform  = 'translateX(-' + (currentPage * 100) + '%)';
            rail.getBoundingClientRect(); // force reflow so the jump commits
            rail.style.transition = 'transform 0.75s ease';
          }
        }

        function clampPage() {
          var tp = getTotalPages();
          currentPage = Math.max(0, Math.min(currentPage, tp - 1));
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
          setPage(true);
          updateDots();
        }
        function next() {
          var tp = getTotalPages();
          // Wrapping last->first: snap instantly (setPage(false)) so the viewer
          // doesn't see the rail "fly back" across every page. Normal one-step
          // advances still animate.
          var wrap = currentPage >= tp - 1;
          currentPage = wrap ? 0 : currentPage + 1;
          setPage(!wrap);
          updateDots();
        }
        function prev() {
          var tp = getTotalPages();
          var wrap = currentPage <= 0;          // first->last wraps; snap, don't fly
          currentPage = wrap ? tp - 1 : currentPage - 1;
          setPage(!wrap);
          updateDots();
        }

        document.getElementById(widgetId + '-next').addEventListener('click', next);
        document.getElementById(widgetId + '-prev').addEventListener('click', prev);

        // Touch swipe navigation — mobile hides the arrows, so swiping is the
        // primary way to move between reviews. We decide DURING touchmove, the
        // moment a horizontal drag crosses the threshold, rather than waiting for
        // touchend: mobile browsers fire touchcancel (not touchend) as soon as
        // they claim the gesture for scrolling, so a touchend-only handler drops
        // most real swipes. A `fired` latch keeps one swipe per gesture. The
        // direction test is just "horizontal-dominant" (real thumb swipes arc,
        // so a strict ratio rejected them). Passive listeners never block scroll;
        // a vertical-dominant drag falls through to normal page scrolling.
        (function () {
          var sx = 0, sy = 0, active = false, fired = false;
          function start(e) {
            if (!e.touches || e.touches.length !== 1) return;
            sx = e.touches[0].clientX; sy = e.touches[0].clientY;
            active = true; fired = false;
            stopAuto();
          }
          function move(e) {
            if (!active || fired || !e.touches || !e.touches.length) return;
            var dx = e.touches[0].clientX - sx;
            var dy = e.touches[0].clientY - sy;
            if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
              fired = true;                     // act once, on threshold cross
              if (dx < 0) next(); else prev();
            }
          }
          function end() { active = false; startAuto(); }
          track.addEventListener('touchstart',  start, { passive: true });
          track.addEventListener('touchmove',   move,  { passive: true });
          track.addEventListener('touchend',    end,   { passive: true });
          track.addEventListener('touchcancel', end,   { passive: true });
        })();

        if (dotsEl) {
          (function () {
            var dotBtns = dotsEl.children;
            for (var di = 0; di < dotBtns.length; di++) {
              (function (idx) { dotBtns[idx].addEventListener('click', function () { goTo(idx); }); })(di);
            }
          })();
        }

        function startAuto() { stopAuto(); autoTimer = setInterval(next, 7500); }
        function stopAuto()  { if (autoTimer) { clearInterval(autoTimer); autoTimer = null; } }

        widgetEl.addEventListener('mouseenter', stopAuto);
        widgetEl.addEventListener('mouseleave', startAuto);

        // Resize handler — recalculate cols, rebuild the rail for the new page
        // count, clamp currentPage into range, and reposition without animating.
        var resizeTimer;
        window.addEventListener('resize', function() {
          clearTimeout(resizeTimer);
          resizeTimer = setTimeout(function() {
            buildRail();
            clampPage();
            setPage(false);
            updateDots();
          }, 150);
        });

        // Initial responsive render after DOM is ready (no slide animation)
        buildRail();
        currentPage = 0;
        setPage(false);
        updateDots();
        startAuto();
      } else {
        // Grid/list render every card at once and have no carousel controller.
        // ResizeObserver measures each card once it has settled dimensions and
        // re-checks on width changes (which alter line count), so no separate
        // resize listener or single-frame rAF is needed.
        observeOverflow(document.getElementById(widgetId));
      }
    })
    .catch(function (err) { console.error('LRR Widget Error:', err); });
})();

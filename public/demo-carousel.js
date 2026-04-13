/**
 * Local Review Responder — Demo Carousel
 * Paste this into your marketing site where you want the carousel to appear:
 *
 * <div id="lrr-demo-carousel"></div>
 * <script src="https://app.localreviewresponder.com/demo-carousel.js" async></script>
 */
(function () {
  var container = document.getElementById('lrr-demo-carousel');
  if (!container) return;

  var reviews = [
    {
      business: 'Sunrise Dental Studio',
      reviewer: 'Amanda Chen',
      rating: 5,
      avatarBg: '#E1F5EE',
      avatarText: '#085041',
      meta: '2 days ago',
      review: "Absolutely love this place! Dr. Patel was so gentle and took the time to explain everything. I\u2019ve always been nervous about the dentist, but the whole team made me feel completely at ease. My teeth have never looked better!"
    },
    {
      business: 'Peak Performance Gym',
      reviewer: 'Marcus Williams',
      rating: 4,
      avatarBg: '#E6F1FB',
      avatarText: '#0C447C',
      meta: '1 week ago',
      review: "Great gym with tons of equipment and friendly staff. The locker rooms could use an upgrade and it gets pretty crowded during peak hours, but overall a solid place to train. The personal trainers are very knowledgeable."
    },
    {
      business: 'The Golden Fork Restaurant',
      reviewer: 'Priya Sharma',
      rating: 5,
      avatarBg: '#FAEEDA',
      avatarText: '#633806',
      meta: '3 days ago',
      review: "Took my parents here for their anniversary and it was absolutely perfect. The lamb shank was melt-in-your-mouth incredible, and our server Jenna went above and beyond all evening. The atmosphere is warm and romantic. Already planning our next visit!"
    },
    {
      business: 'Greenleaf Landscaping',
      reviewer: 'Tom & Beth Kowalski',
      rating: 3,
      avatarBg: '#EAF3DE',
      avatarText: '#27500A',
      meta: '2 weeks ago',
      review: "Mixed experience. The team did a beautiful job with our garden beds but showed up an hour late without calling. The finished result looks great, but communication needs improvement. Would probably try again if that\u2019s addressed."
    },
    {
      business: 'BlueSky Auto Repair',
      reviewer: 'Jordan Lee',
      rating: 5,
      avatarBg: '#EEEDFE',
      avatarText: '#3C3489',
      meta: '5 days ago',
      review: "These guys saved me when my car broke down on a Friday afternoon. They fit me in last-minute, diagnosed the issue within an hour, and had me back on the road before they closed. Fair pricing, no upsell nonsense. This is my shop now."
    },
    {
      business: 'Bright Minds Tutoring',
      reviewer: 'Sandra Okafor',
      rating: 5,
      avatarBg: '#FBEAF0',
      avatarText: '#72243E',
      meta: '1 day ago',
      review: "My son was really struggling with algebra and after just 6 weeks with his tutor, he went from a D to a B+. The tutors are patient, encouraging, and actually make math fun. I wish we had found this place sooner!"
    },
    {
      business: 'Harbor View Hotel',
      reviewer: 'Derek & Lisa Fontaine',
      rating: 5,
      avatarBg: '#E1F5EE',
      avatarText: '#085041',
      meta: '3 weeks ago',
      review: "We stayed for our 10th anniversary and it exceeded every expectation. The room was immaculate, the harbor view was stunning at sunrise, and the front desk staff upgraded us without us even asking. The breakfast spread was incredible. We will absolutely be back."
    },
    {
      business: 'ClearSkin Dermatology',
      reviewer: 'Olivia Marsh',
      rating: 4,
      avatarBg: '#E6F1FB',
      avatarText: '#0C447C',
      meta: '4 days ago',
      review: "Dr. Nguyen is fantastic and really listened to my concerns about my skin. The treatment plan she recommended has made a noticeable difference in just a few weeks. The only downside is the wait time \u2014 I was in the waiting room for nearly 40 minutes past my appointment. Would still recommend."
    },
    {
      business: 'Iron & Oak Furniture Co.',
      reviewer: 'Paul Strickland',
      rating: 5,
      avatarBg: '#FAEEDA',
      avatarText: '#633806',
      meta: '10 days ago',
      review: "Ordered a custom dining table and it arrived exactly on time and exactly as described. The craftsmanship is outstanding \u2014 this is clearly built to last decades. The team kept me updated throughout the build process which I really appreciated. Worth every penny."
    },
    {
      business: 'SwiftMove Removals',
      reviewer: 'Fatima Al-Hassan',
      rating: 3,
      avatarBg: '#EAF3DE',
      avatarText: '#27500A',
      meta: '2 weeks ago',
      review: "The movers were friendly and careful with our belongings, which I really appreciated. However, the job took almost two hours longer than quoted, which pushed the cost up significantly. A more accurate time estimate upfront would have made a big difference to our experience."
    },
    {
      business: 'Paws & Claws Veterinary Clinic',
      reviewer: 'Ryan Holloway',
      rating: 5,
      avatarBg: '#EEEDFE',
      avatarText: '#3C3489',
      meta: '6 days ago',
      review: "I brought in my rescue dog Biscuit for the first time and he was absolutely terrified. The vet and nurses were so calm and gentle with him that by the end he was actually wagging his tail. They took the time to explain everything clearly and the pricing was very transparent. This is Biscuit\u2019s clinic for life."
    },
    {
      business: 'Summit Financial Planning',
      reviewer: 'Karen & David Osei',
      rating: 5,
      avatarBg: '#FBEAF0',
      avatarText: '#72243E',
      meta: '3 weeks ago',
      review: "We\u2019d been putting off getting serious about retirement planning for years and finally took the leap with Summit. Our advisor Michael broke everything down in plain language with zero jargon. We left our first meeting with an actual plan for the first time ever. Genuinely life-changing."
    }
  ];

  var currentPage = 0;
  var autoTimer = null;
  var isTransitioning = false;
  var CARDS_PER_PAGE = 3;

  function getTotalPages() {
    return Math.ceil(reviews.length / CARDS_PER_PAGE);
  }

  function getInitials(name) {
    var parts = name.split(' ');
    if (parts.length >= 2) return parts[0].charAt(0).toUpperCase() + parts[parts.length - 1].charAt(0).toUpperCase();
    return name.charAt(0).toUpperCase();
  }

  function renderStars(rating) {
    var html = '';
    for (var i = 0; i < 5; i++) {
      html += '<span style="color:' + (i < rating ? '#F0A500' : '#d1d5db') + ';font-size:16px;line-height:1;">' + (i < rating ? '\u2605' : '\u2606') + '</span>';
    }
    return html;
  }

  function buildCard(review) {
    var initials = getInitials(review.reviewer);

    return ''
      + '<div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;padding:20px;box-shadow:0 1px 3px rgba(0,0,0,0.06),0 1px 2px rgba(0,0,0,0.04);display:flex;flex-direction:column;min-width:0;box-sizing:border-box;">'

      // Business badge
      + '<div style="margin-bottom:12px;">'
      + '<span style="display:inline-flex;align-items:center;gap:6px;background:#f3f4f6;border-radius:999px;padding:4px 10px;">'
      + '<span style="font-size:12px;line-height:1;">\u2302</span>'
      + '<span style="font-size:11px;color:#6b7280;">' + review.business + '</span>'
      + '</span>'
      + '</div>'

      // Reviewer row
      + '<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">'
      + '<div style="width:38px;height:38px;border-radius:50%;background:' + review.avatarBg + ';display:flex;align-items:center;justify-content:center;flex-shrink:0;">'
      + '<span style="font-size:13px;font-weight:600;color:' + review.avatarText + ';">' + initials + '</span>'
      + '</div>'
      + '<div style="min-width:0;">'
      + '<div style="font-size:14px;font-weight:500;color:#1f2937;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + review.reviewer + '</div>'
      + '<div style="display:flex;align-items:center;gap:4px;margin-top:2px;">'
      + renderStars(review.rating)
      + '<span style="font-size:12px;color:#9ca3af;margin-left:4px;">' + review.meta + '</span>'
      + '</div>'
      + '</div>'
      + '</div>'

      // Review text
      + '<div style="font-size:13px;line-height:1.6;color:#374151;border-left:2px solid #e5e7eb;padding-left:10px;flex:1;display:-webkit-box;-webkit-line-clamp:5;-webkit-box-orient:vertical;overflow:hidden;">'
      + review.review
      + '</div>'

      + '</div>';
  }

  function buildCards(page) {
    var start = page * CARDS_PER_PAGE;
    var pageReviews = reviews.slice(start, start + CARDS_PER_PAGE);
    var html = '';
    for (var i = 0; i < pageReviews.length; i++) {
      html += buildCard(pageReviews[i]);
    }
    return html;
  }

  function buildDots() {
    var total = getTotalPages();
    var html = '';
    for (var i = 0; i < total; i++) {
      var isActive = i === currentPage;
      html += '<button style="width:' + (isActive ? '24px' : '8px') + ';height:8px;border-radius:4px;border:none;padding:0;cursor:pointer;'
        + 'background:' + (isActive ? '#1D9E75' : '#d1d5db') + ';transition:all 0.3s;"></button>';
    }
    return html;
  }

  function render() {
    var total = getTotalPages();

    var html = ''
      + '<div style="max-width:960px;margin:0 auto;font-family:system-ui,-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;">'

      // Section headings
      + '<div style="text-align:center;margin-bottom:24px;">'
      + '<div style="font-size:13px;text-transform:uppercase;letter-spacing:1.5px;color:#9ca3af;margin-bottom:8px;">See it in action</div>'
      + '<h2 style="font-size:22px;font-weight:500;color:#1f2937;margin:0 0 8px 0;">Real reviews. AI-crafted responses.</h2>'
      + '<p style="font-size:15px;color:#9ca3af;margin:0;line-height:1.5;">Watch how Local Review Responder turns every review into a branded reply &mdash; in seconds.</p>'
      + '</div>'

      // Overall rating banner
      + '<div style="text-align:center;margin-bottom:24px;">'
      + '<div style="display:inline-flex;align-items:center;gap:8px;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;padding:12px 24px;box-shadow:0 1px 3px rgba(0,0,0,0.06);">'
      + '<span style="font-size:20px;font-weight:700;color:#1f2937;">Overall rating</span>'
      + '<span style="font-size:20px;font-weight:700;color:#1f2937;">4.7</span>'
      + '<span style="color:#F0A500;font-size:20px;line-height:1;">\u2605</span>'
      + '<span style="font-size:14px;color:#9ca3af;">based on</span>'
      + '<span style="font-size:20px;font-weight:700;color:#1f2937;">163</span>'
      + '<span style="font-size:14px;color:#9ca3af;">reviews</span>'
      + '</div>'
      + '</div>'

      // Carousel with left/right arrows
      + '<div style="display:flex;align-items:center;gap:12px;">'

      // Left arrow
      + '<button id="lrr-demo-prev" style="width:38px;height:38px;border-radius:50%;border:1px solid #e5e7eb;background:#ffffff;color:#6b7280;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:border-color 0.2s;box-shadow:0 1px 3px rgba(0,0,0,0.06);">\u2039</button>'

      // Slide viewport
      + '<div style="overflow:hidden;border-radius:16px;flex:1;min-width:0;">'
      + '<div id="lrr-demo-slider" style="display:flex;transition:transform 0.8s ease;width:' + (total * 100) + '%;">';

    // Build all pages as flex children
    for (var p = 0; p < total; p++) {
      var start = p * CARDS_PER_PAGE;
      var pageReviews = reviews.slice(start, start + CARDS_PER_PAGE);
      html += '<div style="min-width:' + (100 / total) + '%;display:grid;grid-template-columns:repeat(3,1fr);gap:16px;box-sizing:border-box;">';
      for (var i = 0; i < pageReviews.length; i++) {
        html += buildCard(pageReviews[i]);
      }
      html += '</div>';
    }

    html += '</div>'
      + '</div>'

      // Right arrow
      + '<button id="lrr-demo-next" style="width:38px;height:38px;border-radius:50%;border:1px solid #e5e7eb;background:#ffffff;color:#6b7280;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:border-color 0.2s;box-shadow:0 1px 3px rgba(0,0,0,0.06);">\u203A</button>'

      + '</div>'

      // Dots below
      + '<div id="lrr-demo-dots" style="display:flex;align-items:center;justify-content:center;gap:8px;margin-top:20px;">'
      + buildDots()
      + '</div>'

      // Responsive style
      + '<style>'
      + '@media (max-width: 768px) { #lrr-demo-slider > div { grid-template-columns: 1fr !important; } }'
      + '@media (min-width: 769px) and (max-width: 1024px) { #lrr-demo-slider > div { grid-template-columns: repeat(2, 1fr) !important; } }'
      + '</style>'

      + '</div>';

    container.innerHTML = html;

    // Bind events
    document.getElementById('lrr-demo-prev').addEventListener('click', function () {
      var t = getTotalPages();
      goTo((currentPage - 1 + t) % t);
    });
    document.getElementById('lrr-demo-next').addEventListener('click', function () {
      var t = getTotalPages();
      goTo((currentPage + 1) % t);
    });

    var dotsContainer = document.getElementById('lrr-demo-dots');
    if (dotsContainer) {
      var dots = dotsContainer.children;
      for (var d = 0; d < dots.length; d++) {
        (function (idx) {
          dots[idx].addEventListener('click', function () { goTo(idx); });
        })(d);
      }
    }

    // Pause on hover
    var wrapper = container.firstChild;
    wrapper.addEventListener('mouseenter', stopAuto);
    wrapper.addEventListener('mouseleave', startAuto);
  }

  function slideTo(page) {
    var slider = document.getElementById('lrr-demo-slider');
    if (!slider) return;
    var offset = page * (100 / getTotalPages());
    slider.style.transform = 'translateX(-' + offset + '%)';
  }

  function updateDots() {
    var dotsEl = document.getElementById('lrr-demo-dots');
    if (!dotsEl) return;
    var dots = dotsEl.children;
    for (var i = 0; i < dots.length; i++) {
      dots[i].style.width = i === currentPage ? '24px' : '8px';
      dots[i].style.background = i === currentPage ? '#1D9E75' : '#d1d5db';
    }
  }

  function goTo(page) {
    if (isTransitioning || page === currentPage) return;
    isTransitioning = true;
    currentPage = page;
    slideTo(currentPage);
    updateDots();
    resetAuto();
    setTimeout(function () { isTransitioning = false; }, 800);
  }

  function startAuto() {
    stopAuto();
    autoTimer = setInterval(function () {
      var total = getTotalPages();
      var next = (currentPage + 1) % total;
      goTo(next);
    }, 5000);
  }

  function stopAuto() {
    if (autoTimer) { clearInterval(autoTimer); autoTimer = null; }
  }

  function resetAuto() {
    stopAuto();
    startAuto();
  }

  // Initial render
  render();
  startAuto();
})();

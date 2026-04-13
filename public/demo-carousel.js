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
      review: "Absolutely love this place! Dr. Patel was so gentle and took the time to explain everything. I\u2019ve always been nervous about the dentist, but the whole team made me feel completely at ease. My teeth have never looked better!",
      response: "Thank you so much, Amanda! We\u2019re thrilled to hear your visit went smoothly \u2014 helping patients feel comfortable is what we\u2019re all about. Dr. Patel and the team really appreciate your kind words. We look forward to seeing you at your next visit!"
    },
    {
      business: 'Peak Performance Gym',
      reviewer: 'Marcus Williams',
      rating: 4,
      avatarBg: '#E6F1FB',
      avatarText: '#0C447C',
      review: "Great gym with tons of equipment and friendly staff. The locker rooms could use an upgrade and it gets pretty crowded during peak hours, but overall a solid place to train. The personal trainers are very knowledgeable.",
      response: "Thanks for the honest feedback, Marcus! We\u2019re glad you\u2019re enjoying the equipment and our trainer team. You\u2019re right about the locker rooms \u2014 a renovation is planned for Q2. In the meantime, come in before 7am for a quieter experience. See you on the floor!"
    },
    {
      business: 'The Golden Fork Restaurant',
      reviewer: 'Priya Sharma',
      rating: 5,
      avatarBg: '#FAEEDA',
      avatarText: '#633806',
      review: "Took my parents here for their anniversary and it was absolutely perfect. The lamb shank was melt-in-your-mouth incredible, and our server Jenna went above and beyond all evening. The atmosphere is warm and romantic. Already planning our next visit!",
      response: "What a beautiful way to celebrate! We\u2019re so honored you chose The Golden Fork for such a special occasion, Priya. We\u2019ll make sure Jenna knows she made the evening memorable. The lamb shank is truly one of Chef Marco\u2019s labors of love. We can\u2019t wait to welcome you and your family back soon."
    },
    {
      business: 'Greenleaf Landscaping',
      reviewer: 'Tom & Beth Kowalski',
      rating: 3,
      avatarBg: '#EAF3DE',
      avatarText: '#27500A',
      review: "Mixed experience. The team did a beautiful job with our garden beds but showed up an hour late without calling. The finished result looks great, but communication needs improvement. Would probably try again if that\u2019s addressed.",
      response: "Tom and Beth, thank you for your patience and for sharing this. The garden beds look stunning, but you\u2019re right that punctuality and communication should never be an afterthought. We\u2019re addressing this with our scheduling team and would love the chance to earn your full confidence on your next project."
    },
    {
      business: 'BlueSky Auto Repair',
      reviewer: 'Jordan Lee',
      rating: 5,
      avatarBg: '#EEEDFE',
      avatarText: '#3C3489',
      review: "These guys saved me when my car broke down on a Friday afternoon. They fit me in last-minute, diagnosed the issue within an hour, and had me back on the road before they closed. Fair pricing, no upsell nonsense. This is my shop now.",
      response: "Jordan, we\u2019re so glad we could get you sorted on such short notice! Breakdowns are stressful enough without having to wait days for a fix. Our team takes pride in being straight with customers \u2014 no fluff, just good work at a fair price. Welcome to the BlueSky family!"
    }
  ];

  var currentIndex = 0;
  var autoTimer = null;
  var isTransitioning = false;

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

    var card = ''
      + '<div style="opacity:1;transform:translateY(0);transition:opacity 0.4s ease,transform 0.4s ease;">'

      // Business badge
      + '<div style="margin-bottom:16px;">'
      + '<span style="display:inline-flex;align-items:center;gap:6px;background:#f3f4f6;border-radius:999px;padding:5px 12px;">'
      + '<span style="font-size:13px;line-height:1;">\u2302</span>'
      + '<span style="font-size:12px;color:#6b7280;">' + review.business + '</span>'
      + '</span>'
      + '</div>'

      // Reviewer row
      + '<div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;">'
      + '<div style="width:44px;height:44px;border-radius:50%;background:' + review.avatarBg + ';display:flex;align-items:center;justify-content:center;flex-shrink:0;">'
      + '<span style="font-size:15px;font-weight:600;color:' + review.avatarText + ';">' + initials + '</span>'
      + '</div>'
      + '<div>'
      + '<div style="font-size:15px;font-weight:500;color:#1f2937;">' + review.reviewer + '</div>'
      + '<div style="display:flex;align-items:center;gap:6px;margin-top:2px;">'
      + renderStars(review.rating)
      + '<span style="font-size:13px;color:#9ca3af;margin-left:4px;">3 weeks ago</span>'
      + '</div>'
      + '</div>'
      + '</div>'

      // Review text
      + '<div style="font-size:15px;line-height:1.65;color:#374151;border-left:2px solid #e5e7eb;padding-left:12px;margin-bottom:18px;">'
      + review.review
      + '</div>'

      // AI response box
      + '<div style="background:#f9fafb;border-radius:10px;padding:14px 16px;">'
      + '<div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;">'
      + '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#1D9E75;flex-shrink:0;"></span>'
      + '<span style="font-size:12px;text-transform:uppercase;letter-spacing:0.5px;color:#9ca3af;">AI-generated response</span>'
      + '</div>'
      + '<div style="font-size:14px;line-height:1.6;color:#4b5563;">'
      + review.response
      + '</div>'
      + '</div>'

      + '</div>';

    return card;
  }

  function render() {
    var review = reviews[currentIndex];

    var html = ''
      + '<div style="max-width:680px;margin:0 auto;font-family:system-ui,-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;">'

      // Section headings
      + '<div style="text-align:center;margin-bottom:28px;">'
      + '<div style="font-size:13px;text-transform:uppercase;letter-spacing:1.5px;color:#9ca3af;margin-bottom:8px;">See it in action</div>'
      + '<h2 style="font-size:22px;font-weight:500;color:#1f2937;margin:0 0 8px 0;">Real reviews. AI-crafted responses.</h2>'
      + '<p style="font-size:15px;color:#9ca3af;margin:0;line-height:1.5;">Watch how Local Review Responder turns every review into a branded reply &mdash; in seconds.</p>'
      + '</div>'

      // Card
      + '<div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;padding:24px;box-shadow:0 1px 3px rgba(0,0,0,0.06),0 1px 2px rgba(0,0,0,0.04);">'
      + '<div id="lrr-demo-card">'
      + buildCard(review)
      + '</div>'
      + '</div>'

      // Navigation
      + '<div style="display:flex;align-items:center;justify-content:center;gap:16px;margin-top:20px;">'
      + '<button id="lrr-demo-prev" style="width:38px;height:38px;border-radius:50%;border:1px solid #e5e7eb;background:#ffffff;color:#6b7280;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:border-color 0.2s;">\u2039</button>'
      + '<div id="lrr-demo-dots" style="display:flex;align-items:center;gap:8px;">'
      + buildDots()
      + '</div>'
      + '<button id="lrr-demo-next" style="width:38px;height:38px;border-radius:50%;border:1px solid #e5e7eb;background:#ffffff;color:#6b7280;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:border-color 0.2s;">\u203A</button>'
      + '</div>'

      + '</div>';

    container.innerHTML = html;

    // Bind events
    document.getElementById('lrr-demo-prev').addEventListener('click', function () { goTo((currentIndex - 1 + reviews.length) % reviews.length); });
    document.getElementById('lrr-demo-next').addEventListener('click', function () { goTo((currentIndex + 1) % reviews.length); });

    var dots = document.getElementById('lrr-demo-dots').children;
    for (var i = 0; i < dots.length; i++) {
      (function (idx) {
        dots[idx].addEventListener('click', function () { goTo(idx); });
      })(i);
    }

    // Pause on hover
    var wrapper = container.firstChild;
    wrapper.addEventListener('mouseenter', stopAuto);
    wrapper.addEventListener('mouseleave', startAuto);
  }

  function buildDots() {
    var html = '';
    for (var i = 0; i < reviews.length; i++) {
      var isActive = i === currentIndex;
      html += '<button style="width:' + (isActive ? '24px' : '8px') + ';height:8px;border-radius:4px;border:none;padding:0;cursor:pointer;'
        + 'background:' + (isActive ? '#1D9E75' : '#d1d5db') + ';transition:all 0.3s;"></button>';
    }
    return html;
  }

  function updateCard(newIndex) {
    var cardWrapper = document.getElementById('lrr-demo-card');
    var inner = cardWrapper.firstChild;
    if (!inner) return;

    // Fade out
    inner.style.opacity = '0';
    inner.style.transform = 'translateY(8px)';

    setTimeout(function () {
      currentIndex = newIndex;
      cardWrapper.innerHTML = buildCard(reviews[currentIndex]);

      // Start hidden
      var newInner = cardWrapper.firstChild;
      newInner.style.opacity = '0';
      newInner.style.transform = 'translateY(8px)';

      // Force reflow then fade in
      void newInner.offsetHeight;
      newInner.style.opacity = '1';
      newInner.style.transform = 'translateY(0)';

      // Update dots
      updateDots();
      isTransitioning = false;
    }, 300);
  }

  function updateDots() {
    var dotsEl = document.getElementById('lrr-demo-dots');
    if (!dotsEl) return;
    var dots = dotsEl.children;
    for (var i = 0; i < dots.length; i++) {
      dots[i].style.width = i === currentIndex ? '24px' : '8px';
      dots[i].style.background = i === currentIndex ? '#1D9E75' : '#d1d5db';
    }
  }

  function goTo(index) {
    if (isTransitioning || index === currentIndex) return;
    isTransitioning = true;
    resetAuto();
    updateCard(index);
  }

  function startAuto() {
    stopAuto();
    autoTimer = setInterval(function () {
      var next = (currentIndex + 1) % reviews.length;
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

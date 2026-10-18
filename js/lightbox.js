/* ============================================================
   Sweet Gypsy Design — Universal Photo Lightbox Viewer
   Supports instant 0ms response photo viewing popups
   Complies strictly with CSP 'self' policy
   ============================================================ */

(function () {
  // ── MORE.HTML GALLERY DATA ──
  const MORE_GALLERY_ITEMS = [
    { src: 'img/S__2064391.jpg', badgeKey: 'more_badge_1', fallbackBadge: '✦ "Woodcut' },
    { src: 'img/artist-exhibition.jpg', badgeKey: 'more_badge_2', fallbackBadge: '✦ Passion & Art' },
    { src: 'img/S__2064403.jpg', badgeKey: 'more_badge_3', fallbackBadge: '✦ Natural Textures' },
    { src: 'img/S__2064402_0.jpg', badgeKey: 'more_badge_4', fallbackBadge: '✦ Unique Craft' },
    { src: 'img/S__2064400_0.jpg', badgeKey: 'more_badge_5', fallbackBadge: '✦ Memories of Time' },
    { src: 'img/S__2064401_0.jpg', badgeKey: 'more_badge_6', fallbackBadge: '✦ Pure Inspiration' }
  ];

  // Pre-instantiate Image objects in memory for instant switching
  const preloadedImages = MORE_GALLERY_ITEMS.map(item => {
    const img = new Image();
    img.src = item.src;
    return img;
  });

  let currentMoreIndex = 0;

  /* ── MORE.HTML LIGHTBOX CONTROLS ── */
  window.updateMoreLightboxContent = function () {
    const lightboxImg = document.getElementById('more-lightbox-img');
    const lightboxBadge = document.getElementById('more-lightbox-badge');
    const lightboxCounter = document.getElementById('more-lightbox-counter');
    if (!lightboxImg) return;

    const item = MORE_GALLERY_ITEMS[currentMoreIndex];

    // Instant image swap from preloaded image cache
    if (preloadedImages[currentMoreIndex] && preloadedImages[currentMoreIndex].src) {
      lightboxImg.src = preloadedImages[currentMoreIndex].src;
    } else {
      lightboxImg.src = item.src;
    }

    let badgeText = item.fallbackBadge;
    if (typeof i18n !== 'undefined' && typeof currentLang !== 'undefined' && i18n[currentLang] && i18n[currentLang][item.badgeKey]) {
      badgeText = i18n[currentLang][item.badgeKey];
    }
    if (lightboxBadge) lightboxBadge.textContent = badgeText;
    if (lightboxCounter) lightboxCounter.textContent = (currentMoreIndex + 1) + ' / ' + MORE_GALLERY_ITEMS.length;
  };

  window.openMoreLightbox = function (index) {
    const lightbox = document.getElementById('more-lightbox');
    if (!lightbox) return;
    currentMoreIndex = typeof index === 'number' ? index : 0;
    updateMoreLightboxContent();
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  window.closeMoreLightbox = function () {
    const lightbox = document.getElementById('more-lightbox');
    if (lightbox) {
      lightbox.classList.remove('active');
      document.body.style.overflow = '';
    }
  };

  window.showMorePrev = function () {
    currentMoreIndex = (currentMoreIndex - 1 + MORE_GALLERY_ITEMS.length) % MORE_GALLERY_ITEMS.length;
    updateMoreLightboxContent();
  };

  window.showMoreNext = function () {
    currentMoreIndex = (currentMoreIndex + 1) % MORE_GALLERY_ITEMS.length;
    updateMoreLightboxContent();
  };

  /* ── INDEX.HTML MAIN LIGHTBOX CONTROLS ── */
  window.openMainLightbox = function (src) {
    const lb = document.getElementById('main-lightbox');
    const img = document.getElementById('main-lightbox-img');
    if (!lb || !img || !src) return;
    img.src = src;
    lb.classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  window.closeMainLightbox = function () {
    const lb = document.getElementById('main-lightbox');
    if (lb) {
      lb.classList.remove('active');
      document.body.style.overflow = '';
    }
  };

  /* ── INSTANT POINTER & CLICK DELEGATION (0ms response on press down) ── */
  let lastActionTime = 0;

  function triggerInstantNav(e) {
    const now = performance.now();
    if (now - lastActionTime < 60) return; // Prevent duplicate pointer/click events

    const target = e.target;
    if (!target) return;

    // 1. Navigation buttons (prev/next)
    const prevBtn = target.closest('.global-lightbox-nav.prev');
    if (prevBtn) {
      lastActionTime = now;
      if (e.cancelable) e.preventDefault();
      showMorePrev();
      return true;
    }

    const nextBtn = target.closest('.global-lightbox-nav.next');
    if (nextBtn) {
      lastActionTime = now;
      if (e.cancelable) e.preventDefault();
      showMoreNext();
      return true;
    }

    // 2. Close button or backdrop clicks
    const closeBtn = target.closest('.global-lightbox-close, .global-lightbox-backdrop, .more-lightbox-close, .more-lightbox-backdrop');
    if (closeBtn) {
      lastActionTime = now;
      if (e.cancelable) e.preventDefault();
      closeMoreLightbox();
      closeMainLightbox();
      return true;
    }

    // 3. Open more.html gallery cards (only on click/pointerup for card opening)
    if (e.type === 'click') {
      const moreCard = target.closest('.more-img-card, .more-gallery-item');
      if (moreCard) {
        const img = moreCard.querySelector('img');
        if (img) {
          lastActionTime = now;
          const src = img.getAttribute('src') || img.src;
          const idx = MORE_GALLERY_ITEMS.findIndex(item => src.includes(item.src) || item.src.includes(src));
          openMoreLightbox(idx !== -1 ? idx : 0);
          return true;
        }
      }

      // 4. Open index.html images
      const targetImg = target.closest('.story-imgs img, .aboutme-section-img img, #modal-main-img, .product-img-wrap img');
      if (targetImg) {
        if (target.closest('.product-overlay-btn, .product-add-cart-btn')) return;
        const src = targetImg.getAttribute('src') || targetImg.src;
        if (src && !src.includes('data:image/svg')) {
          lastActionTime = now;
          openMainLightbox(src);
        }
      }
    }
  }

  // Listen on both pointerdown (instant press down) and click
  document.addEventListener('pointerdown', triggerInstantNav, { passive: false });
  document.addEventListener('click', triggerInstantNav, { passive: false });

  /* ── KEYBOARD NAVIGATION (Esc, ArrowLeft, ArrowRight) ── */
  document.addEventListener('keydown', function (e) {
    const moreLb = document.getElementById('more-lightbox');
    if (moreLb && moreLb.classList.contains('active')) {
      if (e.key === 'Escape') closeMoreLightbox();
      if (e.key === 'ArrowLeft') showMorePrev();
      if (e.key === 'ArrowRight') showMoreNext();
      return;
    }

    const mainLb = document.getElementById('main-lightbox');
    if (mainLb && mainLb.classList.contains('active')) {
      if (e.key === 'Escape') closeMainLightbox();
    }
  });
})();

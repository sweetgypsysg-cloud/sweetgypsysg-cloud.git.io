/* ============================================================
   Sweet Gypsy Design — About Me Overlay Logic
   Opens/closes the full-screen About Me page overlay
   ============================================================ */

(function () {
  'use strict';

  const trigger   = document.getElementById('about-me-trigger');
  const overlay   = document.getElementById('aboutme-overlay');
  const closeBtn  = document.getElementById('aboutme-close');

  if (!trigger || !overlay || !closeBtn) return;

  /* ── Open ── */
  function openAboutMe(e) {
    e.preventDefault();
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    overlay.scrollTop = 0;              // reset scroll to top
    observeSections();                   // start watching sections
  }

  /* ── Close ── */
  function closeAboutMe() {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  /* ── Event listeners ── */
  trigger.addEventListener('click', openAboutMe);
  closeBtn.addEventListener('click', closeAboutMe);

  // Close on Esc key
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && overlay.classList.contains('active')) {
      closeAboutMe();
    }
  });

  // Close on clicking the back-to-contact button inside overlay
  const backBtn = document.getElementById('aboutme-back-btn');
  if (backBtn) {
    backBtn.addEventListener('click', function (e) {
      e.preventDefault();
      closeAboutMe();
      // Scroll to contact section after overlay closes
      setTimeout(function () {
        const contact = document.getElementById('contact');
        if (contact) contact.scrollIntoView({ behavior: 'smooth' });
      }, 350);
    });
  }

  /* ── Intersection Observer — animate sections on scroll ── */
  function observeSections() {
    const sections = overlay.querySelectorAll('.aboutme-section, .aboutme-bottom');
    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target); // only once
        }
      });
    }, {
      root: overlay,      // observe within the overlay scroll container
      threshold: 0.15
    });

    sections.forEach(function (s) {
      observer.observe(s);
    });
  }
})();

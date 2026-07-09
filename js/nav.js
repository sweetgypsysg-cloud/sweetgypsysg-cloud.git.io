/* ============================================================
   Sweet Gypsy Design — Navigation Logic
   Nav scroll shadow + hamburger menu
   ============================================================ */

/* ─── NAV SCROLL SHADOW ─── */
function initNavScroll() {
  window.addEventListener('scroll', () => {
    const nav = document.querySelector('nav');
    if (!nav) return;
    nav.style.boxShadow = window.scrollY > 50
      ? '0 2px 20px rgba(61,43,31,.08)'
      : 'none';
  });
}

/* ─── HAMBURGER MENU ─── */
function initHamburger() {
  const hamburger = document.getElementById('nav-hamburger');
  const navMenu = document.getElementById('nav-menu');
  if (!hamburger || !navMenu) return;

  const mobileMenuQuery = window.matchMedia('(max-width: 900px)');
  const isMobileMenu = () => mobileMenuQuery.matches;
  hamburger.setAttribute('aria-controls', navMenu.id);
  hamburger.setAttribute('aria-expanded', 'false');

  /*
   * CRITICAL FIX: backdrop-filter on <nav> creates a new containing block,
   * which traps position:fixed children (nav-links) inside the nav height.
   * Solution: Move nav-links AND hamburger to <body> on mobile so
   * position:fixed works relative to viewport, and hamburger stays clickable
   * above the full-screen menu panel.
   */

  // Move nav-links to body on mobile
  function moveMenuToBody() {
    if (isMobileMenu() && navMenu.parentElement !== document.body) {
      document.body.appendChild(navMenu);
    }
  }

  // Move nav-links back to nav on desktop
  function moveMenuToNav() {
    const nav = document.querySelector('nav');
    const navRight = document.querySelector('.nav-right');
    if (!isMobileMenu() && navMenu.parentElement === document.body && nav) {
      nav.insertBefore(navMenu, navRight);
    }
  }

  // Move hamburger to body on mobile (so it's above the menu panel)
  function moveHamburgerToBody() {
    if (isMobileMenu() && hamburger.parentElement !== document.body) {
      document.body.appendChild(hamburger);
    }
  }

  // Move hamburger back to nav on desktop
  function moveHamburgerToNav() {
    const nav = document.querySelector('nav');
    const navRight = document.querySelector('.nav-right');
    if (!isMobileMenu() && hamburger.parentElement === document.body && nav) {
      nav.insertBefore(hamburger, navRight);
    }
  }

  moveMenuToBody();
  moveHamburgerToBody();

  // Create overlay element
  let overlay = document.querySelector('.nav-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'nav-overlay';
    document.body.appendChild(overlay);
  }

  function syncMenuState(isOpen) {
    hamburger.classList.toggle('active', isOpen);
    navMenu.classList.toggle('open', isOpen);
    overlay.classList.toggle('active', isOpen);
    document.body.classList.toggle('menu-open', isOpen);
    hamburger.setAttribute('aria-expanded', String(isOpen));
    hamburger.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');

    if (isMobileMenu()) {
      navMenu.setAttribute('aria-hidden', String(!isOpen));
    } else {
      navMenu.removeAttribute('aria-hidden');
    }
  }

  function openMenu() {
    moveMenuToBody();
    moveHamburgerToBody();
    syncMenuState(true);
  }

  function closeMenu() {
    syncMenuState(false);
  }

  // Toggle menu on hamburger click
  hamburger.addEventListener('click', (e) => {
    e.stopPropagation();
    if (navMenu.classList.contains('open')) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  // Close menu when overlay is clicked
  overlay.addEventListener('click', closeMenu);

  // Close menu when a nav link is clicked, then smooth-scroll to target
  navMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', (e) => {
      closeMenu();
      const href = link.getAttribute('href');
      if (href && href.startsWith('#') && href.length > 1) {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          // Small delay so the menu close animation doesn't interfere
          setTimeout(() => {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 50);
        }
      } else if (href === '#') {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  });

  // Close menu on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navMenu.classList.contains('open')) {
      closeMenu();
    }
  });

  function syncResponsiveLayout() {
    if (isMobileMenu()) {
      moveMenuToBody();
      moveHamburgerToBody();
      syncMenuState(navMenu.classList.contains('open'));
    } else {
      closeMenu();
      moveMenuToNav();
      moveHamburgerToNav();
      navMenu.removeAttribute('aria-hidden');
    }
  }

  syncResponsiveLayout();

  if (typeof mobileMenuQuery.addEventListener === 'function') {
    mobileMenuQuery.addEventListener('change', syncResponsiveLayout);
  } else {
    mobileMenuQuery.addListener(syncResponsiveLayout);
  }

  // Keep fixed elements aligned when browser chrome changes viewport dimensions.
  window.addEventListener('resize', syncResponsiveLayout);
}

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

  const isMobileMenu = () => window.innerWidth <= 900;

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

  function openMenu() {
    moveMenuToBody();
    moveHamburgerToBody();
    hamburger.classList.add('active');
    navMenu.classList.add('open');
    overlay.classList.add('active');
    document.body.classList.add('menu-open');
    hamburger.setAttribute('aria-label', 'ปิดเมนู');
  }

  function closeMenu() {
    hamburger.classList.remove('active');
    navMenu.classList.remove('open');
    overlay.classList.remove('active');
    document.body.classList.remove('menu-open');
    hamburger.setAttribute('aria-label', 'เปิดเมนู');
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

  // Close menu when a nav link is clicked
  navMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  // Close menu on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navMenu.classList.contains('open')) {
      closeMenu();
    }
  });

  // Handle window resize
  window.addEventListener('resize', () => {
    if (window.innerWidth > 900) {
      closeMenu();
      moveMenuToNav();
      moveHamburgerToNav();
    } else {
      moveMenuToBody();
      moveHamburgerToBody();
    }
  });
}

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

  // Create overlay element for closing menu by tapping outside
  let overlay = document.querySelector('.nav-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'nav-overlay';
    document.body.appendChild(overlay);
  }

  function openMenu() {
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

  // Close menu on window resize if we go back to desktop width
  window.addEventListener('resize', () => {
    if (window.innerWidth > 768 && navMenu.classList.contains('open')) {
      closeMenu();
    }
  });
}

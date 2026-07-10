/* ============================================================
   Sweet Gypsy Design — Main Entry Point
   Initializes all modules on DOMContentLoaded
   Depends on: nav.js, catalog.js, modal.js, lang.js
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  initNavScroll();
  initProductCards();
  initHamburger();
  initModal();
  initCollectionTabs();
  initCart();
  applyLang('en'); // default language

  // Fetch real product data from Google Sheets
  fetchCatalog();
});

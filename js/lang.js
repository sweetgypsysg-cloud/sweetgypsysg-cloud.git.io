/* ============================================================
   Sweet Gypsy Design — Language Switcher Logic
   Depends on: i18n.js (i18n, currentLang)
   ============================================================ */

/* ─── APPLY TRANSLATIONS ─── */
function applyLang(lang) {
  const t = i18n[lang];
  if (!t) return;
  currentLang = lang;

  // Update all data-i18n elements
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (t[key] !== undefined) {
      el.innerHTML = DOMPurify.sanitize(t[key]);
    }
  });

  // Update form labels and placeholders with data-i18n-label and data-i18n-placeholder
  document.querySelectorAll('[data-i18n-label]').forEach(el => {
    const key = el.getAttribute('data-i18n-label');
    if (t[key] !== undefined) {
      el.textContent = t[key];
    }
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (t[key] !== undefined) {
      el.placeholder = t[key];
    }
  });

  // Update select options
  document.querySelectorAll('[data-i18n-options]').forEach(select => {
    const optionKeys = select.getAttribute('data-i18n-options').split(',');
    Array.from(select.options).forEach((option, index) => {
      if (optionKeys[index] && t[optionKeys[index]] !== undefined) {
        option.textContent = t[optionKeys[index]];
      }
    });
  });

  // Update active button
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
  });

  // Update html lang attribute
  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : lang;

  // Update html class for font switching
  document.documentElement.className = `lang-${lang}`;

  // Re-render dynamic catalog in new language (if loaded)
  if (typeof renderCatalog === 'function' && cachedSheetRows) {
    renderCatalog();
  }
}

/* ─── PUBLIC: called programmatically or via event listener ─── */
function setLang(lang) {
  applyLang(lang);
}

/* ─── BIND LANGUAGE BUTTONS VIA addEventListener ─── */
document.querySelectorAll('.lang-btn').forEach(btn => {
  btn.addEventListener('click', () => setLang(btn.dataset.lang));
});

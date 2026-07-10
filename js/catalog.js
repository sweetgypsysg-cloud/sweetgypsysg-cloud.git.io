/* ============================================================
   Sweet Gypsy Design — Google Sheets Catalog Integration
   Depends on: i18n.js (i18n, currentLang), lang.js (applyLang)
   ============================================================ */

const SHEET_ID = '1Al60xA21jSCWvyqvgQeSxVhyPeU71ADsYLzZPbLQpys';
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json`;

// Cached sheet data for re-rendering on language change
let cachedSheetRows = null;
let cachedImgColIndex = 6;

/* ─── IMAGE UTILITIES ─── */
function optimizeImageURL(imageUrl, productId) {
  if (!imageUrl || typeof imageUrl !== 'string') return '';
  if (!isSafeImageUrl(imageUrl)) return '';
  // Cloudinary auto-format: serve best format (WebP/AVIF) & quality
  if (imageUrl.includes('cloudinary.com') && !imageUrl.includes('f_auto')) {
    imageUrl = imageUrl.replace('/upload/', '/upload/f_auto,q_auto/');
  }
  return imageUrl;
}

function setupImageError(imgElement, productId) {
  imgElement.addEventListener('error', function () {
    console.warn(`[IMG] Failed to load: ${productId}`);
    this.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZSBOb3QgRm91bmQ8L3RleHQ+PC9zdmc+';
    this.classList.add('image-error');
  });
}

/* ─── DETECT IMAGE COLUMN ─── */
function detectImageColumn(rows) {
  if (!rows || rows.length === 0) return 6;
  const firstRow = rows[0].c;
  for (let i = 0; i < firstRow.length; i++) {
    const val = firstRow[i]?.v || '';
    if (typeof val === 'string' && (val.includes('http') || val.includes('data:image'))) {
      return i;
    }
  }
  return 6;
}

/* ============================================================
   CATEGORY DEFINITIONS — 4 product types
   Now driven by the "Catalog_Type" column (Col F) in Google Sheets
   ============================================================ */

const CATEGORIES = [
  {
    id: 'rings',
    keywords: ['ring', 'แหวน'],
    names: { en: 'Rings', th: 'แหวน', zh: '戒指', ja: 'リング' },
    ph: 'ph-2'
  },
  {
    id: 'necklace',
    names: { en: 'Necklace', th: 'สร้อยคอ', zh: '项链', ja: 'ネックレス' },
    ph: 'ph-3'
  },
  {
    id: 'earrings',
    names: { en: 'Earrings', th: 'ต่างหู', zh: '耳环', ja: 'ピアス' },
    ph: 'ph-4'
  },
  {
    id: 'bracelets',
    names: { en: 'Bracelets', th: 'กำไล', zh: '手镯', ja: 'ブレスレット' },
    ph: 'ph-5'
  }
];

/* ─── DM LINK GENERATORS — based on DM_Type column (Col G) ─── */
const DM_LINKS = {
  line: (product) => `https://line.me/ti/p/~@sweetgypsy`,
  whatsapp: (product) => {
    const msg = currentLang === 'th'
      ? `สวัสดีค่ะ สนใจสินค้า: ${product.name} (รหัส: ${product.id})`
      : `Hello, I'm interested in: ${product.name} (ID: ${product.id})`;
    return `https://wa.me/66645195663?text=${encodeURIComponent(msg)}`;
  },
  instagram: (product) => `https://ig.me/m/sweetgypsys`,
  facebook: (product) => `https://m.me/sweetgypsyth`
};

/** Returns the primary DM link URL for a product based on its DM_Type */
function getDmLink(product) {
  const type = (product.dmType || 'whatsapp').toLowerCase().trim();
  const generator = DM_LINKS[type] || DM_LINKS.whatsapp;
  return generator(product);
}

/* ─── NORMALIZE Catalog_Type VALUE FROM SHEET ─── */
function normalizeCatalogType(raw) {
  if (!raw) return null;
  // Strip zero-width spaces and trim
  const cleaned = raw.replace(/[\u200B-\u200D\uFEFF]/g, '').trim().toLowerCase();
  // Match against known category IDs
  const match = CATEGORIES.find(cat => cat.id === cleaned);
  return match ? match.id : null;
}

/* ─── GET CATEGORY DISPLAY NAME ─── */
function getCategoryName(cat) {
  return cat.names[currentLang] || cat.names.en;
}

/* ─── BUILD A SINGLE PRODUCT CARD HTML ─── */
function buildProductCard(product) {
  const t = i18n[currentLang] || i18n.en;
  const viewBtnText = escapeHtml(t.product_overlay_btn || 'View Details');
  const addCartText = escapeHtml(t.cart_add || 'Add to Cart');
  const safeData = encodeURIComponent(JSON.stringify(product));
  const safeId = escapeHtml(sanitizeProductId(product.id));
  const safeName = escapeHtml(product.name);
  const safeCategory = escapeHtml(product.category || '');
  const safePrice = escapeHtml(product.price);
  const safePh = escapeHtml(product.ph || 'ph-2');

  const imgHTML = product.image
    ? `<img src="${escapeHtml(product.image)}" alt="${safeName}" class="product-img-dynamic" loading="lazy" data-product-id="${safeId}">`
    : `<div class="img-ph ${safePh}">${safeName}</div>`;

  return `
    <div class="product-card" data-sheet-product="${safeData}">
      <div class="product-img-wrap">
        ${imgHTML}
        <div class="product-overlay">
          <button class="product-overlay-btn">${viewBtnText}</button>
          <button class="product-add-cart-btn" data-add-cart>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 01-8 0"/>
            </svg>
            ${addCartText}
          </button>
        </div>
      </div>
      <div class="product-info">
        <p class="product-cat">${safeCategory}</p>
        <h3 class="product-name">${safeName}</h3>
        <p class="product-price">${safePrice} THB</p>
      </div>
    </div>
  `;
}

/* ─── PARSE ROW INTO PRODUCT OBJECT ─── */
function parseProductRow(row, index, imgColIndex) {
  // Sheet structure: Col0=ID, Col1=NAME, Col2=PRICE, Col3=ImageURL,
  //                 Col4=Description, Col5=Catalog_Type, Col6=DM_Type
  const id = row.c[0]?.v?.toString() || `product-${index}`;
  const name = row.c[1]?.v || '';
  const price = row.c[2]?.v || 'N/A';
  const rawImage = row.c[3]?.v || '';
  let images = [];
  if (typeof rawImage === 'string') {
    images = rawImage.split(/[\n,]/).map(u => optimizeImageURL(u.trim(), id)).filter(Boolean);
  }
  const image = images.length > 0 ? images[0] : '';
  const desc = row.c[4]?.v || '';
  const dmType = row.c[6]?.v || 'whatsapp';

  // Use Catalog_Type column (Col F / index 5) from the sheet
  const rawCatalogType = row.c[5]?.v || '';
  const catId = normalizeCatalogType(rawCatalogType);
  const catObj = CATEGORIES.find(c => c.id === catId);
  const category = catObj ? getCategoryName(catObj) : '';

  return {
    id, name, price, desc, image, images, category,
    catId: catId || 'other',
    ph: catObj ? catObj.ph : 'ph-2',
    dmType: dmType,
    story: ''
  };
}

/* ─── BUILD A CATEGORY COLUMN ─── */
function buildCategoryColumn(cat, products) {
  const t = i18n[currentLang] || i18n.en;
  const catName = getCategoryName(cat);
  const itemWord = t.collection_items || 'items';
  const viewAllText = t.view_all_btn || 'View All';

  let cardsHTML = '';
  if (products.length > 0) {
    cardsHTML = products.map(p => buildProductCard(p)).join('');
  } else {
    cardsHTML = `<div class="collection-empty">${t.collection_empty || 'Coming soon…'}</div>`;
  }
  
  let viewAllHTML = '';
  if (products.length > 4) {
    viewAllHTML = `
      <div class="view-all-btn-wrapper">
        <button class="view-all-btn" data-target-tab="${cat.id}">${viewAllText} ${catName} &rarr;</button>
      </div>
    `;
  }

  return `
    <div class="collection-column" data-category="${cat.id}">
      <div class="collection-column-header">
        <span class="col-type-sub">COLLECTION</span>
        <h3>${catName}</h3>
        <span class="col-count">${products.length} ${itemWord}</span>
      </div>
      <div class="slider-wrapper">
        <button class="slider-arrow slider-arrow-left">❮</button>
        <div class="collection-column-items">
          ${cardsHTML}
        </div>
        <button class="slider-arrow slider-arrow-right">❯</button>
        <div class="slider-scrollbar">
          <div class="slider-scrollbar-thumb"></div>
        </div>
      </div>
      ${viewAllHTML}
    </div>
  `;
}

/* ─── RENDER CATALOG: FILTER BY Catalog_Type INTO 4 COLUMNS ─── */
function renderCatalog() {
  if (!cachedSheetRows) return;

  const container = document.getElementById('collections-columns');
  if (!container) return;

  // Parse all products from sheet rows
  const allProducts = [];
  cachedSheetRows.forEach((row, index) => {
    try {
      allProducts.push(parseProductRow(row, index, cachedImgColIndex));
    } catch (e) {
      console.error(`[CATALOG] Row ${index} failed:`, e);
    }
  });

  // ── USE .filter() TO SEPARATE PRODUCTS BY Catalog_Type ──
  const grouped = {};
  CATEGORIES.forEach(cat => {
    grouped[cat.id] = allProducts.filter(p => p.catId === cat.id);
  });

  // Collect uncategorized products (Catalog_Type didn't match any known category)
  const uncategorized = allProducts.filter(p => p.catId === 'other');
  if (uncategorized.length > 0) {
    console.warn(`[CATALOG] ${uncategorized.length} product(s) have no matching Catalog_Type — distributing round-robin`);
    uncategorized.forEach((product, i) => {
      const targetCat = CATEGORIES[i % CATEGORIES.length];
      product.category = getCategoryName(targetCat);
      product.catId = targetCat.id;
      grouped[targetCat.id].push(product);
    });
  }

  // Build 4 category columns
  let columnsHTML = '';
  CATEGORIES.forEach((cat, idx) => {
    columnsHTML += buildCategoryColumn(cat, grouped[cat.id]);
  });

  container.innerHTML = columnsHTML;
  // Set default view to "all" mode
  container.classList.add('view-all');

  // Setup image error handlers
  container.querySelectorAll('.product-img-dynamic').forEach(img => {
    setupImageError(img, img.dataset.productId);
  });

  // Re-attach view-all buttons (product cards use delegation, no re-bind needed)
  initViewAllButtons();
  initSliders();

  // Log summary per category
  const summary = CATEGORIES.map(c => `${c.id}: ${grouped[c.id].length}`).join(', ');
  console.log(`[CATALOG] ✓ Rendered ${allProducts.length} products → ${summary}`);
}

/* ─── FETCH CATALOG FROM GOOGLE SHEETS ─── */
async function fetchCatalog() {
  const container = document.getElementById('collections-columns');
  const t = i18n[currentLang] || i18n.en;

  try {
    console.log('[CATALOG] Fetching from Google Sheets...');
    const response = await fetch(SHEET_URL);
    const text = await response.text();
    const jsonData = JSON.parse(text.substring(47, text.length - 2));
    const rows = jsonData.table.rows;

    console.log(`[CATALOG] ✓ Loaded ${rows.length} products`);

    // Cache for language switching
    cachedSheetRows = rows;
    cachedImgColIndex = detectImageColumn(rows);

    // Render the catalog
    renderCatalog();

  } catch (error) {
    console.error('[CATALOG] Error fetching:', error);
    if (container) {
      container.innerHTML = `<p style="grid-column:1/-1;text-align:center;color:var(--text-muted);padding:2rem 0;">${t.catalog_error || 'Unable to load products.'}</p>`;
    }
  }
}

/* ─── PRODUCT CARD BUTTONS (event delegation — binds once) ─── */
let _productCardsDelegated = false;
function initProductCards() {
  if (_productCardsDelegated) return; // Already bound
  _productCardsDelegated = true;

  // Use event delegation on <body> so dynamically created cards are handled
  document.body.addEventListener('click', (e) => {
    // ── ADD TO CART button ──
    const addCartBtn = e.target.closest('[data-add-cart]');
    if (addCartBtn) {
      e.stopPropagation();
      const card = addCartBtn.closest('.product-card');
      if (card && card.dataset.sheetProduct) {
        try {
          const product = JSON.parse(decodeURIComponent(card.dataset.sheetProduct));
          addToCart(product);
        } catch (err) {
          console.error('[CARD] Failed to parse product for cart', err);
        }
      }
      return;
    }

    // ── VIEW DETAILS button ──
    const btn = e.target.closest('.product-overlay-btn');
    if (!btn) return;

    const card = btn.closest('.product-card');
    if (card && card.dataset.sheetProduct) {
      try {
        const product = JSON.parse(decodeURIComponent(card.dataset.sheetProduct));
        openProductModal(product);
      } catch (err) {
        console.error('[CARD] Failed to parse product data', err);
      }
      return;
    }
    // Fallback: show alert for static cards
    const t = i18n[currentLang];
    alert(t ? t.alert_order : i18n.en.alert_order);
  });
}

/* ─── COLLECTION TAB SWITCHING ─── */
function initCollectionTabs() {
  const tabs = document.querySelectorAll('.collection-tab[data-tab]');

  tabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      e.preventDefault();

      // Update active tab styling
      tabs.forEach(t => t.classList.remove('active'));
      const activeTab = e.currentTarget;
      activeTab.classList.add('active');

      const catId = activeTab.getAttribute('data-tab');

      // Update active column visibility
      const columnsContainer = document.getElementById('collections-columns');
      const columns = document.querySelectorAll('.collection-column');
      
      if (catId === 'all') {
        columnsContainer.classList.add('view-all');
        columns.forEach(col => col.classList.remove('active'));
      } else {
        columnsContainer.classList.remove('view-all');
        columns.forEach(col => {
          if (col.getAttribute('data-category') === catId) {
            col.classList.add('active');
          } else {
            col.classList.remove('active');
          }
        });
      }
    });
  });
}

function initViewAllButtons() {
  document.querySelectorAll('.view-all-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const targetCat = e.target.getAttribute('data-target-tab');
      const targetTab = document.querySelector(`.collection-tab[data-tab="${targetCat}"]`);
      if (targetTab) {
        targetTab.click();
        document.getElementById('collections').scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
}

function initSliders() {
  document.querySelectorAll('.slider-wrapper').forEach(wrapper => {
    const container = wrapper.querySelector('.collection-column-items');
    const leftBtn = wrapper.querySelector('.slider-arrow-left');
    const rightBtn = wrapper.querySelector('.slider-arrow-right');
    const scrollbar = wrapper.querySelector('.slider-scrollbar');
    const scrollbarThumb = wrapper.querySelector('.slider-scrollbar-thumb');

    if (!container || !leftBtn || !rightBtn) return;

    // --- Smart Arrow Visibility + Scrollbar Update ---
    const updateArrows = () => {
      const maxScrollLeft = container.scrollWidth - container.clientWidth;
      if (container.scrollLeft <= 5) {
        leftBtn.style.opacity = '0';
        leftBtn.style.pointerEvents = 'none';
      } else {
        leftBtn.style.opacity = '1';
        leftBtn.style.pointerEvents = 'auto';
      }
      
      if (maxScrollLeft <= 0 || container.scrollLeft >= maxScrollLeft - 5) {
        rightBtn.style.opacity = '0';
        rightBtn.style.pointerEvents = 'none';
      } else {
        rightBtn.style.opacity = '1';
        rightBtn.style.pointerEvents = 'auto';
      }

      // --- Scrollbar progress update ---
      if (scrollbar && scrollbarThumb) {
        if (maxScrollLeft <= 0) {
          scrollbar.style.display = 'none';
        } else {
          scrollbar.style.display = '';
          const thumbRatio = container.clientWidth / container.scrollWidth;
          const thumbWidth = Math.max(thumbRatio * 100, 15); // min 15%
          const scrollRatio = container.scrollLeft / maxScrollLeft;
          const thumbLeft = scrollRatio * (100 - thumbWidth);
          scrollbarThumb.style.width = thumbWidth + '%';
          scrollbarThumb.style.left = thumbLeft + '%';
        }
      }
    };

    container.addEventListener('scroll', updateArrows);
    window.addEventListener('resize', updateArrows);
    // Initial check after images load
    setTimeout(updateArrows, 150);

    // --- Scrollbar Drag Interaction ---
    if (scrollbar && scrollbarThumb) {
      let sbDragging = false;
      let sbStartX = 0;
      let sbStartScrollLeft = 0;

      scrollbarThumb.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        sbDragging = true;
        sbStartX = e.clientX;
        sbStartScrollLeft = container.scrollLeft;
        scrollbarThumb.classList.add('dragging');
        document.body.style.userSelect = 'none';
      });

      document.addEventListener('mousemove', (e) => {
        if (!sbDragging) return;
        e.preventDefault();
        const dx = e.clientX - sbStartX;
        const scrollbarWidth = scrollbar.offsetWidth;
        const maxScrollLeft = container.scrollWidth - container.clientWidth;
        const scrollRatio = dx / scrollbarWidth;
        container.scrollLeft = sbStartScrollLeft + scrollRatio * maxScrollLeft;
      });

      document.addEventListener('mouseup', () => {
        if (!sbDragging) return;
        sbDragging = false;
        scrollbarThumb.classList.remove('dragging');
        document.body.style.userSelect = '';
      });

      // --- Click on track to jump ---
      scrollbar.addEventListener('click', (e) => {
        if (e.target === scrollbarThumb) return; // ignore thumb clicks
        const rect = scrollbar.getBoundingClientRect();
        const clickRatio = (e.clientX - rect.left) / rect.width;
        const maxScrollLeft = container.scrollWidth - container.clientWidth;
        container.scrollTo({ left: clickRatio * maxScrollLeft, behavior: 'smooth' });
      });
    }

    // --- Arrow Click Scrolling ---
    leftBtn.addEventListener('click', () => {
      const firstChild = container.querySelector('.product-card');
      const scrollAmount = firstChild ? firstChild.offsetWidth + 24 : 300; // 24px is gap
      container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    });

    rightBtn.addEventListener('click', () => {
      const firstChild = container.querySelector('.product-card');
      const scrollAmount = firstChild ? firstChild.offsetWidth + 24 : 300;
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    });

    // --- Mouse Drag-to-Scroll with Momentum ---
    let isDown = false;
    let startX;
    let scrollLeft;
    let isDragging = false;
    let velocity = 0;
    let lastX = 0;
    let lastTime = 0;
    let momentumId = null;

    function startMomentum() {
      if (Math.abs(velocity) < 0.5) {
        velocity = 0;
        return;
      }
      container.scrollLeft -= velocity;
      velocity *= 0.92; // friction — lower = stops faster
      momentumId = requestAnimationFrame(startMomentum);
    }

    function stopMomentum() {
      if (momentumId) {
        cancelAnimationFrame(momentumId);
        momentumId = null;
      }
    }

    // Suppress context menu only after a right-click drag
    let rightClickDragged = false;
    container.addEventListener('contextmenu', (e) => {
      if (rightClickDragged) {
        e.preventDefault();
        rightClickDragged = false;
      }
    });

    container.addEventListener('mousedown', (e) => {
      const isRightClick = e.button === 2;
      const isLeftClick = e.button === 0;

      if (!isLeftClick && !isRightClick) return;

      // Left-click: don't drag on interactive elements
      if (isLeftClick && e.target.closest('.product-overlay-btn, .product-overlay, a, button')) return;

      // Right-click: prevent default to avoid text selection issues
      if (isRightClick) e.preventDefault();

      stopMomentum();
      isDown = true;
      isDragging = false;
      rightClickDragged = false;
      velocity = 0;
      container.classList.add('active-drag');
      startX = e.pageX - container.offsetLeft;
      scrollLeft = container.scrollLeft;
      lastX = e.pageX;
      lastTime = Date.now();
      
      // Temporarily disable smooth scroll & snap for instant drag
      container.style.scrollSnapType = 'none';
      container.style.scrollBehavior = 'auto'; 
    });

    container.addEventListener('mouseleave', () => {
      if (!isDown) return;
      isDown = false;
      container.classList.remove('active-drag');
      container.style.scrollSnapType = '';
      container.style.scrollBehavior = '';
      // Start momentum on leave too
      if (isDragging && Math.abs(velocity) > 1) {
        startMomentum();
      }
      updateArrows();
    });

    container.addEventListener('mouseup', () => {
      if (!isDown) return;
      isDown = false;
      container.classList.remove('active-drag');
      container.style.scrollSnapType = '';
      container.style.scrollBehavior = '';
      // Start momentum scroll
      if (isDragging && Math.abs(velocity) > 1) {
        startMomentum();
      }
      updateArrows();
    });

    container.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      e.preventDefault();
      
      const x = e.pageX - container.offsetLeft;
      // Only count as dragging if moved more than 8px (increased for trackpad)
      if (Math.abs(x - startX) > 8) {
        isDragging = true;
        rightClickDragged = true;
      }

      // Track velocity for momentum
      const now = Date.now();
      const dt = now - lastTime;
      if (dt > 0) {
        velocity = (e.pageX - lastX) * (16 / Math.max(dt, 8)); // normalize to ~60fps
      }
      lastX = e.pageX;
      lastTime = now;

      const walk = (x - startX) * 1.5; // Scroll speed multiplier
      container.scrollLeft = scrollLeft - walk;
    });

    // Prevent click on products when dragging
    container.addEventListener('click', (e) => {
      if (isDragging) {
        e.preventDefault();
        e.stopPropagation();
        isDragging = false; // Reset so the next clean click works
      }
    }, { capture: true });
  });
}

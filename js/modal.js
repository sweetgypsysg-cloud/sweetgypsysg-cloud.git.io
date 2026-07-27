/* ============================================================
   Sweet Gypsy Design — Product Detail Modal
   Depends on: i18n.js, catalog.js (DM_LINKS, getDmLink, setupImageError)
   ============================================================ */

let currentModalSlide = 0;
let modalImages = [];
let currentMainProduct = null;
let currentModalProduct = null;

/** Track whether the modal is already open (for smooth sub-product transitions) */
let _modalIsOpen = false;

/**
 * Preload an image and resolve once it's ready (or on error).
 * Resolves quickly if the image is already cached by the browser.
 */
function preloadImage(url) {
  return new Promise(resolve => {
    if (!url) return resolve();
    const img = new Image();
    img.onload = resolve;
    img.onerror = resolve; // don't block on broken images
    img.src = url;
  });
}

function openProductModal(product) {
  const overlay = document.getElementById('product-modal-overlay');
  if (!overlay) return;

  const t = i18n[currentLang] || i18n.en;

  // Keep a Sheet 1 product as the catalog parent while its Sheet 2 variants are viewed.
  // A product opened directly from Sheet 2 still resolves to the same product family.
  if (!currentMainProduct || getProductFamilyCode(currentMainProduct.id) !== getProductFamilyCode(product.id)) {
    currentMainProduct = product;
  }
  const parent = currentMainProduct || product;
  currentModalProduct = product;

  // Detect if we're switching between sub-products within an already-open modal
  const isSwitchingVariation = _modalIsOpen && overlay.classList.contains('active');

  // Fallback values from parent if product is missing fields (e.g. variation)
  const category = product.category || parent.category || '';
  const displayName = product.name || product.id || parent.name || parent.id || '';
  const story = product.story || parent.story || '';
  const rawPrice = (product.price && product.price !== 'N/A') ? product.price : (parent.price && parent.price !== 'N/A') ? parent.price : '';
  const priceDisplay = rawPrice ? `${rawPrice} THB` : '';
  const desc = product.desc || parent.desc || t.modal_desc_default || '';

  // Resolve new images before touching the DOM
  const newImages = product.images && product.images.length > 0
    ? product.images
    : [product.image || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4='];

  // ── Core updater: applies text, images, links to the modal DOM ──
  const applyModalContent = () => {
    // Populate text fields
    document.getElementById('modal-cat').textContent = category;
    document.getElementById('modal-name').textContent = displayName;
    document.getElementById('modal-story').textContent = story;
    document.getElementById('modal-price').textContent = priceDisplay;
    document.getElementById('modal-desc').textContent = desc;

    // Image Slider
    const imgWrapper = document.getElementById('modal-img-wrapper');
    const dotsContainer = document.getElementById('modal-dots');
    const leftBtn = document.getElementById('modal-arrow-left');
    const rightBtn = document.getElementById('modal-arrow-right');

    // Preserve the magnifier button group before clearing
    const magnifierGroup = document.getElementById('magnifier-btn-group');
    imgWrapper.innerHTML = '';
    if (magnifierGroup) imgWrapper.appendChild(magnifierGroup);
    dotsContainer.innerHTML = '';
    currentModalSlide = 0;

    modalImages = newImages;

    modalImages.forEach((imgUrl, index) => {
      const img = document.createElement('img');
      img.src = imgUrl;
      img.alt = `${displayName} - image ${index + 1}`;
      img.className = 'modal-product-img';
      if (index === 0) setupImageError(img, product.id);
      imgWrapper.appendChild(img);

      const dot = document.createElement('span');
      dot.className = index === 0 ? 'modal-dot active' : 'modal-dot';
      dot.addEventListener('click', () => goToModalSlide(index));
      dotsContainer.appendChild(dot);
    });

    if (modalImages.length > 1) {
      leftBtn.style.display = 'flex';
      rightBtn.style.display = 'flex';
      dotsContainer.style.display = 'flex';
    } else {
      leftBtn.style.display = 'none';
      rightBtn.style.display = 'none';
      dotsContainer.style.display = 'none';
    }

    updateModalSlider();

    // ── Dynamic DM link based on DM_Type column from Google Sheet ──
    const dmType = (product.dmType || parent.dmType || 'whatsapp').toLowerCase().trim();

    // WhatsApp button — always uses WhatsApp link
    const waMsg = currentLang === 'th'
      ? `สวัสดีค่ะ สนใจสั่งซื้อสินค้า: ${displayName} (รหัส: ${product.id})`
      : `Hello, I'm interested in ordering: ${displayName} (ID: ${product.id})`;
    document.getElementById('modal-wa-btn').href = `https://wa.me/66645195663?text=${encodeURIComponent(waMsg)}`;

    // Line button
    const lineBtn = document.getElementById('modal-line-btn');
    if (dmType === 'instagram') {
      lineBtn.href = DM_LINKS.instagram(product);
    } else if (dmType === 'facebook') {
      lineBtn.href = DM_LINKS.facebook(product);
    } else {
      lineBtn.href = DM_LINKS.line(product);
    }

    // ── Add to Cart button in modal ──
    const modalCartBtn = document.getElementById('modal-add-cart');
    if (modalCartBtn) {
      modalCartBtn.classList.remove('added');
      const cartBtnText = modalCartBtn.querySelector('span');
      if (cartBtnText) cartBtnText.textContent = t.cart_add || 'Add to Cart';
    }

    // Activate magnifier on the first image after DOM render
    if (typeof activateModalMagnifier === 'function') {
      activateModalMagnifier();
    }

    // ── Render Sub-Products from Sheet 2 ──
    renderModalSubProducts(parent, product);
  };

  if (isSwitchingVariation) {
    // ── SMOOTH TRANSITION: crossfade when switching sub-products ──
    const infoSide = overlay.querySelector('.modal-info-side');
    const imgSide = overlay.querySelector('.modal-img-side');

    // Fade out both sides
    if (infoSide) infoSide.classList.add('modal-content-exit');
    if (imgSide) imgSide.classList.add('modal-content-exit');

    // Preload the primary image, then swap content
    const preloadPromise = preloadImage(newImages[0]);
    const minDelay = new Promise(r => setTimeout(r, 180)); // min fade-out duration

    Promise.all([preloadPromise, minDelay]).then(() => {
      applyModalContent();

      // Fade in with fresh content
      if (infoSide) {
        infoSide.classList.remove('modal-content-exit');
        infoSide.classList.add('modal-content-enter');
      }
      if (imgSide) {
        imgSide.classList.remove('modal-content-exit');
        imgSide.classList.add('modal-content-enter');
      }

      // Clean up animation classes after transition completes
      setTimeout(() => {
        if (infoSide) infoSide.classList.remove('modal-content-enter');
        if (imgSide) imgSide.classList.remove('modal-content-enter');
      }, 350);
    });
  } else {
    // ── FIRST OPEN: apply content immediately, then show modal ──
    applyModalContent();

    overlay.classList.add('active');
    document.body.classList.add('product-modal-open');
    document.body.style.overflow = 'hidden';
    _modalIsOpen = true;
  }
}

function closeProductModal() {
  const overlay = document.getElementById('product-modal-overlay');
  if (!overlay) return;
  overlay.classList.remove('active');
  document.body.classList.remove('product-modal-open');
  document.body.style.overflow = '';
  currentMainProduct = null;
  _modalIsOpen = false;
}

function goToModalSlide(index) {
  currentModalSlide = index;
  updateModalSlider();
}

function nextModalSlide() {
  currentModalSlide = (currentModalSlide + 1) % modalImages.length;
  updateModalSlider();
}

function prevModalSlide() {
  currentModalSlide = (currentModalSlide - 1 + modalImages.length) % modalImages.length;
  updateModalSlider();
}

function updateModalSlider() {
  const imgWrapper = document.getElementById('modal-img-wrapper');
  if (imgWrapper) {
    imgWrapper.style.transform = `translateX(-${currentModalSlide * 100}%)`;
  }
  const dots = document.querySelectorAll('.modal-dot');
  dots.forEach((dot, idx) => {
    dot.classList.toggle('active', idx === currentModalSlide);
  });

  // Reinit magnifier for the new slide image
  if (typeof activateModalMagnifier === 'function') {
    activateModalMagnifier();
  }
}

function initModal() {
  const overlay = document.getElementById('product-modal-overlay');
  const closeBtn = document.getElementById('modal-close');
  const leftBtn = document.getElementById('modal-arrow-left');
  const rightBtn = document.getElementById('modal-arrow-right');

  if (closeBtn) {
    closeBtn.addEventListener('click', closeProductModal);
  }

  if (leftBtn) {
    leftBtn.addEventListener('click', prevModalSlide);
  }

  if (rightBtn) {
    rightBtn.addEventListener('click', nextModalSlide);
  }

  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeProductModal();
    });
  }
  // ESC key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeProductModal();
  });

  // Add to Cart button in modal
  const modalCartBtn = document.getElementById('modal-add-cart');
  if (modalCartBtn) {
    modalCartBtn.addEventListener('click', () => {
      if (currentModalProduct) {
        addToCart(currentModalProduct);
        const t = i18n[currentLang] || i18n.en;
        modalCartBtn.classList.add('added');
        const btnText = modalCartBtn.querySelector('span');
        if (btnText) btnText.textContent = t.cart_added || '✓ Added!';
        setTimeout(() => {
          modalCartBtn.classList.remove('added');
          if (btnText) btnText.textContent = t.cart_add || 'Add to Cart';
        }, 1500);
      }
    });
  }
}

/* ─── SUB-PRODUCTS MINI CATALOG ─── */

function buildSubProductCardHTML(sub) {
  const safeName = escapeHtml(sub.name || sub.id);
  const safeId = escapeHtml(sub.id);
  const priceText = (sub.price && sub.price !== 'N/A')
    ? (sub.price.includes('฿') || sub.price.includes('THB') ? escapeHtml(sub.price) : `${escapeHtml(sub.price)} THB`)
    : '';
  const safeData = encodeURIComponent(JSON.stringify(sub));

  const imgHTML = sub.image
    // The thumbnails are inside a modal. Eager loading avoids browsers
    // postponing a visible Sheet 2 image because it was inserted lazily.
    ? `<img src="${escapeHtml(sub.image)}" alt="${safeName}" class="sub-card-img" loading="eager">`
    : `<div class="sub-card-img-ph">${safeName.charAt(0)}</div>`;

  return `
    <div class="modal-sub-card" data-sub-product="${safeData}" title="${safeName}">
      <div class="sub-card-img-wrap">
        ${imgHTML}
        <span class="sub-card-badge">${safeId}</span>
      </div>
      <div class="sub-card-info">
        <p class="sub-card-name">${safeName}</p>
        ${priceText ? `<p class="sub-card-price">${priceText}</p>` : ''}
      </div>
    </div>
  `;
}

function renderModalSubProducts(parentProduct, activeSubProduct) {
  const container = document.getElementById('modal-sub-products');
  const grid = document.getElementById('modal-sub-grid');
  if (!container || !grid) return;

  // Look up sub-products from Sheet 2
  const subProducts = (typeof getSubProducts === 'function')
    ? getSubProducts(parentProduct.id)
    : [];

  if (subProducts.length === 0) {
    container.style.display = 'none';
    grid.innerHTML = '';
    return;
  }

  // Build sub-product cards
  let cardsHTML = subProducts.map(sub => buildSubProductCardHTML(sub)).join('');
  grid.innerHTML = DOMPurify.sanitize(cardsHTML, {
    ADD_TAGS: ['img'],
    ADD_ATTR: ['data-sub-product', 'loading', 'title', 'src', 'alt']
  });

  container.style.display = '';

  // Highlight active variation if any
  if (activeSubProduct) {
    grid.querySelectorAll('.modal-sub-card').forEach(card => {
      try {
        const sub = JSON.parse(decodeURIComponent(card.dataset.subProduct));
        if (sub.id === activeSubProduct.id || sub.image === activeSubProduct.image) {
          card.classList.add('active-sub');
        } else {
          card.classList.remove('active-sub');
        }
      } catch (e) {}
    });
  }

  // Setup image error handlers for sub-product cards
  grid.querySelectorAll('.sub-card-img').forEach(img => {
    setupImageError(img, 'sub');
  });

  // Click handler: open the sub-product in the same modal
  grid.querySelectorAll('.modal-sub-card').forEach(card => {
    card.addEventListener('click', () => {
      try {
        // Prevent rapid double-clicks from causing animation glitches
        if (card.dataset.switching === 'true') return;
        card.dataset.switching = 'true';
        setTimeout(() => { card.dataset.switching = 'false'; }, 400);

        const subProduct = JSON.parse(decodeURIComponent(card.dataset.subProduct));
        openProductModal(subProduct);
      } catch (err) {
        console.error('[MODAL] Failed to open sub-product:', err);
      }
    });
  });

  console.log(`[MODAL] Rendered ${subProducts.length} sub-products for ${parentProduct.id}`);
}

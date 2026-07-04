/* ============================================================
   Sweet Gypsy Design — Product Detail Modal
   Depends on: i18n.js, catalog.js (DM_LINKS, getDmLink, setupImageError)
   ============================================================ */

let currentModalSlide = 0;
let modalImages = [];

function openProductModal(product) {
  const overlay = document.getElementById('product-modal-overlay');
  if (!overlay) return;

  const t = i18n[currentLang] || i18n.en;

  // Populate modal
  document.getElementById('modal-cat').textContent = product.category || '';
  document.getElementById('modal-name').textContent = product.name || '';
  document.getElementById('modal-story').textContent = product.story || '';
  document.getElementById('modal-price').textContent = product.price ? `${product.price} THB` : '';
  document.getElementById('modal-desc').textContent = product.desc || t.modal_desc_default || '';

  // Image Slider
  const imgWrapper = document.getElementById('modal-img-wrapper');
  const dotsContainer = document.getElementById('modal-dots');
  const leftBtn = document.getElementById('modal-arrow-left');
  const rightBtn = document.getElementById('modal-arrow-right');
  
  imgWrapper.innerHTML = '';
  dotsContainer.innerHTML = '';
  currentModalSlide = 0;
  
  modalImages = product.images && product.images.length > 0 
    ? product.images 
    : [product.image || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4='];

  modalImages.forEach((imgUrl, index) => {
    const img = document.createElement('img');
    img.src = imgUrl;
    img.alt = `${product.name} - image ${index + 1}`;
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
  const dmLink = getDmLink(product);
  const dmType = (product.dmType || 'whatsapp').toLowerCase().trim();

  // WhatsApp button — always uses WhatsApp link
  const waMsg = currentLang === 'th'
    ? `สวัสดีค่ะ สนใจสั่งซื้อสินค้า: ${product.name} (รหัส: ${product.id})`
    : `Hello, I'm interested in ordering: ${product.name} (ID: ${product.id})`;
  document.getElementById('modal-wa-btn').href = `https://wa.me/66645195663?text=${encodeURIComponent(waMsg)}`;

  // Line button — uses the DM_Type link if it's line/ig/fb, otherwise default Line
  const lineBtn = document.getElementById('modal-line-btn');
  if (dmType === 'instagram') {
    lineBtn.href = DM_LINKS.instagram(product);
  } else if (dmType === 'facebook') {
    lineBtn.href = DM_LINKS.facebook(product);
  } else {
    lineBtn.href = DM_LINKS.line(product);
  }

  // Show modal
  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeProductModal() {
  const overlay = document.getElementById('product-modal-overlay');
  if (!overlay) return;
  overlay.classList.remove('active');
  document.body.style.overflow = '';
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
}

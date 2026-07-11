/* ============================================================
   Sweet Gypsy Design — Shopping Cart System
   Depends on: i18n.js (i18n, currentLang), catalog.js (DM_LINKS)
   ============================================================ */

/* ─── CART STATE ─── */
let cart = [];
const CART_STORAGE_KEY = 'sweetgypsy_cart';

/* ─── LOAD / SAVE ─── */
function loadCart() {
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) : [];
    cart = Array.isArray(parsed) ? parsed.filter(item => item && typeof item.id === 'string') : [];
  } catch (e) {
    console.warn('[CART] Failed to load cart from localStorage', e);
    cart = [];
  }
}

function saveCart() {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch (e) {
    console.warn('[CART] Failed to save cart', e);
  }
}

/* ─── PARSE PRICE — extract first numeric value from price string ─── */
function parsePrice(priceStr) {
  if (typeof priceStr === 'number') return priceStr;
  if (!priceStr) return 0;
  // Remove currency symbols, commas, spaces; take the first number
  const cleaned = priceStr.toString().replace(/[฿,\s]/g, '');
  const match = cleaned.match(/[\d.]+/);
  return match ? parseFloat(match[0]) : 0;
}

/* ─── ADD TO CART ─── */
function addToCart(product) {
  const safeProduct = {
    id: String(product.id || ''),
    name: String(product.name || ''),
    price: product.price,
    image: isSafeImageUrl(product.image) ? product.image : '',
    category: String(product.category || ''),
    catId: String(product.catId || ''),
    dmType: String(product.dmType || 'whatsapp')
  };
  const existing = cart.find(item => item.id === safeProduct.id);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({
      id: safeProduct.id,
      name: safeProduct.name,
      price: safeProduct.price,
      numericPrice: parsePrice(safeProduct.price),
      image: safeProduct.image,
      category: safeProduct.category,
      catId: safeProduct.catId,
      dmType: safeProduct.dmType,
      qty: 1
    });
  }
  saveCart();
  updateCartBadge();
  renderCartItems();
  showAddedFeedback(safeProduct.id);
  console.log(`[CART] Added: ${safeProduct.name} (${getCartItemCount()} items total)`);
}

/* ─── REMOVE FROM CART ─── */
function removeFromCart(productId) {
  cart = cart.filter(item => item.id !== productId);
  saveCart();
  updateCartBadge();
  renderCartItems();
}

/* ─── UPDATE QUANTITY ─── */
function updateCartQuantity(productId, newQty) {
  const item = cart.find(i => i.id === productId);
  if (!item) return;
  if (newQty <= 0) {
    removeFromCart(productId);
    return;
  }
  item.qty = newQty;
  saveCart();
  updateCartBadge();
  renderCartItems();
}

/* ─── CLEAR CART ─── */
function clearCart() {
  cart = [];
  saveCart();
  updateCartBadge();
  renderCartItems();
}

/* ─── CART TOTALS ─── */
function getCartItemCount() {
  return cart.reduce((sum, item) => sum + item.qty, 0);
}

function getCartTotal() {
  return cart.reduce((sum, item) => sum + (item.numericPrice * item.qty), 0);
}

/* ─── UPDATE BADGE ─── */
function updateCartBadge() {
  const badge = document.getElementById('cart-badge');
  if (!badge) return;
  const count = getCartItemCount();
  badge.textContent = count;
  badge.style.display = count > 0 ? 'flex' : 'none';

  // Animate badge pop
  badge.classList.remove('cart-badge-pop');
  void badge.offsetWidth; // force reflow
  if (count > 0) badge.classList.add('cart-badge-pop');
}

/* ─── ADD-TO-CART FEEDBACK ANIMATION ─── */
function showAddedFeedback(productId) {
  // Flash the cart icon
  const cartIcon = document.getElementById('cart-nav-btn');
  if (cartIcon) {
    cartIcon.classList.add('cart-icon-pulse');
    setTimeout(() => cartIcon.classList.remove('cart-icon-pulse'), 600);
  }

  // Show a toast notification
  showCartToast();
}

function showCartToast() {
  const t = i18n[currentLang] || i18n.en;
  let toast = document.getElementById('cart-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'cart-toast';
    toast.className = 'cart-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = t.cart_added || '✓ Added to cart';
  toast.classList.remove('cart-toast-show');
  void toast.offsetWidth;
  toast.classList.add('cart-toast-show');
  setTimeout(() => toast.classList.remove('cart-toast-show'), 2000);
}

/* ─── TOGGLE DRAWER ─── */
function openCartDrawer() {
  const overlay = document.getElementById('cart-drawer-overlay');
  if (!overlay) return;
  renderCartItems();
  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeCartDrawer() {
  const overlay = document.getElementById('cart-drawer-overlay');
  if (!overlay) return;
  overlay.classList.remove('active');
  document.body.style.overflow = '';
}

function toggleCartDrawer() {
  const overlay = document.getElementById('cart-drawer-overlay');
  if (!overlay) return;
  if (overlay.classList.contains('active')) {
    closeCartDrawer();
  } else {
    openCartDrawer();
  }
}

/* ─── RENDER CART ITEMS ─── */
function renderCartItems() {
  const container = document.getElementById('cart-items-list');
  const emptyState = document.getElementById('cart-empty-state');
  const footerEl = document.getElementById('cart-drawer-footer');
  const totalEl = document.getElementById('cart-total-amount');
  const t = i18n[currentLang] || i18n.en;

  if (!container) return;

  if (cart.length === 0) {
    container.innerHTML = '';
    if (emptyState) emptyState.hidden = false;
    if (footerEl) footerEl.hidden = true;
    return;
  }

  if (emptyState) emptyState.hidden = true;
  if (footerEl) footerEl.hidden = false;

  let html = '';
  cart.forEach(item => {
    const safeId = escapeHtml(item.id);
    const safeName = escapeHtml(item.name);
    const safeCategory = escapeHtml(item.category);
    const safePrice = escapeHtml(item.price);
    const safeQty = Math.max(1, Math.floor(Number(item.qty) || 1));
    const safeImage = isSafeImageUrl(item.image) ? escapeHtml(item.image) : '';
    const removeTitle = escapeHtml(t.cart_remove || 'Remove');

    const imgHTML = safeImage
      ? `<img src="${safeImage}" alt="${safeName}" class="cart-item-img">`
      : `<div class="cart-item-img-placeholder">✦</div>`;

    html += `
      <div class="cart-item" data-cart-id="${safeId}" data-cart-qty="${safeQty}">
        <div class="cart-item-image">
          ${imgHTML}
        </div>
        <div class="cart-item-details">
          <p class="cart-item-category">${safeCategory}</p>
          <h4 class="cart-item-name">${safeName}</h4>
          <p class="cart-item-price">${safePrice} THB</p>
          <div class="cart-item-qty-controls">
            <button type="button" class="cart-qty-btn cart-qty-minus" aria-label="Decrease quantity">−</button>
            <span class="cart-qty-value">${safeQty}</span>
            <button type="button" class="cart-qty-btn cart-qty-plus" aria-label="Increase quantity">+</button>
          </div>
        </div>
        <button type="button" class="cart-item-remove" title="${removeTitle}" aria-label="${removeTitle}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>
    `;
  });

  container.innerHTML = html;

  // Update total
  if (totalEl) {
    const total = getCartTotal();
    totalEl.textContent = `฿ ${total.toLocaleString()}`;
  }
}

/* ─── GENERATE ORDER MESSAGE ─── */
function generateOrderMessage() {
  const t = i18n[currentLang] || i18n.en;
  const isThaiOrDefault = currentLang === 'th';
  const lines = [];

  if (isThaiOrDefault) {
    lines.push('🛒 สวัสดีค่ะ สนใจสั่งซื้อสินค้าดังนี้:');
  } else {
    lines.push('🛒 Hello, I would like to order:');
  }
  lines.push('');

  cart.forEach((item, idx) => {
    lines.push(`${idx + 1}. ${item.name} (${item.id})`);
    lines.push(`   ${isThaiOrDefault ? 'จำนวน' : 'Qty'}: ${item.qty} | ${isThaiOrDefault ? 'ราคา' : 'Price'}: ${item.price} THB`);
  });

  lines.push('');
  const total = getCartTotal();
  lines.push(`${isThaiOrDefault ? '💰 ยอดรวมโดยประมาณ' : '💰 Estimated Total'}: ฿ ${total.toLocaleString()}`);
  lines.push('');
  lines.push(isThaiOrDefault ? 'ขอบคุณค่ะ 🌿' : 'Thank you 🌿');

  return lines.join('\n');
}

/* ─── CHECKOUT HANDLERS ─── */
function checkoutWhatsApp() {
  if (cart.length === 0) return;
  const msg = generateOrderMessage();
  const url = `https://wa.me/66645195663?text=${encodeURIComponent(msg)}`;
  window.open(url, '_blank');
}

function checkoutLine() {
  if (cart.length === 0) return;
  // Line OA doesn't support pre-filled messages via URL, just open the chat
  window.open('https://line.me/ti/p/~@sweetgypsy', '_blank');
}

/* ─── CART ITEM ACTIONS (event delegation) ─── */
let _cartActionsDelegated = false;
function initCartActions() {
  if (_cartActionsDelegated) return;
  _cartActionsDelegated = true;

  const container = document.getElementById('cart-items-list');
  if (!container) return;

  container.addEventListener('click', (e) => {
    const itemEl = e.target.closest('.cart-item');
    if (!itemEl) return;

    const productId = itemEl.dataset.cartId;
    const qty = parseInt(itemEl.dataset.cartQty, 10) || 1;

    if (e.target.closest('.cart-qty-minus')) {
      updateCartQuantity(productId, qty - 1);
      return;
    }
    if (e.target.closest('.cart-qty-plus')) {
      updateCartQuantity(productId, qty + 1);
      return;
    }
    if (e.target.closest('.cart-item-remove')) {
      removeFromCart(productId);
    }
  });
}

/* ─── INIT CART ─── */
function initCart() {
  loadCart();
  updateCartBadge();
  initCartActions();

  // Cart nav button
  const cartBtn = document.getElementById('cart-nav-btn');
  if (cartBtn) {
    cartBtn.addEventListener('click', (e) => {
      e.preventDefault();
      toggleCartDrawer();
    });
  }

  // Cart drawer close button
  const closeBtn = document.getElementById('cart-drawer-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeCartDrawer);
  }

  // Cart drawer overlay click to close
  const overlay = document.getElementById('cart-drawer-overlay');
  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeCartDrawer();
    });
  }

  // Clear cart button
  const clearBtn = document.getElementById('cart-clear-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      clearCart();
    });
  }

  // Checkout buttons
  const waCheckout = document.getElementById('cart-checkout-wa');
  if (waCheckout) {
    waCheckout.addEventListener('click', checkoutWhatsApp);
  }

  const lineCheckout = document.getElementById('cart-checkout-line');
  if (lineCheckout) {
    lineCheckout.addEventListener('click', checkoutLine);
  }

  // ESC key to close drawer
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const overlay = document.getElementById('cart-drawer-overlay');
      if (overlay && overlay.classList.contains('active')) {
        closeCartDrawer();
      }
    }
  });

  console.log(`[CART] ✓ Initialized (${getCartItemCount()} items in cart)`);
}

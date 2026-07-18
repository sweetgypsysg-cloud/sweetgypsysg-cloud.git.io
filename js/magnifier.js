/* ============================================================
   Sweet Gypsy Design — Image Zoom (Click-to-Zoom & Scroll-Zoom)
   Depends on: modal.js (called after image render)

   How it works:
   1. Click 🔍 button → zoom in, enter zoom mode
   2. Scroll mouse wheel → zoom in/out (1x to 5x)
   3. Drag to pan around the zoomed image
   4. Click 🔍 again → reset to normal
   ============================================================ */

let _zoomCleanup = null;
let _zoomActive = false;

const ZOOM_MIN = 1;
const ZOOM_MAX = 5;
const ZOOM_DEFAULT = 3;
const ZOOM_STEP = 0.3;

/**
 * Initialize zoom on the current modal image.
 * @param {HTMLImageElement} img — The target image element
 */
function initImageMagnifier(img) {
  // Clean up previous instance
  if (_zoomCleanup) {
    _zoomCleanup();
    _zoomCleanup = null;
  }

  const toggleBtn = document.getElementById('magnifier-toggle-btn');
  const btnGroup = document.getElementById('magnifier-btn-group');
  const wrapper = document.getElementById('modal-img-wrapper');
  if (!img || !wrapper) return;

  // State
  _zoomActive = false;
  let currentZoom = ZOOM_DEFAULT;
  let panX = 0, panY = 0;
  let isDragging = false;
  let startX = 0, startY = 0;
  let startPanX = 0, startPanY = 0;

  // Reset UI
  wrapper.classList.remove('zoom-active');
  if (toggleBtn) toggleBtn.classList.remove('active');
  if (btnGroup) btnGroup.classList.remove('active');
  img.style.transform = '';
  img.style.transformOrigin = 'center center';

  /* ─── Apply transform ─── */
  function applyTransform(smooth) {
    if (smooth) {
      img.classList.add('zoom-transitioning');
      setTimeout(() => img.classList.remove('zoom-transitioning'), 160);
    }

    if (_zoomActive) {
      img.style.transform = `scale(${currentZoom}) translate(${panX}px, ${panY}px)`;
    } else {
      img.style.transform = '';
    }
  }

  /* ─── Clamp pan so image stays in bounds ─── */
  function clampPan() {
    const wrapperRect = wrapper.getBoundingClientRect();
    const maxPanX = (wrapperRect.width * (currentZoom - 1)) / (2 * currentZoom);
    const maxPanY = (wrapperRect.height * (currentZoom - 1)) / (2 * currentZoom);

    panX = Math.max(-maxPanX, Math.min(maxPanX, panX));
    panY = Math.max(-maxPanY, Math.min(maxPanY, panY));
  }

  /* ─── Toggle zoom ON/OFF ─── */
  function toggleZoom() {
    _zoomActive = !_zoomActive;

    if (_zoomActive) {
      currentZoom = ZOOM_DEFAULT;
      panX = 0;
      panY = 0;
      wrapper.classList.add('zoom-active');
      if (toggleBtn) toggleBtn.classList.add('active');
      if (btnGroup) btnGroup.classList.add('active');
      applyTransform(true);
    } else {
      wrapper.classList.remove('zoom-active');
      if (toggleBtn) toggleBtn.classList.remove('active');
      if (btnGroup) btnGroup.classList.remove('active');
      img.style.transform = '';
      currentZoom = ZOOM_DEFAULT;
      // Re-apply slider position
      if (typeof updateModalSlider === 'function') {
        updateModalSlider();
      }
    }
  }

  /* ─── Mouse drag to pan ─── */
  function onMouseDown(e) {
    if (!_zoomActive) return;
    if (e.target.closest('.magnifier-toggle-btn') || e.target.closest('.magnifier-btn-group')) return;
    e.preventDefault();
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    startPanX = panX;
    startPanY = panY;
  }

  function onMouseMove(e) {
    if (!_zoomActive || !isDragging) return;
    e.preventDefault();
    const dx = (e.clientX - startX) / currentZoom;
    const dy = (e.clientY - startY) / currentZoom;
    panX = startPanX + dx;
    panY = startPanY + dy;
    clampPan();
    applyTransform(false);
  }

  function onMouseUp() {
    isDragging = false;
  }

  /* ─── Touch drag to pan ─── */
  function onTouchStart(e) {
    if (!_zoomActive) return;
    if (e.touches.length === 1) {
      isDragging = true;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      startPanX = panX;
      startPanY = panY;
    }
  }

  function onTouchMove(e) {
    if (!_zoomActive || !isDragging) return;
    e.preventDefault();
    const dx = (e.touches[0].clientX - startX) / currentZoom;
    const dy = (e.touches[0].clientY - startY) / currentZoom;
    panX = startPanX + dx;
    panY = startPanY + dy;
    clampPan();
    applyTransform(false);
  }

  function onTouchEnd() {
    isDragging = false;
  }

  /* ─── Scroll wheel to ZOOM IN/OUT ─── */
  function onWheel(e) {
    if (!_zoomActive) return;
    e.preventDefault();

    // Scroll up = zoom in, scroll down = zoom out
    const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
    const prevZoom = currentZoom;
    currentZoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, currentZoom + delta));

    // Adjust pan to keep the zoom centered
    if (prevZoom !== currentZoom) {
      panX = panX * (currentZoom / prevZoom);
      panY = panY * (currentZoom / prevZoom);
      clampPan();
      applyTransform(true);
    }

    // If zoomed back to 1x, exit zoom mode
    if (currentZoom <= ZOOM_MIN) {
      _zoomActive = false;
      wrapper.classList.remove('zoom-active');
      if (toggleBtn) toggleBtn.classList.remove('active');
      if (btnGroup) btnGroup.classList.remove('active');
      img.style.transform = '';
      if (typeof updateModalSlider === 'function') {
        updateModalSlider();
      }
    }
  }

  /* ─── Bind events ─── */
  if (toggleBtn) toggleBtn.addEventListener('click', toggleZoom);

  // Mouse pan
  wrapper.addEventListener('mousedown', onMouseDown);
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);

  // Touch pan
  wrapper.addEventListener('touchstart', onTouchStart, { passive: true });
  wrapper.addEventListener('touchmove', onTouchMove, { passive: false });
  wrapper.addEventListener('touchend', onTouchEnd);

  // Scroll zoom
  wrapper.addEventListener('wheel', onWheel, { passive: false });

  /* ─── Cleanup ─── */
  _zoomCleanup = function () {
    if (toggleBtn) toggleBtn.removeEventListener('click', toggleZoom);
    wrapper.removeEventListener('mousedown', onMouseDown);
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
    wrapper.removeEventListener('touchstart', onTouchStart);
    wrapper.removeEventListener('touchmove', onTouchMove);
    wrapper.removeEventListener('touchend', onTouchEnd);
    wrapper.removeEventListener('wheel', onWheel);
    wrapper.classList.remove('zoom-active');
    if (toggleBtn) toggleBtn.classList.remove('active');
    if (btnGroup) btnGroup.classList.remove('active');
    img.style.transform = '';
    _zoomActive = false;
    isDragging = false;
  };
}

/**
 * Activate zoom on the currently visible modal slide image.
 * Called by modal.js after image render and on slide change.
 */
function activateModalMagnifier() {
  const wrapper = document.getElementById('modal-img-wrapper');
  if (!wrapper) return;

  const images = wrapper.querySelectorAll('.modal-product-img');
  const currentImg = images[currentModalSlide] || images[0];

  if (currentImg) {
    requestAnimationFrame(() => {
      initImageMagnifier(currentImg);
    });
  }
}

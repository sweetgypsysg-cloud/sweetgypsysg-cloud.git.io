/* ============================================================
   Sweet Gypsy Design — Security Utilities
   Shared helpers for output encoding and URL validation
   ============================================================ */

function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const ALLOWED_IMAGE_HOSTS = [
  'res.cloudinary.com',
  'lh3.googleusercontent.com',
  'drive.google.com'
];

function isSafeImageUrl(url) {
  if (!url || typeof url !== 'string') return false;
  if (url.startsWith('data:image/')) return true;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return false;
    return ALLOWED_IMAGE_HOSTS.some(
      host => parsed.hostname === host || parsed.hostname.endsWith('.' + host)
    );
  } catch {
    return false;
  }
}

function sanitizeProductId(id) {
  if (!id) return '';
  return String(id).replace(/[^a-zA-Z0-9._-]/g, '');
}

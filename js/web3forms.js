/* ============================================================
   Web3Forms Order Form Handler
   Sweet Gypsy Design — drop-in snippet
   ============================================================

   HOW TO USE:
   1. Include this file via <script src="js/web3forms.js"></script>
      after other JS files in your HTML.
   2. Ensure your <form> has id="contactForm" (or change line 22).
   3. Ensure your HTML has:
      - <div id="form-status-msg" class="form-status-msg"></div>
      - <div id="form-success-panel" class="form-success-panel">…</div>
      - <button id="btn-send-another">…</button>
   ============================================================ */

document.addEventListener('DOMContentLoaded', function () {

  // ─────────────────────────────────────────────────────
  // ⬇️ CHANGE THIS: Replace 'contactForm' with your
  //    HTML form's id attribute if different.
  // ─────────────────────────────────────────────────────
  var form = document.getElementById('contactForm');

  // Grab UI elements
  var statusMsg = document.getElementById('form-status-msg');
  var successPanel = document.getElementById('form-success-panel');
  var submitBtn = document.getElementById('btn-submit');
  var sendAnother = document.getElementById('btn-send-another');

  // Safety check — exit silently if the form doesn't exist on the page
  if (!form) {
    console.warn('[Web3Forms] No form found. Skipping handler setup.');
    return;
  }

  // ── Helper: Show inline status message ──
  function showStatus(type, message) {
    if (!statusMsg) return;
    statusMsg.textContent = message;
    statusMsg.className = 'form-status-msg visible ' + type; // 'success' or 'error'
  }

  function hideStatus() {
    if (!statusMsg) return;
    statusMsg.className = 'form-status-msg';
    statusMsg.textContent = '';
  }

  // ── Helper: Toggle between form and success panel ──
  function showSuccessPanel() {
    form.style.display = 'none';
    if (successPanel) {
      successPanel.classList.add('visible');
    }
  }

  function showForm() {
    if (successPanel) {
      successPanel.classList.remove('visible');
    }
    form.style.display = '';
    hideStatus();
  }

  // ── "Send Another Message" button ──
  if (sendAnother) {
    sendAnother.addEventListener('click', function () {
      showForm();
    });
  }

  // ── Form submit handler ──
  form.addEventListener('submit', function (e) {
    // Step 1: Prevent page reload (critical for GitHub Pages)
    e.preventDefault();

    // Step 2: Check hCaptcha (skip gracefully if widget didn't load)
    var hCaptchaInput = this.querySelector('[name="h-captcha-response"]');
    if (hCaptchaInput && !hCaptchaInput.value) {
      // Captcha widget IS on the page but user hasn't completed it
      showStatus('error', 'Please complete the captcha verification before submitting.');
      return;
    }

    // Step 3: Disable submit button to prevent double-clicks
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.dataset.originalText = submitBtn.innerHTML;
      submitBtn.innerHTML = 'Sending…';
    }
    hideStatus();

    // Step 4: Build JSON payload (Web3Forms recommended format)
    var payload = {
      access_key: '5a80bf1a-b8c4-4432-a36a-a2ea9b21797f'
    };

    // Collect all form fields
    var formData = new FormData(this);
    formData.forEach(function (value, key) {
      if (key !== 'botcheck' || value) {
        payload[key] = value;
      }
    });

    // Include hCaptcha token if available
    if (hCaptchaInput && hCaptchaInput.value) {
      payload['h-captcha-response'] = hCaptchaInput.value;
    }

    console.log('[Web3Forms] Submitting payload…', Object.keys(payload));

    // Step 5: Send to Web3Forms as JSON
    fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    })
      .then(function (response) {
        return response.json();
      })
      .then(function (data) {
        console.log('[Web3Forms] Response:', data);
        if (data.success) {
          // ── Success: show the success panel ──
          form.reset();
          if (typeof hcaptcha !== 'undefined') {
            hcaptcha.reset();
          }
          showSuccessPanel();
        } else {
          // Server responded but indicated failure — show actual API message
          console.error('[Web3Forms] Submission failed:', data);
          var apiMsg = data.message || 'Unknown error';
          showStatus('error',
            'Web3Forms: ' + apiMsg
          );
        }
      })
      .catch(function (error) {
        console.error('[Web3Forms] Network error:', error);
        showStatus('error',
          'A network error occurred. ' +
          'Please check your internet connection and try again.'
        );
      })
      .finally(function () {
        // Re-enable submit button
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = submitBtn.dataset.originalText || 'Send';
        }
      });
  });

});

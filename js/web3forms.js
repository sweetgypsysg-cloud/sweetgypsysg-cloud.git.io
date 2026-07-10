/* ============================================================
   Web3Forms Order Form Handler
   Sweet Gypsy Design — drop-in snippet
   ============================================================ */

document.addEventListener('DOMContentLoaded', function () {
  var form = document.getElementById('contactForm');

  var statusMsg = document.getElementById('form-status-msg');
  var successPanel = document.getElementById('form-success-panel');
  var submitBtn = document.getElementById('btn-submit');
  var sendAnother = document.getElementById('btn-send-another');

  if (!form) {
    return;
  }

  var MAX_MSGS = 3;
  var TIME_FRAME = 24 * 60 * 60 * 1000;
  var RATE_LIMIT_KEY = 'contactFormHistory';

  function checkRateLimit() {
    var history = JSON.parse(localStorage.getItem(RATE_LIMIT_KEY) || '[]');
    var now = Date.now();
    var recent = history.filter(function (time) { return now - time < TIME_FRAME; });
    return recent.length < MAX_MSGS;
  }

  function recordSubmission() {
    var history = JSON.parse(localStorage.getItem(RATE_LIMIT_KEY) || '[]');
    var now = Date.now();
    var recent = history.filter(function (time) { return now - time < TIME_FRAME; });
    recent.push(now);
    localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(recent));
  }

  function showStatus(type, message) {
    if (!statusMsg) return;
    statusMsg.textContent = message;
    statusMsg.className = 'form-status-msg visible ' + type;
  }

  function hideStatus() {
    if (!statusMsg) return;
    statusMsg.className = 'form-status-msg';
    statusMsg.textContent = '';
  }

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

  if (sendAnother) {
    sendAnother.addEventListener('click', function () {
      showForm();
    });
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var botcheck = this.querySelector('[name="botcheck"]');
    if (botcheck && botcheck.value) {
      showSuccessPanel();
      return;
    }

    var captchaRequired = !!this.querySelector('.h-captcha[data-captcha]');
    var hCaptchaInput = this.querySelector('[name="h-captcha-response"]');

    if (captchaRequired) {
      if (!hCaptchaInput || !hCaptchaInput.value) {
        showStatus('error', 'Please complete the captcha verification before submitting.');
        return;
      }
    }

    if (!checkRateLimit()) {
      showStatus('error', 'You have reached the daily limit for sending messages. Please try again tomorrow.');
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.dataset.originalText = submitBtn.innerHTML;
      submitBtn.innerHTML = 'Sending…';
    }
    hideStatus();

    var payload = {
      access_key: SITE_CONFIG.web3formsAccessKey
    };

    var formData = new FormData(this);
    formData.forEach(function (value, key) {
      if (key !== 'botcheck' || value) {
        payload[key] = value;
      }
    });

    if (hCaptchaInput && hCaptchaInput.value) {
      payload['h-captcha-response'] = hCaptchaInput.value;
    }

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
        if (data.success) {
          form.reset();
          if (typeof hcaptcha !== 'undefined') {
            hcaptcha.reset();
          }
          recordSubmission();
          showSuccessPanel();
        } else {
          var apiMsg = data.message || 'Unknown error';
          showStatus('error', 'Web3Forms: ' + apiMsg);
        }
      })
      .catch(function () {
        showStatus('error',
          'A network error occurred. ' +
          'Please check your internet connection and try again.'
        );
      })
      .finally(function () {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = submitBtn.dataset.originalText || 'Send';
        }
      });
  });
});

/**
 * ============================================================
 * NURSE MANAGEMENT SYSTEM — Admin Login Logic
 * File: login.js
 * Description: Handles form validation, password toggle,
 *              ripple effects, modal, and login submission.
 *              Pure vanilla JavaScript — no libraries.
 * ============================================================
 */

'use strict';

/* ============================================================
   CONFIGURATION
   ============================================================ */
const CONFIG = {
  // Validation rules
  MIN_PASSWORD_LENGTH: 6,

  // Toast duration in ms
  TOAST_DURATION: 3500,

  // LocalStorage keys
  STORAGE_REMEMBER: 'nms_remember_email',
};

/* Email regex: RFC 5322 simplified */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


/* ============================================================
   DOM REFERENCES
   ============================================================ */
const dom = {
  loginForm:          document.getElementById('loginForm'),
  emailInput:         document.getElementById('emailInput'),
  emailGroup:         document.getElementById('emailGroup'),
  emailError:         document.getElementById('emailError'),
  passwordInput:      document.getElementById('passwordInput'),
  passwordGroup:      document.getElementById('passwordGroup'),
  passwordError:      document.getElementById('passwordError'),
  togglePassword:     document.getElementById('togglePassword'),
  rememberMe:         document.getElementById('rememberMe'),
  forgotPasswordLink: document.getElementById('forgotPasswordLink'),
  loginBtn:           document.getElementById('loginBtn'),
  loginCard:          document.getElementById('loginCard'),

  // Modal
  forgotModal:        document.getElementById('forgotModal'),
  modalClose:         document.getElementById('modalClose'),
  resetEmail:         document.getElementById('resetEmail'),
  resetEmailError:    document.getElementById('resetEmailError'),
  resetBtn:           document.getElementById('resetBtn'),
  resetSuccess:       document.getElementById('resetSuccess'),

  // Toast
  toast:              document.getElementById('toast'),
};


/* ============================================================
   UTILITY FUNCTIONS
   ============================================================ */

/**
 * Shows a toast notification.
 * @param {string} message   - The message to display.
 * @param {'success'|'error'|'default'} type - Toast variant.
 */
function showToast(message, type = 'default') {
  const { toast } = dom;
  toast.textContent = message;
  toast.className = 'toast'; // reset classes

  if (type === 'success') toast.classList.add('toast-success');
  if (type === 'error')   toast.classList.add('toast-error');

  // Force reflow so transition replays
  void toast.offsetWidth;
  toast.classList.add('is-visible');

  clearTimeout(dom.toast._timer);
  dom.toast._timer = setTimeout(() => {
    toast.classList.remove('is-visible');
  }, CONFIG.TOAST_DURATION);
}

/**
 * Sets a form group to error state.
 * @param {HTMLElement} group   - The .form-group element.
 * @param {HTMLElement} errorEl - The .form-error element.
 * @param {string}      message - Error message to display.
 */
function setFieldError(group, errorEl, message) {
  group.classList.add('has-error');
  group.classList.remove('is-valid');
  errorEl.textContent = message;
}

/**
 * Clears error state from a form group.
 * @param {HTMLElement} group   - The .form-group element.
 * @param {HTMLElement} errorEl - The .form-error element.
 */
function clearFieldError(group, errorEl) {
  group.classList.remove('has-error');
  errorEl.textContent = '';
}

/**
 * Sets a form group to valid state.
 * @param {HTMLElement} group   - The .form-group element.
 * @param {HTMLElement} errorEl - The .form-error element.
 */
function setFieldValid(group, errorEl) {
  clearFieldError(group, errorEl);
  group.classList.add('is-valid');
}

/**
 * Triggers a shake animation on the target element.
 * @param {HTMLElement} el
 */
function shakeElement(el) {
  el.classList.remove('shake');
  void el.offsetWidth; // reflow
  el.classList.add('shake');
  el.addEventListener('animationend', () => el.classList.remove('shake'), { once: true });
}

/**
 * Creates a ripple effect at the click position inside a button.
 * @param {MouseEvent}  e
 * @param {HTMLElement} btn
 */
function createRipple(e, btn) {
  const container = btn.querySelector('.ripple-container');
  if (!container) return;

  const rect   = btn.getBoundingClientRect();
  const size   = Math.max(rect.width, rect.height) * 2;
  const x      = e.clientX - rect.left - size / 2;
  const y      = e.clientY - rect.top  - size / 2;

  const ripple = document.createElement('span');
  ripple.className = 'ripple';
  ripple.style.cssText = `width:${size}px;height:${size}px;left:${x}px;top:${y}px;`;

  container.appendChild(ripple);
  ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
}


/* ============================================================
   VALIDATION
   ============================================================ */

/**
 * Validates the email input field.
 * @returns {boolean} True if valid.
 */
function validateEmail() {
  const val = dom.emailInput.value.trim();

  if (!val) {
    setFieldError(dom.emailGroup, dom.emailError, 'Email address is required.');
    return false;
  }

  if (!EMAIL_REGEX.test(val)) {
    setFieldError(dom.emailGroup, dom.emailError, 'Please enter a valid email address.');
    return false;
  }

  setFieldValid(dom.emailGroup, dom.emailError);
  return true;
}

/**
 * Validates the password input field.
 * @returns {boolean} True if valid.
 */
function validatePassword() {
  const val = dom.passwordInput.value;

  if (!val) {
    setFieldError(dom.passwordGroup, dom.passwordError, 'Password is required.');
    return false;
  }

  if (val.length < CONFIG.MIN_PASSWORD_LENGTH) {
    setFieldError(
      dom.passwordGroup,
      dom.passwordError,
      `Password must be at least ${CONFIG.MIN_PASSWORD_LENGTH} characters.`
    );
    return false;
  }

  setFieldValid(dom.passwordGroup, dom.passwordError);
  return true;
}

/**
 * Validates the reset email in the modal.
 * @returns {boolean} True if valid.
 */
function validateResetEmail() {
  const val = dom.resetEmail.value.trim();

  if (!val) {
    dom.resetEmailError.textContent = 'Please enter your email address.';
    return false;
  }

  if (!EMAIL_REGEX.test(val)) {
    dom.resetEmailError.textContent = 'Please enter a valid email address.';
    return false;
  }

  dom.resetEmailError.textContent = '';
  return true;
}


/* ============================================================
   LOGIN SUBMISSION
   ============================================================ */

/**
 * Simulates an async authentication request.
 * Replace this with a real fetch() call in production.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{success: boolean, message: string}>}
 */
async function authenticateUser(email, password) {
  try {
    const result = await api.post('/auth/admin/login', { email, password });
    return { success: true, message: `Welcome back, ${result.fullName}! Redirecting…` };
  } catch (err) {
    return { success: false, message: err.message || 'Invalid email or password. Please try again.' };
  }
}

/**
 * Handles the login form submission.
 * @param {SubmitEvent} e
 */
async function handleLoginSubmit(e) {
  e.preventDefault();

  // Run both validations
  const emailOk    = validateEmail();
  const passwordOk = validatePassword();

  if (!emailOk || !passwordOk) {
    shakeElement(dom.loginCard);
    return;
  }

  // Show loading state
  dom.loginBtn.classList.add('is-loading');
  dom.loginBtn.disabled = true;

  const email    = dom.emailInput.value.trim();
  const password = dom.passwordInput.value;

  // Handle "Remember Me"
  if (dom.rememberMe.checked) {
    localStorage.setItem(CONFIG.STORAGE_REMEMBER, email);
  } else {
    localStorage.removeItem(CONFIG.STORAGE_REMEMBER);
  }

  try {
    const result = await authenticateUser(email, password);

    if (result.success) {
      showToast('✓ ' + result.message, 'success');

      // Redirect to dashboard after 2 seconds
      setTimeout(() => { window.location.href = 'dashboard.html'; }, 2000);
    } else {
      showToast('✗ ' + result.message, 'error');
      shakeElement(dom.loginCard);

      // Highlight password field as incorrect
      setFieldError(dom.passwordGroup, dom.passwordError, 'Incorrect email or password.');
    }
  } catch (err) {
    showToast('Network error. Please try again.', 'error');
    console.error('[Login] Auth error:', err);
  } finally {
    dom.loginBtn.classList.remove('is-loading');
    dom.loginBtn.disabled = false;
  }
}


/* ============================================================
   PASSWORD TOGGLE
   ============================================================ */

/**
 * Toggles the password field visibility.
 */
function handlePasswordToggle() {
  const isVisible = dom.passwordInput.type === 'text';
  dom.passwordInput.type = isVisible ? 'password' : 'text';

  dom.togglePassword.setAttribute('aria-pressed', String(!isVisible));
  dom.togglePassword.setAttribute(
    'aria-label',
    isVisible ? 'Show password' : 'Hide password'
  );
}


/* ============================================================
   FORGOT PASSWORD MODAL
   ============================================================ */

/**
 * Opens the forgot-password modal.
 */
function openForgotModal() {
  dom.forgotModal.removeAttribute('hidden');
  document.body.style.overflow = 'hidden'; // prevent background scroll
  dom.resetEmail.value         = '';
  dom.resetEmailError.textContent = '';
  dom.resetSuccess.setAttribute('hidden', '');
  dom.resetEmail.focus();
}

/**
 * Closes the forgot-password modal.
 */
function closeForgotModal() {
  dom.forgotModal.setAttribute('hidden', '');
  document.body.style.overflow = '';
}

/**
 * Handles the password reset request.
 */
function handleResetSubmit(e) {
  createRipple(e, dom.resetBtn);

  if (!validateResetEmail()) return;

  // Simulate sending reset email
  dom.resetBtn.classList.add('is-loading');
  dom.resetBtn.disabled = true;

  setTimeout(() => {
    dom.resetBtn.classList.remove('is-loading');
    dom.resetBtn.disabled = false;
    dom.resetSuccess.removeAttribute('hidden');
    showToast('Reset link sent to your email.', 'success');
  }, 1500);
}


/* ============================================================
   INLINE VALIDATION (Real-time feedback on blur)
   ============================================================ */

function handleEmailBlur() {
  if (dom.emailInput.value.trim()) validateEmail();
}

function handlePasswordBlur() {
  if (dom.passwordInput.value) validatePassword();
}

/** Clear errors as user starts typing again */
function handleEmailInput() {
  if (dom.emailGroup.classList.contains('has-error')) {
    clearFieldError(dom.emailGroup, dom.emailError);
  }
}

function handlePasswordInput() {
  if (dom.passwordGroup.classList.contains('has-error')) {
    clearFieldError(dom.passwordGroup, dom.passwordError);
  }
}


/* ============================================================
   RIPPLE ON LOGIN BUTTON
   ============================================================ */
function handleLoginBtnClick(e) {
  createRipple(e, dom.loginBtn);
}


/* ============================================================
   REMEMBER ME — Restore saved email on page load
   ============================================================ */
function restoreSavedEmail() {
  const savedEmail = localStorage.getItem(CONFIG.STORAGE_REMEMBER);
  if (savedEmail) {
    dom.emailInput.value   = savedEmail;
    dom.rememberMe.checked = true;
    // Visually show the valid state
    setFieldValid(dom.emailGroup, dom.emailError);
  }
}


/* ============================================================
   KEYBOARD ACCESSIBILITY
   ============================================================ */

/**
 * Close modal on Escape key press.
 * @param {KeyboardEvent} e
 */
function handleKeyDown(e) {
  if (e.key === 'Escape') {
    if (!dom.forgotModal.hasAttribute('hidden')) {
      closeForgotModal();
    }
  }
}

/**
 * Trap focus inside the modal when open.
 * @param {KeyboardEvent} e
 */
function handleModalKeyDown(e) {
  if (e.key !== 'Tab') return;

  const focusable = dom.forgotModal.querySelectorAll(
    'button, input, [tabindex]:not([tabindex="-1"])'
  );
  const first = focusable[0];
  const last  = focusable[focusable.length - 1];

  if (e.shiftKey) {
    if (document.activeElement === first) {
      e.preventDefault();
      last.focus();
    }
  } else {
    if (document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
}

/**
 * Close modal when clicking on the overlay (outside the card).
 * @param {MouseEvent} e
 */
function handleOverlayClick(e) {
  if (e.target === dom.forgotModal) closeForgotModal();
}


/* ============================================================
   INITIALISATION
   ============================================================ */

/**
 * Bootstraps all event listeners.
 */
function init() {
  /* Form submission */
  dom.loginForm.addEventListener('submit', handleLoginSubmit);

  /* Login button click → ripple */
  dom.loginBtn.addEventListener('click', handleLoginBtnClick);

  /* Password toggle */
  dom.togglePassword.addEventListener('click', handlePasswordToggle);

  /* Real-time / blur validation */
  dom.emailInput.addEventListener('blur',  handleEmailBlur);
  dom.emailInput.addEventListener('input', handleEmailInput);
  dom.passwordInput.addEventListener('blur',  handlePasswordBlur);
  dom.passwordInput.addEventListener('input', handlePasswordInput);

  /* Forgot password modal */
  dom.forgotPasswordLink.addEventListener('click', (e) => {
    e.preventDefault();
    openForgotModal();
  });

  dom.modalClose.addEventListener('click', closeForgotModal);
  dom.resetBtn.addEventListener('click', handleResetSubmit);

  /* Modal accessibility */
  dom.forgotModal.addEventListener('click',   handleOverlayClick);
  dom.forgotModal.addEventListener('keydown', handleModalKeyDown);
  document.addEventListener('keydown',        handleKeyDown);

  /* Restore remembered email */
  restoreSavedEmail();

  console.info(
    '%c[NMS] Admin login module initialised.',
    'color: #E91E63; font-weight: bold;'
  );
}

/* Run when DOM is ready */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

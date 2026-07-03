/**
 * ============================================================
 * NURSE MANAGEMENT SYSTEM — Member Sign Up Logic
 * File: member-signup.js
 * Front-end only for now: validates the form and stores the
 * new member account in localStorage ("nms_member_accounts")
 * so member-login.js can authenticate against it. Will be
 * replaced by real Firebase/Java backend auth later.
 * ============================================================ */

'use strict';

const CONFIG = {
  MIN_PASSWORD_LENGTH: 6,
  TOAST_DURATION: 3500,
  STORAGE_REMEMBER: 'nms_remember_email',
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[0-9]{10,15}$/;

const dom = {
  form:                document.getElementById('signupForm'),

  fullName:            document.getElementById('fullNameInput'),
  fullNameGroup:       document.getElementById('fullNameGroup'),
  fullNameError:       document.getElementById('fullNameError'),

  email:               document.getElementById('emailInput'),
  emailGroup:          document.getElementById('emailGroup'),
  emailError:          document.getElementById('emailError'),

  phone:               document.getElementById('phoneInput'),
  phoneGroup:          document.getElementById('phoneGroup'),
  phoneError:          document.getElementById('phoneError'),

  password:            document.getElementById('passwordInput'),
  passwordGroup:       document.getElementById('passwordGroup'),
  passwordError:       document.getElementById('passwordError'),
  togglePassword:      document.getElementById('togglePassword'),

  confirmPassword:     document.getElementById('confirmPasswordInput'),
  confirmPasswordGroup:document.getElementById('confirmPasswordGroup'),
  confirmPasswordError:document.getElementById('confirmPasswordError'),
  toggleConfirmPassword:document.getElementById('toggleConfirmPassword'),

  signupBtn:           document.getElementById('signupBtn'),
  loginCard:           document.getElementById('loginCard'),
  toast:               document.getElementById('toast'),
};


/* ============================================================
   UTILITIES
   ============================================================ */
function showToast(message, type = 'default') {
  const { toast } = dom;
  toast.textContent = message;
  toast.className = 'toast';
  if (type === 'success') toast.classList.add('toast-success');
  if (type === 'error') toast.classList.add('toast-error');

  void toast.offsetWidth;
  toast.classList.add('is-visible');

  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('is-visible'), CONFIG.TOAST_DURATION);
}

function shakeElement(el) {
  el.classList.remove('shake');
  void el.offsetWidth;
  el.classList.add('shake');
  el.addEventListener('animationend', () => el.classList.remove('shake'), { once: true });
}

function setFieldError(group, errorEl, message) {
  group.classList.add('has-error');
  group.classList.remove('is-valid');
  errorEl.textContent = message;
}

function clearFieldError(group, errorEl) {
  group.classList.remove('has-error');
  errorEl.textContent = '';
}

function setFieldValid(group, errorEl) {
  clearFieldError(group, errorEl);
  group.classList.add('is-valid');
}

function createRipple(e, btn) {
  const container = btn.querySelector('.ripple-container');
  if (!container) return;

  const rect = btn.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height) * 2;
  const x = e.clientX - rect.left - size / 2;
  const y = e.clientY - rect.top - size / 2;

  const ripple = document.createElement('span');
  ripple.className = 'ripple';
  ripple.style.cssText = `width:${size}px;height:${size}px;left:${x}px;top:${y}px;`;

  container.appendChild(ripple);
  ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
}

/* ============================================================
   VALIDATION
   ============================================================ */
function validateFullName() {
  const val = dom.fullName.value.trim();
  if (!val) {
    setFieldError(dom.fullNameGroup, dom.fullNameError, 'Full name is required.');
    return false;
  }
  setFieldValid(dom.fullNameGroup, dom.fullNameError);
  return true;
}

function validateEmail() {
  const val = dom.email.value.trim();
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

function validatePhone() {
  const val = dom.phone.value.trim();
  if (!val) {
    setFieldError(dom.phoneGroup, dom.phoneError, 'Phone number is required.');
    return false;
  }
  if (!PHONE_REGEX.test(val)) {
    setFieldError(dom.phoneGroup, dom.phoneError, 'Enter a valid 10-digit phone number.');
    return false;
  }
  setFieldValid(dom.phoneGroup, dom.phoneError);
  return true;
}

function validatePassword() {
  const val = dom.password.value;
  if (!val) {
    setFieldError(dom.passwordGroup, dom.passwordError, 'Password is required.');
    return false;
  }
  if (val.length < CONFIG.MIN_PASSWORD_LENGTH) {
    setFieldError(dom.passwordGroup, dom.passwordError, `Password must be at least ${CONFIG.MIN_PASSWORD_LENGTH} characters.`);
    return false;
  }
  setFieldValid(dom.passwordGroup, dom.passwordError);
  return true;
}

function validateConfirmPassword() {
  const val = dom.confirmPassword.value;
  if (!val) {
    setFieldError(dom.confirmPasswordGroup, dom.confirmPasswordError, 'Please confirm your password.');
    return false;
  }
  if (val !== dom.password.value) {
    setFieldError(dom.confirmPasswordGroup, dom.confirmPasswordError, 'Passwords do not match.');
    return false;
  }
  setFieldValid(dom.confirmPasswordGroup, dom.confirmPasswordError);
  return true;
}


/* ============================================================
   PASSWORD TOGGLES
   ============================================================ */
function bindPasswordToggle(button, input) {
  button.addEventListener('click', () => {
    const isVisible = input.type === 'text';
    input.type = isVisible ? 'password' : 'text';
    button.setAttribute('aria-pressed', String(!isVisible));
  });
}


/* ============================================================
   SUBMISSION
   ============================================================ */
async function handleSignupSubmit(e) {
  e.preventDefault();

  const validations = [
    validateFullName(),
    validateEmail(),
    validatePhone(),
    validatePassword(),
    validateConfirmPassword(),
  ];

  if (validations.includes(false)) {
    shakeElement(dom.loginCard);
    showToast('Please fix the highlighted fields.', 'error');
    return;
  }

  dom.signupBtn.classList.add('is-loading');
  dom.signupBtn.disabled = true;

  const email = dom.email.value.trim();

  try {
    await api.post('/auth/member/signup', {
      fullName: dom.fullName.value.trim(),
      email: email,
      phone: dom.phone.value.trim(),
      password: dom.password.value,
    });

    localStorage.setItem(CONFIG.STORAGE_REMEMBER, email);
    showToast(`✓ Account created! Redirecting to Sign In…`, 'success');
    setTimeout(() => { window.location.href = 'member-login.html'; }, 1600);
  } catch (err) {
    shakeElement(dom.loginCard);
    showToast(err.message || 'Could not create account. Please try again.', 'error');
  } finally {
    dom.signupBtn.classList.remove('is-loading');
    dom.signupBtn.disabled = false;
  }
}


/* ============================================================
   INIT
   ============================================================ */
function init() {
  dom.form.addEventListener('submit', handleSignupSubmit);
  dom.signupBtn.addEventListener('click', (e) => createRipple(e, dom.signupBtn));

  bindPasswordToggle(dom.togglePassword, dom.password);
  bindPasswordToggle(dom.toggleConfirmPassword, dom.confirmPassword);

  [
    [dom.fullName, dom.fullNameGroup, dom.fullNameError],
    [dom.email, dom.emailGroup, dom.emailError],
    [dom.phone, dom.phoneGroup, dom.phoneError],
    [dom.password, dom.passwordGroup, dom.passwordError],
    [dom.confirmPassword, dom.confirmPasswordGroup, dom.confirmPasswordError],
  ].forEach(([input, group, errorEl]) => {
    input.addEventListener('input', () => {
      if (group.classList.contains('has-error')) clearFieldError(group, errorEl);
    });
  });

  console.info('%c[NMS] Member signup module initialised.', 'color: #E91E63; font-weight: bold;');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

/**
 * ============================================================
 * MEMBER PORTAL — Contact Us Logic
 * File: member-contact.js
 * Validates and submits the contact form via the Java backend
 * API (see api-client.js), plus a small FAQ accordion.
 * ============================================================ */

'use strict';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const FAQS = [
  { q: 'How quickly can a nurse be arranged?', a: 'For short-term services, we can typically arrange a qualified nurse within 2-4 hours of confirmation, depending on your location and requirements.' },
  { q: 'Are your nurses verified and certified?', a: 'Yes. Every nurse on our platform is verified for qualifications, experience, and background before being listed.' },
  { q: 'Can I choose the same nurse for repeat visits?', a: 'Absolutely — you can request the same nurse again from your booking history or their profile page.' },
  { q: 'What if I need to cancel a booking?', a: 'You can cancel any pending booking directly from the "My Bookings" page at no charge, as long as it hasn\'t started yet.' },
  { q: 'Do you offer monthly nursing packages?', a: 'Yes, our Long-Term Nurse services include monthly private nurse and caregiver packages — explore them on the Home page.' },
];

const dom = {
  form: document.getElementById('contactForm'),
  nameInput: document.getElementById('nameInput'),
  nameGroup: document.getElementById('nameGroup'),
  emailInput: document.getElementById('contactEmailInput'),
  emailGroup: document.getElementById('contactEmailGroup'),
  subjectSelect: document.getElementById('subjectSelect'),
  messageInput: document.getElementById('messageInput'),
  messageGroup: document.getElementById('messageGroup'),
  sendBtn: document.getElementById('sendMessageBtn'),
  sendBtnText: document.getElementById('sendBtnText'),
  faqList: document.getElementById('faqList'),
  toast: document.getElementById('toast'),
};

function showToast(message, type = 'default') {
  const { toast } = dom;
  toast.textContent = message;
  toast.className = 'toast';
  if (type === 'success') toast.classList.add('toast-success');
  if (type === 'error') toast.classList.add('toast-error');
  void toast.offsetWidth;
  toast.classList.add('is-visible');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('is-visible'), 3000);
}

function renderFaqs() {
  dom.faqList.innerHTML = FAQS.map((faq, i) => `
    <div class="faq-item" data-index="${i}">
      <button class="faq-question" type="button">
        ${faq.q}
        <svg class="faq-arrow" viewBox="0 0 20 20" width="14" height="14" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M5 7.5l5 5 5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <div class="faq-answer"><p class="faq-answer-inner">${faq.a}</p></div>
    </div>
  `).join('');
}

async function handleSubmit(e) {
  e.preventDefault();

  let valid = true;
  [dom.nameGroup, dom.emailGroup, dom.messageGroup].forEach((g) => g.classList.remove('has-error'));

  if (!dom.nameInput.value.trim()) { dom.nameGroup.classList.add('has-error'); valid = false; }
  if (!EMAIL_REGEX.test(dom.emailInput.value.trim())) { dom.emailGroup.classList.add('has-error'); valid = false; }
  if (!dom.messageInput.value.trim()) { dom.messageGroup.classList.add('has-error'); valid = false; }

  if (!valid) {
    showToast('Please fill in all required fields.', 'error');
    return;
  }

  dom.sendBtn.disabled = true;
  dom.sendBtnText.textContent = 'Sending…';

  try {
    await api.post('/contact', {
      name: dom.nameInput.value.trim(),
      email: dom.emailInput.value.trim(),
      subject: dom.subjectSelect.value,
      message: dom.messageInput.value.trim(),
    });

    dom.form.reset();
    showToast('✓ Message sent! We\'ll get back to you soon.', 'success');
  } catch (err) {
    showToast(err.message || 'Could not send message. Please try again.', 'error');
  } finally {
    dom.sendBtn.disabled = false;
    dom.sendBtnText.textContent = 'Send Message';
  }
}

function init() {
  renderFaqs();
  renderBottomNav('home');

  dom.form.addEventListener('submit', handleSubmit);

  dom.faqList.addEventListener('click', (e) => {
    const item = e.target.closest('.faq-item');
    if (!item) return;
    const wasOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item').forEach((i) => i.classList.remove('open'));
    if (!wasOpen) item.classList.add('open');
  });

  console.info('%c[NMS] Member Contact module initialised.', 'color: #E91E63; font-weight: bold;');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

/**
 * ============================================================
 * NURSE MANAGEMENT SYSTEM — Pending Bookings Logic
 * File: pending-bookings.js
 * Lists bookings with status "Pending" and lets the admin
 * Accept (confirm) or Deny each one. Accepting a booking is
 * handled server-side: the backend automatically denies any
 * other Pending booking for the same nurse with overlapping
 * dates (see BookingHandler.denyOverlappingPendingBookings).
 * ============================================================ */

'use strict';

const dom = {
  loadingState:      document.getElementById('loadingState'),
  emptyState:       document.getElementById('emptyState'),
  pendingList:       document.getElementById('pendingList'),
  pendingCountBadge: document.getElementById('pendingCountBadge'),

  confirmModal:      document.getElementById('confirmModal'),
  confirmIcon:       document.getElementById('confirmIcon'),
  confirmTitle:      document.getElementById('confirmTitle'),
  confirmMessage:    document.getElementById('confirmMessage'),
  confirmCancelBtn:  document.getElementById('confirmCancelBtn'),
  confirmActionBtn:  document.getElementById('confirmActionBtn'),

  toast:             document.getElementById('toast'),
};

let pendingAction = null; // { bookingId, newStatus }

/* ============================================================
   TOAST
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
  toast._timer = setTimeout(() => toast.classList.remove('is-visible'), 3000);
}

/* ============================================================
   DATA
   ============================================================ */
async function loadPendingBookings() {
  try {
    const bookings = await api.get('/bookings');
    return bookings.filter((b) => b.status === 'Pending');
  } catch (err) {
    showToast(err.message || 'Could not reach the server.', 'error');
    return [];
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

/* ============================================================
   RENDER
   ============================================================ */
function buildBookingCard(booking) {
  const card = document.createElement('div');
  card.className = 'booking-request-card';
  card.innerHTML = `
    <div class="booking-request-main">
      <div class="booking-request-nurse">
        <i class="fa-solid fa-user-nurse"></i>
        <div>
          <div class="booking-request-nurse-name">${booking.nurseName || 'Unknown Nurse'}</div>
          <div class="booking-request-nurse-sub">${booking.nurseQualification || ''}</div>
        </div>
      </div>
      <div class="booking-request-details">
        <div class="booking-request-detail">
          <i class="fa-solid fa-envelope"></i>
          <span>${booking.memberEmail || '—'}</span>
        </div>
        <div class="booking-request-detail">
          <i class="fa-solid fa-calendar-days"></i>
          <span>${formatDate(booking.startDate)} &rarr; ${formatDate(booking.endDate)}</span>
        </div>
        <div class="booking-request-detail">
          <i class="fa-solid fa-clock"></i>
          <span>${booking.dutyHours || 8}-hour duty</span>
        </div>
        ${booking.notes ? `<div class="booking-request-detail booking-request-notes">
          <i class="fa-solid fa-note-sticky"></i>
          <span>${booking.notes}</span>
        </div>` : ''}
      </div>
    </div>
    <div class="booking-request-actions">
      <button class="btn btn-accept" data-action="accept" data-id="${booking.id}">
        <i class="fa-solid fa-check"></i> Accept
      </button>
      <button class="btn btn-deny" data-action="deny" data-id="${booking.id}">
        <i class="fa-solid fa-xmark"></i> Deny
      </button>
    </div>
  `;
  return card;
}

async function renderPendingBookings() {
  const bookings = await loadPendingBookings();
  dom.loadingState.hidden = true;

  dom.pendingList.innerHTML = '';

  if (bookings.length === 0) {
    dom.emptyState.hidden = false;
    dom.pendingList.hidden = true;
  } else {
    dom.emptyState.hidden = true;
    dom.pendingList.hidden = false;
    bookings.forEach((b) => dom.pendingList.appendChild(buildBookingCard(b)));
  }

  if (bookings.length > 0) {
    dom.pendingCountBadge.hidden = false;
    dom.pendingCountBadge.textContent = bookings.length;
  } else {
    dom.pendingCountBadge.hidden = true;
  }
}

/* ============================================================
   ACCEPT / DENY ACTIONS
   ============================================================ */
function openConfirm(bookingId, newStatus) {
  pendingAction = { bookingId, newStatus };

  if (newStatus === 'Confirmed') {
    dom.confirmIcon.innerHTML = '<i class="fa-solid fa-circle-check"></i>';
    dom.confirmIcon.className = 'confirm-icon confirm-icon-accept';
    dom.confirmTitle.textContent = 'Accept this booking?';
    dom.confirmMessage.textContent =
      'This nurse will be confirmed for this member. Any other pending request for the same nurse with overlapping dates will be automatically denied.';
    dom.confirmActionBtn.textContent = 'Yes, Accept';
    dom.confirmActionBtn.className = 'btn btn-accept';
  } else {
    dom.confirmIcon.innerHTML = '<i class="fa-solid fa-circle-xmark"></i>';
    dom.confirmIcon.className = 'confirm-icon confirm-icon-deny';
    dom.confirmTitle.textContent = 'Deny this booking?';
    dom.confirmMessage.textContent = 'The member will be notified that this booking request was not accepted.';
    dom.confirmActionBtn.textContent = 'Yes, Deny';
    dom.confirmActionBtn.className = 'btn btn-danger';
  }

  dom.confirmModal.hidden = false;
}

function closeConfirm() {
  dom.confirmModal.hidden = true;
  pendingAction = null;
}

async function submitPendingAction() {
  if (!pendingAction) return;
  const { bookingId, newStatus } = pendingAction;

  try {
    await api.put(`/bookings/${bookingId}`, { status: newStatus });
    showToast(
      newStatus === 'Confirmed' ? 'Booking accepted.' : 'Booking denied.',
      'success'
    );
    closeConfirm();
    renderPendingBookings();
  } catch (err) {
    showToast(err.message || 'Could not update the booking.', 'error');
  }
}

/* ============================================================
   INIT
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  renderPendingBookings();

  dom.pendingList.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const bookingId = btn.dataset.id;
    const newStatus = btn.dataset.action === 'accept' ? 'Confirmed' : 'Denied';
    openConfirm(bookingId, newStatus);
  });

  dom.confirmCancelBtn.addEventListener('click', closeConfirm);
  dom.confirmActionBtn.addEventListener('click', submitPendingAction);
  dom.confirmModal.addEventListener('click', (e) => {
    if (e.target === dom.confirmModal) closeConfirm();
  });

  console.log('[NMS] Pending Bookings module initialised.');
});

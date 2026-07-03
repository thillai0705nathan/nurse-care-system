/**
 * ============================================================
 * MEMBER PORTAL — My Bookings Logic
 * File: member-booking.js
 * Lists bookings from the Java backend API (see api-client.js
 * and getMemberBookings() in member-nav.js), with status filter
 * and cancellation.
 * ============================================================ */

'use strict';

const dom = {
  statusTabs: document.getElementById('statusTabs'),
  bookingList: document.getElementById('bookingList'),
  emptyState: document.getElementById('emptyState'),

  cancelModal: document.getElementById('cancelModal'),
  cancelModalDesc: document.getElementById('cancelModalDesc'),
  cancelModalDismiss: document.getElementById('cancelModalDismiss'),
  cancelModalConfirm: document.getElementById('cancelModalConfirm'),

  toast: document.getElementById('toast'),
};

let activeStatus = 'All';
let pendingCancelId = null;
let cachedBookings = [];

function showToast(message, type = 'default') {
  const { toast } = dom;
  toast.textContent = message;
  toast.className = 'toast';
  if (type === 'success') toast.classList.add('toast-success');
  void toast.offsetWidth;
  toast.classList.add('is-visible');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('is-visible'), 3000);
}

function formatDate(str) {
  if (!str) return '—';
  const d = new Date(str);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function statusBadgeClass(status) {
  if (status === 'Pending') return 'badge-pending';
  if (status === 'Cancelled') return 'badge-cancelled';
  return 'badge-confirmed';
}

function buildBookingCard(booking) {
  const card = document.createElement('div');
  card.className = 'booking-card';
  const days = Math.max(1, Math.round((new Date(booking.endDate) - new Date(booking.startDate)) / 86400000) + 1);
  const estCost = Number(booking.perDaySalary || 0) * days;

  card.innerHTML = `
    <div class="booking-card-top">
      <div>
        <div class="booking-nurse-name">${booking.nurseName}</div>
        <div class="booking-nurse-qualification">${booking.nurseQualification || ''}</div>
      </div>
      <span class="badge ${statusBadgeClass(booking.status)}">${booking.status}</span>
    </div>
    <div class="booking-card-details">
      <div><span>From:</span> ${formatDate(booking.startDate)}</div>
      <div><span>To:</span> ${formatDate(booking.endDate)}</div>
      <div><span>Duty:</span> ${booking.dutyHours} Hrs/day</div>
      <div><span>Est. Cost:</span> ₹${estCost.toLocaleString('en-IN')}</div>
    </div>
    ${booking.notes ? `<p class="booking-card-notes">"${booking.notes}"</p>` : ''}
    <div class="booking-card-footer">
      <span class="booking-id">${booking.id}</span>
      ${booking.status === 'Pending' ? `<button class="btn-danger-text" data-cancel-id="${booking.id}">Cancel Booking</button>` : ''}
    </div>
  `;
  return card;
}

async function renderBookings() {
  const bookings = await getMemberBookings();
  cachedBookings = bookings;
  const filtered = activeStatus === 'All' ? bookings : bookings.filter((b) => b.status === activeStatus);

  dom.bookingList.innerHTML = '';

  if (bookings.length === 0) {
    dom.emptyState.hidden = false;
    dom.bookingList.hidden = true;
    return;
  }
  dom.emptyState.hidden = true;
  dom.bookingList.hidden = false;

  if (filtered.length === 0) {
    dom.bookingList.innerHTML = '<p class="empty-state" style="padding-top:1rem;">No bookings in this category.</p>';
    return;
  }

  filtered.forEach((b) => dom.bookingList.appendChild(buildBookingCard(b)));
}

function openCancelModal(id) {
  const booking = cachedBookings.find((b) => b.id === id);
  if (!booking) return;
  pendingCancelId = id;
  dom.cancelModalDesc.textContent = `Your booking with ${booking.nurseName} from ${formatDate(booking.startDate)} to ${formatDate(booking.endDate)} will be cancelled.`;
  dom.cancelModal.hidden = false;
  document.body.style.overflow = 'hidden';
}

function closeCancelModal() {
  pendingCancelId = null;
  dom.cancelModal.hidden = true;
  document.body.style.overflow = '';
}

async function confirmCancel() {
  if (!pendingCancelId) return;
  try {
    await api.put(`/bookings/${pendingCancelId}`, { status: 'Cancelled' });
    closeCancelModal();
    await renderBookings();
    renderBottomNav('bookings');
    showToast('Booking cancelled.', 'success');
  } catch (err) {
    showToast(err.message || 'Could not cancel booking.', 'error');
  }
}

function init() {
  renderBookings();
  renderBottomNav('bookings');

  dom.statusTabs.addEventListener('click', (e) => {
    const tab = e.target.closest('.status-tab');
    if (!tab) return;
    activeStatus = tab.dataset.status;
    document.querySelectorAll('.status-tab').forEach((t) => t.classList.remove('active'));
    tab.classList.add('active');
    renderBookings();
  });

  dom.bookingList.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-cancel-id]');
    if (btn) openCancelModal(btn.dataset.cancelId);
  });

  dom.cancelModalDismiss.addEventListener('click', closeCancelModal);
  dom.cancelModalConfirm.addEventListener('click', confirmCancel);
  dom.cancelModal.addEventListener('click', (e) => { if (e.target === dom.cancelModal) closeCancelModal(); });

  console.info('%c[NMS] Member Bookings module initialised.', 'color: #E91E63; font-weight: bold;');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

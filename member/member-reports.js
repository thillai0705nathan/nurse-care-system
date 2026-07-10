/**
 * ============================================================
 * MEMBER PORTAL — Reports Logic
 * File: member-reports.js
 * Summarizes booking activity from localStorage
 * ("nms_member_bookings") into simple spend/status stats.
 * ============================================================ */

'use strict';

const dom = {
  statTotal: document.getElementById('statTotal'),
  statPending: document.getElementById('statPending'),
  statCancelled: document.getElementById('statCancelled'),
  statSpend: document.getElementById('statSpend'),
  reportList: document.getElementById('reportList'),
  emptyState: document.getElementById('emptyState'),
};

function estimateCost(booking) {
  const days = Math.max(1, Math.round((new Date(booking.endDate) - new Date(booking.startDate)) / 86400000) + 1);
  return Number(booking.perDaySalary || 0) * days;
}

function formatDate(str) {
  if (!str) return '—';
  return new Date(str).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

async function renderReports() {
  const bookings = await getMemberBookings();

  if (bookings.length === 0) {
    dom.emptyState.hidden = false;
    return;
  }
  dom.emptyState.hidden = true;

  const pending = bookings.filter((b) => b.status === 'Pending').length;
  const cancelled = bookings.filter((b) => b.status === 'Cancelled').length;
  const totalSpend = bookings
    .filter((b) => b.status !== 'Cancelled')
    .reduce((sum, b) => sum + estimateCost(b), 0);

  dom.statTotal.textContent = bookings.length;
  dom.statPending.textContent = pending;
  dom.statCancelled.textContent = cancelled;
  dom.statSpend.textContent = `₹${totalSpend.toLocaleString('en-IN')}`;

  dom.reportList.innerHTML = bookings.map((b) => `
    <div class="report-item">
      <div>
        <div class="report-item-name">${b.nurseName}</div>
        <div class="report-item-sub">${formatDate(b.startDate)} – ${formatDate(b.endDate)} · ${b.status}</div>
      </div>
      <span class="report-item-cost">${b.status === 'Cancelled' ? '—' : '₹' + estimateCost(b).toLocaleString('en-IN')}</span>
    </div>
  `).join('');
}

function init() {
  renderReports();
  renderBottomNav('reports');
  console.info('%c[NMS] Member Reports module initialised.', 'color: #E91E63; font-weight: bold;');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

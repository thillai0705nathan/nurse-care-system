/**
 * ============================================================
 * MEMBER PORTAL — Notifications Logic
 * File: member-notifications.js
 * Generates notifications from booking activity (localStorage
 * "nms_member_bookings") plus a standing welcome note. Read
 * state is tracked in "nms_read_notifications".
 * ============================================================ */

'use strict';

const READ_NOTIFICATIONS_KEY = 'nms_read_notifications';

const dom = {
  notificationList: document.getElementById('notificationList'),
  emptyState: document.getElementById('emptyState'),
};

function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

async function buildNotifications() {
  const bookings = await getMemberBookings();
  const notifications = [
    {
      id: 'welcome',
      icon: '<i class="fa-solid fa-hand"></i>',
      title: 'Welcome to Nurse Care',
      text: 'Browse Short-Term and Long-Term nursing services from the Home tab, and book trusted nurses anytime.',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
  ];

  bookings.forEach((b) => {
    if (b.status === 'Pending') {
      notifications.push({
        id: b.id + '-pending',
        icon: '<i class="fa-solid fa-hourglass-half"></i>',
        title: 'Booking request sent',
        text: `Your request for ${b.nurseName} (${b.startDate} to ${b.endDate}) is awaiting confirmation.`,
        createdAt: b.createdAt,
      });
    } else if (b.status === 'Cancelled') {
      notifications.push({
        id: b.id + '-cancelled',
        icon: '<i class="fa-solid fa-circle-xmark"></i>',
        title: 'Booking cancelled',
        text: `Your booking with ${b.nurseName} has been cancelled.`,
        createdAt: b.createdAt,
      });
    } else if (b.status === 'Confirmed') {
      notifications.push({
        id: b.id + '-confirmed',
        icon: '<i class="fa-solid fa-circle-check"></i>',
        title: 'Booking accepted',
        text: `Great news — ${b.nurseName} has accepted your booking for ${b.startDate} to ${b.endDate}.`,
        createdAt: b.createdAt,
      });
    } else if (b.status === 'Denied') {
      notifications.push({
        id: b.id + '-denied',
        icon: '<i class="fa-solid fa-circle-xmark"></i>',
        title: 'Booking not accepted',
        text: `Your request for ${b.nurseName} (${b.startDate} to ${b.endDate}) wasn't accepted — the nurse was already booked for this period.`,
        createdAt: b.createdAt,
      });
    }
  });

  return notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function getReadIds() {
  return JSON.parse(localStorage.getItem(READ_NOTIFICATIONS_KEY) || '[]');
}

function markAsRead(id) {
  const readIds = getReadIds();
  if (!readIds.includes(id)) {
    readIds.push(id);
    localStorage.setItem(READ_NOTIFICATIONS_KEY, JSON.stringify(readIds));
  }
}

async function renderNotifications() {
  const notifications = await buildNotifications();
  const readIds = getReadIds();

  if (notifications.length === 0) {
    dom.emptyState.hidden = false;
    return;
  }

  dom.notificationList.innerHTML = notifications.map((n) => {
    const isRead = readIds.includes(n.id);
    return `
      <div class="notification-item ${isRead ? 'is-read' : ''}" data-id="${n.id}">
        <div class="notification-icon">${n.icon}</div>
        <div class="notification-body">
          <div class="notification-title">${n.title}</div>
          <div class="notification-text">${n.text}</div>
          <div class="notification-time">${timeAgo(n.createdAt)}</div>
        </div>
        ${isRead ? '' : '<div class="notification-dot"></div>'}
      </div>
    `;
  }).join('');
}

function init() {
  renderNotifications();
  renderBottomNav('notifications');

  dom.notificationList.addEventListener('click', (e) => {
    const item = e.target.closest('.notification-item');
    if (!item) return;
    markAsRead(item.dataset.id);
    renderNotifications();
    renderBottomNav('notifications');
  });

  console.info('%c[NMS] Member Notifications module initialised.', 'color: #E91E63; font-weight: bold;');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

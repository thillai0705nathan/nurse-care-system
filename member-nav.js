/**
 * ============================================================
 * MEMBER PORTAL — Shared Bottom Navigation
 * File: member-nav.js
 * Renders the fixed bottom nav bar into #bottomNavRoot on every
 * member-*.html page. Call renderBottomNav('home'|'notifications'
 * |'bookings'|'reports') after including this script.
 * ============================================================ */

'use strict';

async function getMemberBookings() {
  try {
    return await api.get('/bookings');
  } catch (err) {
    return [];
  }
}

async function renderBottomNav(activePage) {
  const root = document.getElementById('bottomNavRoot');
  if (!root) return;

  const bookings = await getMemberBookings();
  const pendingCount = bookings.filter((b) => b.status === 'Pending').length;

  const items = [
    {
      key: 'home',
      label: 'Home',
      href: 'member-home.html',
      icon: '<path d="M3 10.5 12 3l9 7.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M5.5 9.5V20a1 1 0 001 1H9a1 1 0 001-1v-4a2 2 0 012-2 2 2 0 012 2v4a1 1 0 001 1h2.5a1 1 0 001-1V9.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
    },
    {
      key: 'notifications',
      label: 'Notification',
      href: 'member-notifications.html',
      icon: '<path d="M12 3a5 5 0 00-5 5v3.2c0 .5-.2 1-.6 1.4L5 14v1h14v-1l-1.4-1.4a2 2 0 01-.6-1.4V8a5 5 0 00-5-5z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M9.5 18a2.5 2.5 0 005 0" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
      badge: pendingCount > 0 ? String(pendingCount) : null,
    },
    {
      key: 'bookings',
      label: 'Bookings',
      href: 'member-booking.html',
      icon: '<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/><path d="M8 12.5l2.5 2.5L16 9.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
    },
    {
      key: 'reports',
      label: 'Reports',
      href: 'member-reports.html',
      icon: '<rect x="5" y="3.5" width="14" height="17" rx="2" stroke="currentColor" stroke-width="1.8"/><path d="M8.5 8h7M8.5 12h7M8.5 16h4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
    },
  ];

  root.innerHTML = items.map((item) => `
    <a class="bottomnav-item ${item.key === activePage ? 'active' : ''}" href="${item.href}">
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">${item.icon}</svg>
      <span>${item.label}</span>
      ${item.badge ? `<span class="bottomnav-badge">${item.badge}</span>` : ''}
    </a>
  `).join('');
}

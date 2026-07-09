/**
 * ============================================================
 * NURSE MANAGEMENT SYSTEM — Manage Nurse Database Logic
 * File: manage-nurse.js
 * Lists nurses from the Java backend API (see api-client.js).
 * Supports search, filtering, sorting, view, edit and delete.
 * ============================================================ */

'use strict';

const dom = {
  searchInput:        document.getElementById('searchInput'),
  filterType:         document.getElementById('filterType'),
  filterAvailability: document.getElementById('filterAvailability'),

  miniTotalValue:     document.getElementById('miniTotalValue'),
  miniFullTimeValue:  document.getElementById('miniFullTimeValue'),
  miniPartTimeValue:  document.getElementById('miniPartTimeValue'),
  miniAvailableValue: document.getElementById('miniAvailableValue'),

  emptyState:         document.getElementById('emptyState'),
  tableWrap:          document.getElementById('tableWrap'),
  tableBody:          document.getElementById('nurseTableBody'),
  noResults:          document.getElementById('noResults'),
  table:              document.getElementById('nurseTable'),

  viewModal:          document.getElementById('viewModal'),
  viewModalClose:     document.getElementById('viewModalClose'),
  viewAvatar:         document.getElementById('viewAvatar'),
  viewName:           document.getElementById('viewName'),
  viewSub:            document.getElementById('viewSub'),
  viewGrid:           document.getElementById('viewGrid'),

  confirmModal:       document.getElementById('confirmModal'),
  confirmMessage:     document.getElementById('confirmMessage'),
  confirmCancelBtn:   document.getElementById('confirmCancelBtn'),
  confirmDeleteBtn:   document.getElementById('confirmDeleteBtn'),

  toast:              document.getElementById('toast'),
};

let allNurses = [];
let sortState = { field: null, direction: 'asc' };
let pendingDeleteId = null;


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
async function loadNurses() {
  try {
    return await api.get('/nurses');
  } catch (err) {
    showToast(err.message || 'Could not reach the server.', 'error');
    return [];
  }
}

function getInitials(name) {
  return (name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

function availabilityBadgeClass(status) {
  switch (status) {
    case 'Available': return 'badge-available';
    case 'On Duty':   return 'badge-onduty';
    case 'On Leave':  return 'badge-onleave';
    default:          return 'badge-inactive';
  }
}


/* ============================================================
   FILTER + SORT
   ============================================================ */
function getFilteredNurses() {
  const query = dom.searchInput.value.trim().toLowerCase();
  const typeFilter = dom.filterType.value;
  const availabilityFilter = dom.filterAvailability.value;

  let result = allNurses.filter((n) => {
    const matchesQuery = !query ||
      (n.fullName || '').toLowerCase().includes(query) ||
      (n.email || '').toLowerCase().includes(query) ||
      (n.contactNumber || '').toLowerCase().includes(query);

    const matchesType = typeFilter === 'All' || n.employeeType === typeFilter;
    const matchesAvailability = availabilityFilter === 'All' || n.availability === availabilityFilter;

    return matchesQuery && matchesType && matchesAvailability;
  });

  if (sortState.field) {
    result = result.slice().sort((a, b) => {
      const valA = a[sortState.field];
      const valB = b[sortState.field];
      let cmp;
      if (typeof valA === 'number' || typeof valB === 'number') {
        cmp = (Number(valA) || 0) - (Number(valB) || 0);
      } else {
        cmp = String(valA || '').localeCompare(String(valB || ''));
      }
      return sortState.direction === 'asc' ? cmp : -cmp;
    });
  }

  return result;
}


/* ============================================================
   RENDER
   ============================================================ */
function updateMiniStats() {
  const fullTime = allNurses.filter((n) => n.employeeType === 'Full-Time').length;
  const partTime = allNurses.filter((n) => n.employeeType === 'Part-Time').length;
  const available = allNurses.filter((n) => n.availability === 'Available').length;

  dom.miniTotalValue.textContent = allNurses.length;
  dom.miniFullTimeValue.textContent = fullTime;
  dom.miniPartTimeValue.textContent = partTime;
  dom.miniAvailableValue.textContent = available;
}

function buildAvatarHtml(nurse) {
  if (nurse.photo) {
    return `<img src="${nurse.photo}" alt="${nurse.fullName}" />`;
  }
  return getInitials(nurse.fullName);
}

function buildRow(nurse) {
  const tr = document.createElement('tr');
  const typeBadgeClass = nurse.employeeType === 'Full-Time' ? 'badge-fulltime' : 'badge-parttime';

  tr.innerHTML = `
    <td class="col-avatar"><div class="avatar-circle">${buildAvatarHtml(nurse)}</div></td>
    <td data-label="Name">
      <div>
        <div class="row-name">${nurse.fullName || '—'}</div>
        <div class="row-sub">ID: ${nurse.id}</div>
      </div>
    </td>
    <td data-label="Contact">
      <div class="row-name">${nurse.contactNumber || '—'}</div>
      <div class="row-sub">${nurse.email || ''}</div>
    </td>
    <td data-label="Qualification">${nurse.qualification || '—'}</td>
    <td data-label="Experience">${nurse.experience ?? '—'} yrs</td>
    <td data-label="Type"><span class="badge ${typeBadgeClass}">${nurse.employeeType || '—'}</span></td>
    <td data-label="Salary">
      <div class="row-name">₹${Number(nurse.monthlySalary || 0).toLocaleString('en-IN')}/mo</div>
      <div class="row-sub">₹${Number(nurse.perDaySalary || 0).toLocaleString('en-IN')}/day</div>
    </td>
    <td class="col-status" data-label="Status"><span class="badge ${availabilityBadgeClass(nurse.availability)}">${nurse.availability || '—'}</span></td>
    <td class="col-actions" data-label="Actions">
      <div class="row-actions">
        <button class="action-btn view-btn" data-id="${nurse.id}" title="View details" aria-label="View details">
          <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1.5 10S4.5 4 10 4s8.5 6 8.5 6-3 6-8.5 6S1.5 10 1.5 10z" stroke="currentColor" stroke-width="1.5"/>
            <circle cx="10" cy="10" r="2.5" stroke="currentColor" stroke-width="1.5"/>
          </svg>
        </button>
        <a class="action-btn edit-btn" href="add-nurse.html?editId=${nurse.id}" title="Edit nurse" aria-label="Edit nurse">
          <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M13.5 3.5l3 3L7 16l-4 1 1-4L13.5 3.5z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>
          </svg>
        </a>
        <button class="action-btn delete-btn" data-id="${nurse.id}" title="Remove nurse" aria-label="Remove nurse">
          <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 6h12M8 6V4.5a1 1 0 011-1h2a1 1 0 011 1V6m2 0-.7 10.1a1.5 1.5 0 01-1.5 1.4H7.2a1.5 1.5 0 01-1.5-1.4L5 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
    </td>
  `;

  return tr;
}

function renderTable() {
  const filtered = getFilteredNurses();

  if (allNurses.length === 0) {
    dom.emptyState.hidden = false;
    dom.tableWrap.hidden = true;
    return;
  }

  dom.emptyState.hidden = true;
  dom.tableWrap.hidden = false;

  dom.tableBody.innerHTML = '';

  if (filtered.length === 0) {
    dom.noResults.hidden = false;
    dom.table.hidden = true;
    return;
  }

  dom.noResults.hidden = true;
  dom.table.hidden = false;

  filtered.forEach((nurse) => dom.tableBody.appendChild(buildRow(nurse)));
}

async function refresh() {
  allNurses = await loadNurses();
  updateMiniStats();
  renderTable();
}


/* ============================================================
   VIEW MODAL
   ============================================================ */
function openViewModal(nurse) {
  dom.viewAvatar.innerHTML = buildAvatarHtml(nurse);
  dom.viewName.textContent = nurse.fullName || '—';
  dom.viewSub.textContent = `${nurse.qualification || '—'} · ID: ${nurse.id}`;

  const fields = [
    ['Gender', nurse.gender],
    ['Age', nurse.age],
    ['Nationality', nurse.nationality],
    ['Blood Group', nurse.bloodGroup],
    ['Contact Number', nurse.contactNumber],
    ['Email', nurse.email],
    ['Emergency Contact', nurse.emergencyContact],
    ['Experience', nurse.experience ? `${nurse.experience} years` : ''],
    ['Employee Type', nurse.employeeType],
    ['Shift Preference', nurse.shiftPreference],
    ['Joining Date', nurse.joiningDate],
    ['Monthly Salary', nurse.monthlySalary ? `₹${Number(nurse.monthlySalary).toLocaleString('en-IN')}` : ''],
    ['Per-Day Salary', nurse.perDaySalary ? `₹${Number(nurse.perDaySalary).toLocaleString('en-IN')}` : ''],
    ['Availability', nurse.availability],
    ['Skills', nurse.skills, true],
    ['Languages Known', nurse.languages, true],
    ['Address', nurse.address, true],
    ['Certifications', nurse.certifications, true],
  ];

  dom.viewGrid.innerHTML = fields
    .filter(([, value]) => value)
    .map(([label, value, fullWidth]) => `
      <div class="view-detail-item ${fullWidth ? 'full-width' : ''}">
        <span class="view-detail-label">${label}</span>
        <span class="view-detail-value">${value}</span>
      </div>
    `)
    .join('');

  dom.viewModal.hidden = false;
  document.body.style.overflow = 'hidden';
}

function closeViewModal() {
  dom.viewModal.hidden = true;
  document.body.style.overflow = '';
}


/* ============================================================
   DELETE CONFIRMATION MODAL
   ============================================================ */
function openConfirmModal(nurse) {
  pendingDeleteId = nurse.id;
  dom.confirmMessage.textContent = `Are you sure you want to remove "${nurse.fullName}" from the database?`;
  dom.confirmModal.hidden = false;
  document.body.style.overflow = 'hidden';
}

function closeConfirmModal() {
  pendingDeleteId = null;
  dom.confirmModal.hidden = true;
  document.body.style.overflow = '';
}

async function deletePendingNurse() {
  if (!pendingDeleteId) return;
  try {
    await api.del(`/nurses/${pendingDeleteId}`);
    showToast('Nurse removed from database.', 'success');
    closeConfirmModal();
    await refresh();
  } catch (err) {
    showToast(err.message || 'Could not remove nurse.', 'error');
  }
}


/* ============================================================
   EVENT HANDLERS
   ============================================================ */
function handleTableClick(e) {
  const viewBtn = e.target.closest('.view-btn');
  const deleteBtn = e.target.closest('.delete-btn');

  if (viewBtn) {
    const nurse = allNurses.find((n) => n.id === viewBtn.dataset.id);
    if (nurse) openViewModal(nurse);
  } else if (deleteBtn) {
    const nurse = allNurses.find((n) => n.id === deleteBtn.dataset.id);
    if (nurse) openConfirmModal(nurse);
  }
}

function handleSortClick(e) {
  const th = e.target.closest('.sortable');
  if (!th) return;

  const field = th.dataset.sort;
  if (sortState.field === field) {
    sortState.direction = sortState.direction === 'asc' ? 'desc' : 'asc';
  } else {
    sortState.field = field;
    sortState.direction = 'asc';
  }

  document.querySelectorAll('.nurse-table th.sortable').forEach((el) => {
    el.classList.remove('sort-asc', 'sort-desc');
  });
  th.classList.add(sortState.direction === 'asc' ? 'sort-asc' : 'sort-desc');

  renderTable();
}


/* ============================================================
   INIT
   ============================================================ */
function init() {
  refresh();

  dom.searchInput.addEventListener('input', renderTable);
  dom.filterType.addEventListener('change', renderTable);
  dom.filterAvailability.addEventListener('change', renderTable);

  dom.tableBody.addEventListener('click', handleTableClick);
  document.querySelector('.nurse-table thead').addEventListener('click', handleSortClick);

  dom.viewModalClose.addEventListener('click', closeViewModal);
  dom.viewModal.addEventListener('click', (e) => {
    if (e.target === dom.viewModal) closeViewModal();
  });

  dom.confirmCancelBtn.addEventListener('click', closeConfirmModal);
  dom.confirmDeleteBtn.addEventListener('click', deletePendingNurse);
  dom.confirmModal.addEventListener('click', (e) => {
    if (e.target === dom.confirmModal) closeConfirmModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (!dom.viewModal.hidden) closeViewModal();
    if (!dom.confirmModal.hidden) closeConfirmModal();
  });

  console.info('%c[NMS] Manage Nurse Database module initialised.', 'color: #E91E63; font-weight: bold;');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

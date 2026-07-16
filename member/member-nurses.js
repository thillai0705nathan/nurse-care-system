/**
 * ============================================================
 * MEMBER PORTAL — Find a Nurse Logic
 * File: member-nurses.js
 * Reads the same nurse database Admin manages via the Java
 * backend API (see api-client.js), lets members search/filter/
 * sort, view full details, and book a nurse.
 * ============================================================ */

'use strict';

const dom = {
  searchInput: document.getElementById('searchInput'),
  startDateInput: document.getElementById('startDateInput'),
  endDateInput: document.getElementById('endDateInput'),
  dateHint: document.getElementById('dateHint'),
  genderFilter: document.getElementById('genderFilter'),
  nationalityFilter: document.getElementById('nationalityFilter'),
  skillsFilterToggle: document.getElementById('skillsFilterToggle'),
  skillsFilterChips: document.getElementById('skillsFilterChips'),
  skillsFilterCount: document.getElementById('skillsFilterCount'),
  dutyHoursToggle: document.getElementById('dutyHoursToggle'),
  dutyHoursLabel: document.getElementById('dutyHoursLabel'),
  sortBar: document.getElementById('sortBar'),
  resultsCount: document.getElementById('resultsCount'),
  loadingState: document.getElementById('loadingState'),
  nurseList: document.getElementById('nurseList'),
  emptyState: document.getElementById('emptyState'),

  nurseDetailModal: document.getElementById('nurseDetailModal'),
  nurseDetailClose: document.getElementById('nurseDetailClose'),
  nurseDetailAvatar: document.getElementById('nurseDetailAvatar'),
  nurseDetailName: document.getElementById('nurseDetailName'),
  nurseDetailSub: document.getElementById('nurseDetailSub'),
  nurseDetailRating: document.getElementById('nurseDetailRating'),
  nurseDetailGrid: document.getElementById('nurseDetailGrid'),
  nurseDetailSkills: document.getElementById('nurseDetailSkills'),
  nurseDetailLanguages: document.getElementById('nurseDetailLanguages'),
  nurseDetailPrice: document.getElementById('nurseDetailPrice'),
  nurseDetailAvailability: document.getElementById('nurseDetailAvailability'),
  bookNowBtn: document.getElementById('bookNowBtn'),

  bookingModal: document.getElementById('bookingModal'),
  bookingModalClose: document.getElementById('bookingModalClose'),
  bookingNurseName: document.getElementById('bookingNurseName'),
  bookStartDate: document.getElementById('bookStartDate'),
  bookStartGroup: document.getElementById('bookStartGroup'),
  bookStartError: document.getElementById('bookStartError'),
  bookEndDate: document.getElementById('bookEndDate'),
  bookEndGroup: document.getElementById('bookEndGroup'),
  bookEndError: document.getElementById('bookEndError'),
  bookDutyHoursToggle: document.getElementById('bookDutyHoursToggle'),
  bookDutyHoursLabel: document.getElementById('bookDutyHoursLabel'),
  bookNotes: document.getElementById('bookNotes'),
  confirmBookingBtn: document.getElementById('confirmBookingBtn'),

  toast: document.getElementById('toast'),
};

let allNurses = [];
let activeNurse = null;
let sortState = { field: null, direction: 'asc' };
let dutyHoursFilter = null; // null = any, 8 or 12
let skillsFilterSet = new Set(); // selected skill/service chips, empty = any
let bookDutyHours = 8;
let ratingsSummary = {}; // { nurseId: { avgRating, reviewCount } }, from real submitted ratings
let confirmedBookings = []; // Confirmed bookings, used to exclude already-booked nurses for the selected dates

/* ============================================================
   DERIVED DATA HELPERS
   ============================================================ */
function getRating(nurse) {
  const entry = ratingsSummary[nurse.id];
  return entry ? entry.avgRating.toFixed(1) : null;
}

function getReviewCount(nurse) {
  const entry = ratingsSummary[nurse.id];
  return entry ? entry.reviewCount : 0;
}

function getDutyHours(nurse) {
  return nurse.employeeType === 'Full-Time' ? 12 : 8;
}

function getInitials(name) {
  return (name || '').split(' ').filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');
}

function buildAvatarHtml(nurse) {
  return nurse.photo ? `<img src="${nurse.photo}" alt="${nurse.fullName}" />` : getInitials(nurse.fullName);
}

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
   LOAD + POPULATE FILTERS
   ============================================================ */
async function loadNurses() {
  try {
    return await api.get('/nurses');
  } catch (err) {
    showToast(err.message || 'Could not reach the server.', 'error');
    return [];
  }
}

async function loadRatingsSummary() {
  try {
    return await api.get('/bookings/ratings-summary');
  } catch (err) {
    return {};
  }
}

async function loadConfirmedBookings() {
  try {
    const bookings = await api.get('/bookings');
    return bookings.filter((b) => b.status === 'Confirmed');
  } catch (err) {
    return [];
  }
}

/**
 * A nurse is unavailable for the selected range if they have a Confirmed
 * booking whose dates overlap it (same overlap rule the backend uses to
 * auto-deny conflicting requests — see BookingHandler.java).
 */
function isNurseAvailableForRange(nurseId, startDate, endDate) {
  if (!startDate || !endDate) return true;
  return !confirmedBookings.some((b) =>
    b.nurseId === nurseId && startDate <= b.endDate && endDate >= b.startDate
  );
}

function populateNationalityFilter() {
  const nationalities = [...new Set(allNurses.map((n) => n.nationality).filter(Boolean))].sort();
  nationalities.forEach((nat) => {
    const opt = document.createElement('option');
    opt.value = nat;
    opt.textContent = nat;
    dom.nationalityFilter.appendChild(opt);
  });
}

function setDefaultDates() {
  const today = new Date();
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);
  dom.startDateInput.value = today.toISOString().slice(0, 10);
  dom.endDateInput.value = nextWeek.toISOString().slice(0, 10);
  validateDateRange();
}

function validateDateRange() {
  const start = new Date(dom.startDateInput.value);
  const end = new Date(dom.endDateInput.value);
  if (dom.startDateInput.value && dom.endDateInput.value && end - start < 0) {
    dom.dateHint.textContent = 'End date should be on or after the start date.';
  } else {
    const days = Math.max(1, Math.round((end - start) / 86400000));
    dom.dateHint.textContent = days >= 30
      ? `Duration: ${Math.round(days / 30)} month(s)`
      : `Duration: ${days} day(s)`;
  }
}

/* ============================================================
   FILTER + SORT + RENDER
   ============================================================ */
function getFilteredNurses() {
  const query = dom.searchInput.value.trim().toLowerCase();
  const gender = dom.genderFilter.value;
  const nationality = dom.nationalityFilter.value;
  const startDate = dom.startDateInput.value;
  const endDate = dom.endDateInput.value;

  let result = allNurses.filter((n) => {
    const matchesQuery = !query ||
      (n.fullName || '').toLowerCase().includes(query) ||
      (n.skills || '').toLowerCase().includes(query) ||
      (n.qualification || '').toLowerCase().includes(query);
    const matchesGender = gender === 'All' || n.gender === gender;
    const matchesNationality = nationality === 'All' || n.nationality === nationality;
    const matchesDuty = dutyHoursFilter === null || getDutyHours(n) === dutyHoursFilter;
    const nurseSkills = (n.skills || '').toLowerCase();
    const matchesSkills = skillsFilterSet.size === 0 ||
      [...skillsFilterSet].some((skill) => nurseSkills.includes(skill.toLowerCase()));
    const matchesAvailability = isNurseAvailableForRange(n.id, startDate, endDate);
    return matchesQuery && matchesGender && matchesNationality && matchesDuty && matchesSkills && matchesAvailability;
  });

  if (sortState.field) {
    result = result.slice().sort((a, b) => {
      let valA, valB;
      if (sortState.field === 'rating') {
        valA = Number(getRating(a));
        valB = Number(getRating(b));
      } else {
        valA = Number(a[sortState.field]) || 0;
        valB = Number(b[sortState.field]) || 0;
      }
      const cmp = valA - valB;
      return sortState.direction === 'asc' ? cmp : -cmp;
    });
  }

  return result;
}

function buildNurseCard(nurse) {
  const card = document.createElement('div');
  card.className = 'nurse-card';
  card.dataset.id = nurse.id;
  card.innerHTML = `
    <div class="avatar-circle nurse-card-avatar">${buildAvatarHtml(nurse)}</div>
    <div class="nurse-card-body">
      <div class="nurse-card-name">${nurse.fullName}</div>
      <div class="nurse-card-meta">Age: ${nurse.age} yrs &nbsp;·&nbsp; Exp: ${nurse.experience} yrs</div>
      <div class="nurse-card-meta">Skills: ${(nurse.skills || '').split(',')[0] || nurse.qualification}</div>
    </div>
    <div class="nurse-card-side">
      ${getRating(nurse)
        ? `<span class="badge badge-rating"><i class="fa-solid fa-star"></i> ${getRating(nurse)}</span>
           <span class="nurse-card-reviews">${getReviewCount(nurse)} Review${getReviewCount(nurse) === 1 ? '' : 's'}</span>`
        : `<span class="nurse-card-reviews">No reviews yet</span>`}
      <span class="nurse-card-price">₹${Number(nurse.perDaySalary).toLocaleString('en-IN')}/Day</span>
    </div>
  `;
  return card;
}

function renderNurseList() {
  dom.loadingState.hidden = true;

  const filtered = getFilteredNurses();
  dom.resultsCount.textContent = `${filtered.length} nurse${filtered.length === 1 ? '' : 's'} available`;
  dom.nurseList.innerHTML = '';

  if (filtered.length === 0) {
    dom.emptyState.hidden = false;
    return;
  }
  dom.emptyState.hidden = true;
  filtered.forEach((nurse) => dom.nurseList.appendChild(buildNurseCard(nurse)));
}

/* ============================================================
   NURSE DETAIL MODAL
   ============================================================ */
function openNurseDetail(nurseId) {
  const nurse = allNurses.find((n) => n.id === nurseId);
  if (!nurse) return;
  activeNurse = nurse;

  dom.nurseDetailAvatar.innerHTML = buildAvatarHtml(nurse);
  dom.nurseDetailName.textContent = nurse.fullName;
  dom.nurseDetailSub.textContent = `${nurse.qualification} · ${nurse.employeeType}`;
  dom.nurseDetailRating.innerHTML = getRating(nurse)
    ? `<span class="star-rating"><i class="fa-solid fa-star"></i> ${getRating(nurse)}</span> &nbsp;(${getReviewCount(nurse)} review${getReviewCount(nurse) === 1 ? '' : 's'})`
    : `<span class="star-rating-empty">No reviews yet</span>`;

  const details = [
    ['Age', `${nurse.age} yrs`],
    ['Gender', nurse.gender],
    ['Experience', `${nurse.experience} yrs`],
    ['Nationality', nurse.nationality],
    ['Duty Hours', `${getDutyHours(nurse)} Hrs/Day`],
    ['Availability', nurse.availability],
  ];
  dom.nurseDetailGrid.innerHTML = details.map(([label, value]) => `
    <div class="nurse-detail-item">
      <span class="nurse-detail-item-label">${label}</span>
      <span class="nurse-detail-item-value">${value || '—'}</span>
    </div>
  `).join('');

  dom.nurseDetailSkills.innerHTML = (nurse.skills || '').split(',').filter(Boolean)
    .map((s) => `<span class="chip">${s.trim()}</span>`).join('') || '<span class="chip">—</span>';
  dom.nurseDetailLanguages.innerHTML = (nurse.languages || '').split(',').filter(Boolean)
    .map((s) => `<span class="chip">${s.trim()}</span>`).join('') || '<span class="chip">—</span>';

  dom.nurseDetailPrice.textContent = `₹${Number(nurse.perDaySalary).toLocaleString('en-IN')}`;

  const availBadgeClass = nurse.availability === 'Available' ? 'badge-confirmed'
    : nurse.availability === 'On Duty' ? 'badge-pending' : 'badge-cancelled';
  dom.nurseDetailAvailability.className = `badge ${availBadgeClass}`;
  dom.nurseDetailAvailability.textContent = nurse.availability;

  dom.nurseDetailModal.hidden = false;
  document.body.style.overflow = 'hidden';
}

function closeNurseDetail() {
  dom.nurseDetailModal.hidden = true;
  document.body.style.overflow = '';
}

/* ============================================================
   BOOKING MODAL
   ============================================================ */
function openBookingModal() {
  if (!activeNurse) return;
  dom.bookingNurseName.textContent = activeNurse.fullName;
  dom.bookStartDate.value = dom.startDateInput.value;
  dom.bookEndDate.value = dom.endDateInput.value;
  bookDutyHours = getDutyHours(activeNurse);
  dom.bookDutyHoursToggle.classList.toggle('on', bookDutyHours === 12);
  dom.bookDutyHoursLabel.textContent = `${String(bookDutyHours).padStart(2, '0')} Hrs`;
  dom.bookNotes.value = '';
  clearBookingErrors();

  closeNurseDetail();
  dom.bookingModal.hidden = false;
  document.body.style.overflow = 'hidden';
}

function closeBookingModal() {
  dom.bookingModal.hidden = true;
  document.body.style.overflow = '';
}

function clearBookingErrors() {
  dom.bookStartGroup.classList.remove('has-error');
  dom.bookEndGroup.classList.remove('has-error');
}

function validateBooking() {
  clearBookingErrors();
  let valid = true;

  if (!dom.bookStartDate.value) {
    dom.bookStartGroup.classList.add('has-error');
    valid = false;
  }
  if (!dom.bookEndDate.value || new Date(dom.bookEndDate.value) < new Date(dom.bookStartDate.value)) {
    dom.bookEndGroup.classList.add('has-error');
    valid = false;
  }
  return valid;
}

async function submitBooking() {
  if (!validateBooking() || !activeNurse) {
    showToast('Please check the booking dates.', 'error');
    return;
  }

  dom.confirmBookingBtn.disabled = true;

  try {
    await api.post('/bookings', {
      nurseId: activeNurse.id,
      nurseName: activeNurse.fullName,
      nurseQualification: activeNurse.qualification,
      memberEmail: localStorage.getItem('nms_remember_email') || '',
      startDate: dom.bookStartDate.value,
      endDate: dom.bookEndDate.value,
      dutyHours: bookDutyHours,
      notes: dom.bookNotes.value.trim(),
      perDaySalary: activeNurse.perDaySalary,
    });

    showToast(`✓ Booking request sent for ${activeNurse.fullName}!`, 'success');
    closeBookingModal();
    setTimeout(() => { window.location.href = 'member-booking.html'; }, 1200);
  } catch (err) {
    showToast(err.message || 'Could not create booking.', 'error');
  } finally {
    dom.confirmBookingBtn.disabled = false;
  }
}

/* ============================================================
   INIT
   ============================================================ */
async function init() {
  allNurses = await loadNurses();
  ratingsSummary = await loadRatingsSummary();
  confirmedBookings = await loadConfirmedBookings();
  populateNationalityFilter();
  setDefaultDates();
  renderNurseList();
  renderBottomNav('home');

  dom.searchInput.addEventListener('input', renderNurseList);
  dom.genderFilter.addEventListener('change', renderNurseList);
  dom.nationalityFilter.addEventListener('change', renderNurseList);
  dom.startDateInput.addEventListener('change', () => { validateDateRange(); renderNurseList(); });
  dom.endDateInput.addEventListener('change', () => { validateDateRange(); renderNurseList(); });

  dom.skillsFilterToggle.addEventListener('click', () => {
    const isOpen = !dom.skillsFilterChips.hidden;
    dom.skillsFilterChips.hidden = isOpen;
    dom.skillsFilterToggle.classList.toggle('open', !isOpen);
  });

  dom.skillsFilterChips.addEventListener('click', (e) => {
    const chip = e.target.closest('.skill-filter-chip');
    if (!chip) return;
    const skill = chip.dataset.skill;
    if (skillsFilterSet.has(skill)) {
      skillsFilterSet.delete(skill);
      chip.classList.remove('active');
    } else {
      skillsFilterSet.add(skill);
      chip.classList.add('active');
    }
    dom.skillsFilterCount.hidden = skillsFilterSet.size === 0;
    dom.skillsFilterCount.textContent = skillsFilterSet.size;
    renderNurseList();
  });

  dom.dutyHoursToggle.addEventListener('click', () => {
    if (dutyHoursFilter === null) { dutyHoursFilter = 8; }
    else if (dutyHoursFilter === 8) { dutyHoursFilter = 12; }
    else { dutyHoursFilter = null; }

    dom.dutyHoursToggle.classList.toggle('on', dutyHoursFilter === 12);
    dom.dutyHoursLabel.textContent = dutyHoursFilter === null ? 'Any' : `${String(dutyHoursFilter).padStart(2, '0')} Hrs`;
    renderNurseList();
  });

  dom.sortBar.addEventListener('click', (e) => {
    const btn = e.target.closest('.sort-btn');
    if (!btn) return;
    const field = btn.dataset.sort;
    sortState.direction = sortState.field === field && sortState.direction === 'asc' ? 'desc' : 'asc';
    sortState.field = field;
    document.querySelectorAll('.sort-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    renderNurseList();
  });

  dom.nurseList.addEventListener('click', (e) => {
    const card = e.target.closest('.nurse-card');
    if (card) openNurseDetail(card.dataset.id);
  });

  dom.nurseDetailClose.addEventListener('click', closeNurseDetail);
  dom.nurseDetailModal.addEventListener('click', (e) => { if (e.target === dom.nurseDetailModal) closeNurseDetail(); });
  dom.bookNowBtn.addEventListener('click', openBookingModal);

  dom.bookingModalClose.addEventListener('click', closeBookingModal);
  dom.bookingModal.addEventListener('click', (e) => { if (e.target === dom.bookingModal) closeBookingModal(); });
  dom.bookDutyHoursToggle.addEventListener('click', () => {
    bookDutyHours = bookDutyHours === 8 ? 12 : 8;
    dom.bookDutyHoursToggle.classList.toggle('on', bookDutyHours === 12);
    dom.bookDutyHoursLabel.textContent = `${String(bookDutyHours).padStart(2, '0')} Hrs`;
  });
  dom.confirmBookingBtn.addEventListener('click', submitBooking);

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (!dom.nurseDetailModal.hidden) closeNurseDetail();
    if (!dom.bookingModal.hidden) closeBookingModal();
  });

  console.info('%c[NMS] Member Nurses module initialised.', 'color: #E91E63; font-weight: bold;');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

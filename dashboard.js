async function loadStoredNurses() {
  try {
    return await api.get('/nurses');
  } catch (err) {
    return [];
  }
}

function buildNurseListItem(nurse) {
  const li = document.createElement('li');
  const label = nurse.qualification ? `${nurse.fullName}, ${nurse.qualification}` : nurse.fullName;
  const isSeedNurse = (nurse.id || '').startsWith('NUR-S');

  if (isSeedNurse) {
    li.textContent = label;
  } else {
    li.className = 'new-nurse-item';
    li.innerHTML = `${label} <span class="new-badge">New</span>`;
  }
  return li;
}

async function renderDynamicNurses() {
  const fullTimeList = document.getElementById('fullTimeList');
  const partTimeList = document.getElementById('partTimeList');
  const fullTimeCountEl = document.getElementById('fullTimeCount');
  const partTimeCountEl = document.getElementById('partTimeCount');
  const totalValueEl = document.getElementById('totalNursesValue');
  const availableValueEl = document.getElementById('availableNursesValue');

  // Only the dashboard overview page has these elements — skip on other pages.
  if (!fullTimeList || !partTimeList || !fullTimeCountEl || !partTimeCountEl || !totalValueEl || !availableValueEl) {
    return;
  }

  const nurses = await loadStoredNurses();
  fullTimeList.innerHTML = '';
  partTimeList.innerHTML = '';

  const fullTimeNurses = nurses.filter((n) => n.employeeType === 'Full-Time');
  const partTimeNurses = nurses.filter((n) => n.employeeType === 'Part-Time');

  fullTimeNurses.forEach((n) => fullTimeList.appendChild(buildNurseListItem(n)));
  partTimeNurses.forEach((n) => partTimeList.appendChild(buildNurseListItem(n)));

  fullTimeCountEl.textContent = `${fullTimeNurses.length} Registered`;
  partTimeCountEl.textContent = `${partTimeNurses.length} Registered`;

  const availableCount = nurses.filter((n) => n.availability === 'Available').length;
  totalValueEl.textContent = nurses.length;
  availableValueEl.textContent = availableCount;
}

document.addEventListener('DOMContentLoaded', () => {
  renderDynamicNurses();

  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const sidebar = document.getElementById('sidebar');

  // Mobile Hamburger Toggle
  hamburgerBtn.addEventListener('click', () => {
    sidebar.classList.toggle('open');
  });

  // Close sidebar when clicking outside on mobile
  document.addEventListener('click', (e) => {
    if (window.innerWidth < 768) {
      if (!sidebar.contains(e.target) && !hamburgerBtn.contains(e.target) && sidebar.classList.contains('open')) {
        sidebar.classList.remove('open');
      }
    }
  });

  // Category Collapsible Toggles
  const categoryCards = document.querySelectorAll('.category-card');

  categoryCards.forEach(card => {
    const header = card.querySelector('.category-header');
    
    header.addEventListener('click', () => {
      // Toggle current card
      const isExpanded = card.classList.contains('expanded');
      
      // Close other cards for accordian feel (optional, but clean)
      categoryCards.forEach(c => c.classList.remove('expanded'));
      
      if (!isExpanded) {
        card.classList.add('expanded');
      }
    });
  });

  console.log('[NMS] Dashboard loaded successfully.');
});

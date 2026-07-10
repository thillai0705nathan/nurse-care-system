/**
 * ============================================================
 * NURSE MANAGEMENT SYSTEM — Add New Nurse Logic
 * File: add-nurse.js
 * Validates the form and saves the nurse record via the Java
 * backend API (see api-client.js) instead of localStorage.
 * ============================================================ */

'use strict';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[0-9]{10,15}$/;

const dom = {
  form:            document.getElementById('addNurseForm'),
  nurseIdBadge:    document.getElementById('nurseIdBadge'),

  photoInput:      document.getElementById('photoInput'),
  photoCircle:     document.getElementById('photoCircle'),
  photoPreviewImg: document.getElementById('photoPreviewImg'),
  photoPlaceholder:document.getElementById('photoPlaceholder'),

  fullName:        document.getElementById('fullName'),
  fullNameGroup:    document.getElementById('fullNameGroup'),
  fullNameError:    document.getElementById('fullNameError'),

  gender:          document.getElementById('gender'),
  genderGroup:      document.getElementById('genderGroup'),
  genderError:      document.getElementById('genderError'),

  age:             document.getElementById('age'),
  ageGroup:         document.getElementById('ageGroup'),
  ageError:         document.getElementById('ageError'),

  contactNumber:   document.getElementById('contactNumber'),
  contactNumberGroup: document.getElementById('contactNumberGroup'),
  contactNumberError: document.getElementById('contactNumberError'),

  email:           document.getElementById('email'),
  emailGroup:       document.getElementById('emailGroup'),
  emailError:       document.getElementById('emailError'),

  qualification:   document.getElementById('qualification'),
  qualificationGroup: document.getElementById('qualificationGroup'),
  qualificationError: document.getElementById('qualificationError'),

  experience:      document.getElementById('experience'),
  experienceGroup:  document.getElementById('experienceGroup'),
  experienceError:  document.getElementById('experienceError'),

  employeeTypeGroup: document.getElementById('employeeTypeGroup'),
  employeeTypeError: document.getElementById('employeeTypeError'),

  monthlySalary:   document.getElementById('monthlySalary'),
  monthlySalaryGroup: document.getElementById('monthlySalaryGroup'),
  monthlySalaryError: document.getElementById('monthlySalaryError'),

  perDaySalary:    document.getElementById('perDaySalary'),
  autoCalcBtn:     document.getElementById('autoCalcBtn'),

  skillsHidden:    document.getElementById('skillsHidden'),
  skillsCheckboxes: null, // populated in initSkillsCheckboxes()

  languagesInput:  document.getElementById('languagesInput'),
  languagesChips:  document.getElementById('languagesChips'),
  languagesHidden: document.getElementById('languagesHidden'),

  submitBtn:       document.getElementById('submitBtn'),
  resetBtn:        document.getElementById('resetBtn'),

  toast:           document.getElementById('toast'),
};


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
  toast._timer = setTimeout(() => toast.classList.remove('is-visible'), 3500);
}

function shakeElement(el) {
  el.classList.remove('shake');
  void el.offsetWidth;
  el.classList.add('shake');
  el.addEventListener('animationend', () => el.classList.remove('shake'), { once: true });
}


/* ============================================================
   NURSE ID DISPLAY
   ============================================================ */
function showPendingId() {
  dom.nurseIdBadge.textContent = 'ID: assigned on save';
}


/* ============================================================
   PHOTO UPLOAD
   ============================================================ */
function initPhotoUpload() {
  dom.photoInput.addEventListener('change', () => {
    const file = dom.photoInput.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      dom.photoPreviewImg.src = e.target.result;
      dom.photoPreviewImg.hidden = false;
      dom.photoPlaceholder.hidden = true;
    };
    reader.readAsDataURL(file);
  });
}


/* ============================================================
   CHIP / TAG INPUT (reused for Skills + Languages)
   ============================================================ */
function createChipInput(inputEl, listEl, hiddenEl) {
  const items = [];

  function render() {
    listEl.innerHTML = '';
    items.forEach((item, index) => {
      const chip = document.createElement('span');
      chip.className = 'chip';
      chip.innerHTML = `${item}<span class="chip-remove" data-index="${index}">&times;</span>`;
      listEl.appendChild(chip);
    });
    hiddenEl.value = items.join(', ');
  }

  function addItem(raw) {
    const value = raw.trim();
    if (!value) return;
    if (items.some((i) => i.toLowerCase() === value.toLowerCase())) return;
    items.push(value);
    render();
  }

  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addItem(inputEl.value);
      inputEl.value = '';
    } else if (e.key === 'Backspace' && !inputEl.value && items.length) {
      items.pop();
      render();
    }
  });

  inputEl.addEventListener('blur', () => {
    if (inputEl.value.trim()) {
      addItem(inputEl.value);
      inputEl.value = '';
    }
  });

  listEl.addEventListener('click', (e) => {
    const target = e.target.closest('.chip-remove');
    if (!target) return;
    items.splice(Number(target.dataset.index), 1);
    render();
  });

  return {
    getItems: () => items.slice(),
    reset: () => { items.length = 0; render(); },
    setItems: (newItems) => { items.length = 0; items.push(...newItems); render(); },
  };
}


/* ============================================================
   SKILLS CHECKBOX GRID (fixed list matching the Member app's
   service catalog — see member-home.js SERVICES)
   ============================================================ */
function initSkillsCheckboxes() {
  dom.skillsCheckboxes = Array.from(document.querySelectorAll('.skill-checkbox-input'));
  dom.skillsCheckboxes.forEach((cb) => {
    cb.addEventListener('change', syncSkillsHidden);
  });
}

function syncSkillsHidden() {
  const selected = dom.skillsCheckboxes.filter((cb) => cb.checked).map((cb) => cb.value);
  dom.skillsHidden.value = selected.join(', ');
}

function setSkillsCheckboxes(skills) {
  const selectedSet = new Set(skills.map((s) => s.trim().toLowerCase()));
  dom.skillsCheckboxes.forEach((cb) => {
    cb.checked = selectedSet.has(cb.value.toLowerCase());
  });
  syncSkillsHidden();
}

function resetSkillsCheckboxes() {
  dom.skillsCheckboxes.forEach((cb) => { cb.checked = false; });
  dom.skillsHidden.value = '';
}


/* ============================================================
   SALARY AUTO-CALCULATE
   ============================================================ */
function initSalaryAutoCalc() {
  dom.autoCalcBtn.addEventListener('click', () => {
    const monthly = parseFloat(dom.monthlySalary.value);
    if (!monthly || monthly <= 0) {
      shakeElement(dom.monthlySalaryGroup);
      setFieldError(dom.monthlySalaryGroup, dom.monthlySalaryError, 'Enter monthly salary first.');
      return;
    }
    dom.perDaySalary.value = Math.round(monthly / 30);
  });
}


/* ============================================================
   VALIDATION HELPERS
   ============================================================ */
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

function validateRequiredText(input, group, errorEl, label) {
  const val = input.value.trim();
  if (!val) {
    setFieldError(group, errorEl, `${label} is required.`);
    return false;
  }
  setFieldValid(group, errorEl);
  return true;
}

function validateEmail() {
  const val = dom.email.value.trim();
  if (!val) {
    setFieldError(dom.emailGroup, dom.emailError, 'Email address is required.');
    return false;
  }
  if (!EMAIL_REGEX.test(val)) {
    setFieldError(dom.emailGroup, dom.emailError, 'Enter a valid email address.');
    return false;
  }
  setFieldValid(dom.emailGroup, dom.emailError);
  return true;
}

function validatePhone() {
  const val = dom.contactNumber.value.trim();
  if (!val) {
    setFieldError(dom.contactNumberGroup, dom.contactNumberError, 'Contact number is required.');
    return false;
  }
  if (!PHONE_REGEX.test(val)) {
    setFieldError(dom.contactNumberGroup, dom.contactNumberError, 'Enter a valid 10-digit phone number.');
    return false;
  }
  setFieldValid(dom.contactNumberGroup, dom.contactNumberError);
  return true;
}

function validateAge() {
  const val = Number(dom.age.value);
  if (!dom.age.value) {
    setFieldError(dom.ageGroup, dom.ageError, 'Age is required.');
    return false;
  }
  if (val < 18 || val > 70) {
    setFieldError(dom.ageGroup, dom.ageError, 'Age must be between 18 and 70.');
    return false;
  }
  setFieldValid(dom.ageGroup, dom.ageError);
  return true;
}

function validateGender() {
  if (!dom.gender.value) {
    setFieldError(dom.genderGroup, dom.genderError, 'Please select a gender.');
    return false;
  }
  setFieldValid(dom.genderGroup, dom.genderError);
  return true;
}

function validateQualification() {
  if (!dom.qualification.value) {
    setFieldError(dom.qualificationGroup, dom.qualificationError, 'Please select a qualification.');
    return false;
  }
  setFieldValid(dom.qualificationGroup, dom.qualificationError);
  return true;
}

function validateExperience() {
  if (dom.experience.value === '') {
    setFieldError(dom.experienceGroup, dom.experienceError, 'Years of experience is required.');
    return false;
  }
  if (Number(dom.experience.value) < 0) {
    setFieldError(dom.experienceGroup, dom.experienceError, 'Experience cannot be negative.');
    return false;
  }
  setFieldValid(dom.experienceGroup, dom.experienceError);
  return true;
}

function validateEmployeeType() {
  const checked = dom.form.querySelector('input[name="employeeType"]:checked');
  if (!checked) {
    dom.employeeTypeError.textContent = 'Please select Full-Time or Part-Time.';
    dom.employeeTypeError.style.display = 'flex';
    return false;
  }
  dom.employeeTypeError.style.display = 'none';
  return true;
}

function validateMonthlySalary() {
  if (dom.monthlySalary.value === '' || Number(dom.monthlySalary.value) <= 0) {
    setFieldError(dom.monthlySalaryGroup, dom.monthlySalaryError, 'Monthly salary is required.');
    return false;
  }
  setFieldValid(dom.monthlySalaryGroup, dom.monthlySalaryError);
  return true;
}


/* ============================================================
   FORM SUBMISSION
   ============================================================ */
function collectNurseData(nurseId) {
  return {
    id: nurseId,
    fullName: dom.fullName.value.trim(),
    gender: dom.gender.value,
    age: Number(dom.age.value),
    nationality: document.getElementById('nationality').value.trim(),
    bloodGroup: document.getElementById('bloodGroup').value,
    contactNumber: dom.contactNumber.value.trim(),
    email: dom.email.value.trim(),
    emergencyContact: document.getElementById('emergencyContact').value.trim(),
    address: document.getElementById('address').value.trim(),
    qualification: dom.qualification.value,
    experience: Number(dom.experience.value),
    skills: dom.skillsHidden.value,
    languages: dom.languagesHidden.value,
    certifications: document.getElementById('certifications').value.trim(),
    employeeType: (dom.form.querySelector('input[name="employeeType"]:checked') || {}).value || '',
    shiftPreference: document.getElementById('shiftPreference').value,
    joiningDate: document.getElementById('joiningDate').value,
    monthlySalary: Number(dom.monthlySalary.value),
    perDaySalary: Number(dom.perDaySalary.value) || Math.round(Number(dom.monthlySalary.value) / 30),
    availability: document.getElementById('availability').value,
    photo: dom.photoPreviewImg.hidden ? '' : dom.photoPreviewImg.src,
  };
}

async function handleSubmit(e) {
  e.preventDefault();

  const validations = [
    validateRequiredText(dom.fullName, dom.fullNameGroup, dom.fullNameError, 'Nurse name'),
    validateGender(),
    validateAge(),
    validatePhone(),
    validateEmail(),
    validateQualification(),
    validateExperience(),
    validateEmployeeType(),
    validateMonthlySalary(),
  ];

  if (validations.includes(false)) {
    shakeElement(dom.form);
    showToast('Please fix the highlighted fields.', 'error');
    return;
  }

  dom.submitBtn.classList.add('is-loading');
  dom.submitBtn.disabled = true;

  const nurse = collectNurseData(editingNurseId);

  try {
    if (editingNurseId) {
      await api.put(`/nurses/${editingNurseId}`, nurse);
      showToast(`✓ ${nurse.fullName} updated successfully!`, 'success');
      setTimeout(() => { window.location.href = 'manage-nurse.html'; }, 1200);
    } else {
      await api.post('/nurses', nurse);
      showToast(`✓ ${nurse.fullName} added successfully!`, 'success');
      resetForm();
    }
  } catch (err) {
    shakeElement(dom.form);
    showToast(err.message || 'Could not save nurse. Please try again.', 'error');
  } finally {
    dom.submitBtn.classList.remove('is-loading');
    dom.submitBtn.disabled = false;
  }
}

function resetForm() {
  dom.form.reset();
  resetSkillsCheckboxes();
  languagesChipApi.reset();
  dom.photoPreviewImg.hidden = true;
  dom.photoPlaceholder.hidden = false;
  document.querySelectorAll('.form-group').forEach((g) => {
    g.classList.remove('has-error', 'is-valid');
  });
  showPendingId();
}


/* ============================================================
   EDIT MODE — prefill form when opened as manage-nurse.html's Edit action
   ============================================================ */
let editingNurseId = null;

async function loadNurseForEdit(id) {
  try {
    return await api.get(`/nurses/${id}`);
  } catch (err) {
    return null;
  }
}

function prefillFormForEdit(nurse) {
  editingNurseId = nurse.id;

  document.getElementById('breadcrumbCurrent').textContent = 'Edit Nurse';
  document.getElementById('pageTitle').textContent = 'Edit Nurse';
  document.getElementById('formTitle').textContent = 'Edit Nurse Details';
  dom.nurseIdBadge.textContent = 'ID: ' + nurse.id;
  dom.submitBtn.querySelector('.btn-submit-text').textContent = 'Update Nurse';
  document.getElementById('cancelBtn').href = 'manage-nurse.html';

  dom.fullName.value = nurse.fullName || '';
  dom.gender.value = nurse.gender || '';
  dom.age.value = nurse.age || '';
  document.getElementById('nationality').value = nurse.nationality || '';
  document.getElementById('bloodGroup').value = nurse.bloodGroup || '';
  dom.contactNumber.value = nurse.contactNumber || '';
  dom.email.value = nurse.email || '';
  document.getElementById('emergencyContact').value = nurse.emergencyContact || '';
  document.getElementById('address').value = nurse.address || '';
  dom.qualification.value = nurse.qualification || '';
  dom.experience.value = nurse.experience || '';
  document.getElementById('certifications').value = nurse.certifications || '';
  document.getElementById('shiftPreference').value = nurse.shiftPreference || 'Day Shift';
  document.getElementById('joiningDate').value = nurse.joiningDate || '';
  dom.monthlySalary.value = nurse.monthlySalary || '';
  dom.perDaySalary.value = nurse.perDaySalary || '';
  document.getElementById('availability').value = nurse.availability || 'Available';

  if (nurse.employeeType) {
    const radio = dom.form.querySelector(`input[name="employeeType"][value="${nurse.employeeType}"]`);
    if (radio) radio.checked = true;
  }

  if (nurse.skills) setSkillsCheckboxes(nurse.skills.split(',').map((s) => s.trim()).filter(Boolean));
  if (nurse.languages) languagesChipApi.setItems(nurse.languages.split(',').map((s) => s.trim()).filter(Boolean));

  if (nurse.photo) {
    dom.photoPreviewImg.src = nurse.photo;
    dom.photoPreviewImg.hidden = false;
    dom.photoPlaceholder.hidden = true;
  }
}


/* ============================================================
   INIT
   ============================================================ */
let languagesChipApi;

async function init() {
  initPhotoUpload();
  initSalaryAutoCalc();

  initSkillsCheckboxes();
  languagesChipApi = createChipInput(dom.languagesInput, dom.languagesChips, dom.languagesHidden);

  const editId = new URLSearchParams(window.location.search).get('editId');
  const nurseToEdit = editId ? await loadNurseForEdit(editId) : null;

  if (nurseToEdit) {
    prefillFormForEdit(nurseToEdit);
  } else {
    showPendingId();
  }

  dom.form.addEventListener('submit', handleSubmit);
  dom.resetBtn.addEventListener('click', () => {
    setTimeout(resetForm, 0);
  });

  console.info('%c[NMS] Add Nurse module initialised.', 'color: #E91E63; font-weight: bold;');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

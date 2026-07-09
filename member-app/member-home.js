/**
 * ============================================================
 * MEMBER PORTAL — Home Page Logic
 * File: member-home.js
 * Renders the Short-Term / Long-Term nurse service catalog and
 * handles the "Explore More" detail modal for each service.
 * ============================================================ */

'use strict';

const SERVICES = [
  // ---------------- SHORT-TERM ----------------
  {
    id: 'home-nursing', category: 'Short-Term', icon: '<i class="fa-solid fa-house"></i>', name: 'Home Nursing',
    blurb: 'General skilled nursing care in the comfort of your home.',
    description: 'Our home nursing service brings a qualified nurse to your doorstep for routine medical care, so you or your loved one can recover in a familiar, comfortable environment without frequent hospital visits.',
    includes: ['Routine health monitoring', 'Medication management', 'Basic wound dressing', 'Coordination with your doctor'],
  },
  {
    id: 'wound-care', category: 'Short-Term', icon: '<i class="fa-solid fa-band-aid"></i>', name: 'Wound Care',
    blurb: 'Professional dressing and monitoring for wounds and ulcers.',
    description: 'Skilled wound assessment and dressing to promote faster healing and prevent infection — ideal for post-surgical wounds, diabetic ulcers, bedsores, and other chronic wounds.',
    includes: ['Wound cleaning & dressing', 'Infection monitoring', 'Pain management support', 'Healing progress tracking'],
  },
  {
    id: 'infusion', category: 'Short-Term', icon: '<i class="fa-solid fa-droplet"></i>', name: 'Infusion',
    blurb: 'Safe administration of IV fluids and medication at home.',
    description: 'Certified nurses administer intravenous fluids, antibiotics, or nutritional infusions under strict hygiene protocols — saving you a trip to the hospital or clinic.',
    includes: ['IV line insertion & monitoring', 'Medication administration', 'Vital signs check during infusion', 'Emergency-ready care'],
  },
  {
    id: 'catheterization', category: 'Short-Term', icon: '<i class="fa-solid fa-stethoscope"></i>', name: 'Catheterization',
    blurb: 'Safe catheter insertion, care, and replacement at home.',
    description: 'Trained nurses perform catheter insertion, maintenance, and replacement following clinical hygiene standards, reducing infection risk and the discomfort of hospital visits.',
    includes: ['Catheter insertion & replacement', 'Hygiene & infection control', 'Urinary output monitoring', 'Patient comfort care'],
  },
  {
    id: 'injection', category: 'Short-Term', icon: '<i class="fa-solid fa-syringe"></i>', name: 'Injection',
    blurb: 'Prescribed injections administered safely at home.',
    description: 'Whether it\'s a one-time prescription or a recurring schedule, our nurses administer intramuscular, subcutaneous, or IV injections precisely and safely at your convenience.',
    includes: ['Prescribed medication injections', 'Dosage accuracy checks', 'Post-injection monitoring', 'Safe sharps disposal'],
  },
  {
    id: 'stoma-care', category: 'Short-Term', icon: '<i class="fa-solid fa-ribbon"></i>', name: 'Stoma Care',
    blurb: 'Expert care and guidance for stoma/ostomy patients.',
    description: 'Specialized care for colostomy, ileostomy, or urostomy patients, including appliance changes, skin protection, and hands-on guidance to help patients manage their stoma confidently.',
    includes: ['Stoma appliance changes', 'Peristomal skin care', 'Leak & irritation prevention', 'Patient & family education'],
  },
  {
    id: 'vital-checks', category: 'Short-Term', icon: '<i class="fa-solid fa-chart-column"></i>', name: 'Vital Checks',
    blurb: 'Regular monitoring of blood pressure, sugar, and more.',
    description: 'Scheduled visits to monitor blood pressure, blood sugar, temperature, oxygen saturation, and pulse — keeping you and your doctor informed of any changes early.',
    includes: ['Blood pressure & pulse checks', 'Blood glucose monitoring', 'Oxygen saturation checks', 'Detailed health log for your doctor'],
  },
  {
    id: 'vaccination', category: 'Short-Term', icon: '<i class="fa-solid fa-shield-halved"></i>', name: 'Vaccination',
    blurb: 'Convenient, safe vaccination services at home.',
    description: 'Skip the clinic queue — our nurses administer scheduled vaccinations at home following cold-chain and safety protocols, for children, adults, and seniors alike.',
    includes: ['Routine & travel vaccinations', 'Cold-chain safe handling', 'Post-vaccination observation', 'Digital vaccination record'],
  },
  {
    id: 'medical-escort', category: 'Short-Term', icon: '<i class="fa-solid fa-truck-medical"></i>', name: 'Medical Escort',
    blurb: 'A trained nurse accompanies you to appointments.',
    description: 'A qualified nurse travels with the patient to hospital visits, diagnostic tests, or transfers between facilities, providing medical support and peace of mind throughout the journey.',
    includes: ['Accompaniment to appointments', 'On-the-way medical monitoring', 'Coordination with receiving facility', 'Assistance with mobility'],
  },
  {
    id: 'respite-care', category: 'Short-Term', icon: '<i class="fa-solid fa-leaf"></i>', name: 'Respite Care',
    blurb: 'Short-term relief care for family caregivers.',
    description: 'Give primary caregivers a well-deserved break. Our nurse temporarily takes over care duties for a few hours or days, ensuring the patient\'s routine continues uninterrupted.',
    includes: ['Temporary full care coverage', 'Medication & routine continuity', 'Companionship & supervision', 'Flexible short-notice scheduling'],
  },
  {
    id: 'private-nurse-hd', category: 'Short-Term', icon: '<i class="fa-solid fa-user-nurse"></i>', name: 'Private Nurse (Hourly/Daily)',
    blurb: 'One-on-one dedicated nursing by the hour or day.',
    description: 'A dedicated private nurse assigned exclusively to you or your family member, available on an hourly or daily basis for personalized attention and care.',
    includes: ['Flexible hourly/daily slots', 'One-on-one dedicated attention', 'Personalized care plan', 'Direct communication with family'],
  },
  {
    id: 'part-time-caregiver', category: 'Short-Term', icon: '<i class="fa-solid fa-handshake"></i>', name: 'Part-Time Caregiver',
    blurb: 'Assistance with daily living activities, part-time.',
    description: 'A compassionate caregiver assists with daily living activities — bathing, dressing, mobility, and meals — for a portion of the day, ideal for partial support needs.',
    includes: ['Bathing & personal hygiene help', 'Mobility & transfer assistance', 'Meal preparation support', 'Light companionship'],
  },

  // ---------------- LONG-TERM ----------------
  {
    id: 'elderly-home-care', category: 'Long-Term', icon: '<i class="fa-solid fa-person-cane"></i>', name: 'Elderly Home Care',
    blurb: 'Compassionate ongoing care tailored for seniors.',
    description: 'Comprehensive, ongoing support for elderly patients — combining medical monitoring, mobility assistance, and companionship to help seniors live safely and comfortably at home.',
    includes: ['Daily health monitoring', 'Mobility & fall prevention', 'Medication reminders', 'Emotional companionship'],
  },
  {
    id: 'home-care', category: 'Long-Term', icon: '<i class="fa-solid fa-house-chimney-medical"></i>', name: 'Home Care',
    blurb: 'Ongoing general care and support at home.',
    description: 'Continuous, non-medical and semi-medical support for patients who need consistent daily assistance at home over an extended period, adapting as needs change.',
    includes: ['Daily living assistance', 'Household health routines', 'Regular progress updates', 'Flexible long-term scheduling'],
  },
  {
    id: 'caregiver', category: 'Long-Term', icon: '<i class="fa-solid fa-hands-holding"></i>', name: 'Caregiver',
    blurb: 'Dedicated caregiver for continuous daily support.',
    description: 'A dedicated caregiver providing continuous hands-on support with daily activities, hygiene, mobility, and companionship for patients needing ongoing assistance.',
    includes: ['Personal hygiene & grooming', 'Mobility support', 'Meal planning & feeding assistance', 'Daily activity companionship'],
  },
  {
    id: 'private-nurse-monthly', category: 'Long-Term', icon: '<i class="fa-solid fa-calendar-days"></i>', name: 'Private Nurse (Monthly)',
    blurb: 'A dedicated private nurse on a monthly contract.',
    description: 'A dedicated, vetted private nurse assigned on a monthly basis for consistent, long-term one-on-one care — ideal for patients requiring stable, familiar caregiving.',
    includes: ['Monthly dedicated assignment', 'Consistent care continuity', 'Comprehensive monthly health report', 'Priority scheduling & support'],
  },
  {
    id: 'intensive-care', category: 'Long-Term', icon: '<i class="fa-solid fa-hospital"></i>', name: 'Intensive Care',
    blurb: 'High-dependency nursing care for critical patients.',
    description: 'Advanced, high-dependency nursing care at home for critically ill patients requiring close monitoring, specialized equipment handling, and rapid clinical response.',
    includes: ['Continuous critical monitoring', 'Ventilator/oxygen support handling', 'Emergency response readiness', 'Close doctor coordination'],
  },
  {
    id: 'pulmonary-care', category: 'Long-Term', icon: '<i class="fa-solid fa-lungs"></i>', name: 'Pulmonary Care',
    blurb: 'Specialized care for chronic respiratory conditions.',
    description: 'Focused care for patients with chronic respiratory conditions such as COPD or asthma, including breathing support, oxygen therapy management, and respiratory exercises.',
    includes: ['Oxygen therapy management', 'Breathing exercise guidance', 'Nebulization support', 'Respiratory symptom monitoring'],
  },
  {
    id: 'dementia-care', category: 'Long-Term', icon: '<i class="fa-solid fa-brain"></i>', name: 'Dementia Care',
    blurb: 'Specialized, patient support for memory-related conditions.',
    description: 'Specially trained caregivers provide patient, structured support for individuals with dementia or Alzheimer\'s, focusing on safety, routine, and cognitive engagement.',
    includes: ['Safety & wandering prevention', 'Structured daily routines', 'Cognitive engagement activities', 'Family guidance & support'],
  },
  {
    id: 'palliative-care', category: 'Long-Term', icon: '<i class="fa-solid fa-dove"></i>', name: 'Palliative Care',
    blurb: 'Comfort-focused care for serious, chronic illness.',
    description: 'Compassionate, comfort-centered care focused on relieving pain and symptoms for patients with serious or terminal illness, supporting both patient and family.',
    includes: ['Pain & symptom management', 'Emotional & psychological support', 'Comfort-focused nursing', 'Family counseling support'],
  },
  {
    id: 'bedridden-care', category: 'Long-Term', icon: '<i class="fa-solid fa-bed-pulse"></i>', name: 'Bedridden Patient Care',
    blurb: 'Full-time care for patients confined to bed.',
    description: 'Complete, round-the-clock support for bedridden patients — covering hygiene, repositioning to prevent bedsores, feeding, and constant monitoring.',
    includes: ['Regular repositioning (bedsore prevention)', 'Feeding & hydration assistance', 'Full hygiene care', 'Continuous monitoring'],
  },
  {
    id: 'rehabilitation-care', category: 'Long-Term', icon: '<i class="fa-solid fa-dumbbell"></i>', name: 'Rehabilitation Care',
    blurb: 'Support through recovery and physical rehabilitation.',
    description: 'Dedicated support through post-injury, post-surgery, or post-stroke recovery, assisting with prescribed exercises, mobility training, and steady progress tracking.',
    includes: ['Guided mobility & exercise support', 'Recovery progress tracking', 'Coordination with physiotherapists', 'Motivation & encouragement'],
  },
];

const dom = {
  heroGreeting: document.getElementById('heroGreeting'),
  shortTermGrid: document.getElementById('shortTermGrid'),
  longTermGrid: document.getElementById('longTermGrid'),

  serviceModal: document.getElementById('serviceModal'),
  serviceModalClose: document.getElementById('serviceModalClose'),
  serviceModalIcon: document.getElementById('serviceModalIcon'),
  serviceModalTitle: document.getElementById('serviceModalTitle'),
  serviceModalCategory: document.getElementById('serviceModalCategory'),
  serviceModalDesc: document.getElementById('serviceModalDesc'),
  serviceModalIncludes: document.getElementById('serviceModalIncludes'),
  serviceModalRequestBtn: document.getElementById('serviceModalRequestBtn'),
};

function setGreeting() {
  const hour = new Date().getHours();
  let greeting = 'Good evening 🌙';
  if (hour < 12) greeting = 'Good morning ☀️';
  else if (hour < 17) greeting = 'Good afternoon 🌤️';
  dom.heroGreeting.textContent = greeting;
}

function buildServiceCard(service) {
  const card = document.createElement('div');
  card.className = 'service-card';
  card.innerHTML = `
    <div class="service-card-icon">${service.icon}</div>
    <div class="service-card-name">${service.name}</div>
    <div class="service-card-blurb">${service.blurb}</div>
    <button class="service-card-explore" data-service-id="${service.id}">
      Explore More
      <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 10h12M11 5l5 5-5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
  `;
  return card;
}

function renderServices() {
  SERVICES.filter((s) => s.category === 'Short-Term').forEach((s) => dom.shortTermGrid.appendChild(buildServiceCard(s)));
  SERVICES.filter((s) => s.category === 'Long-Term').forEach((s) => dom.longTermGrid.appendChild(buildServiceCard(s)));
}

function openServiceModal(serviceId) {
  const service = SERVICES.find((s) => s.id === serviceId);
  if (!service) return;

  dom.serviceModalIcon.innerHTML = service.icon;
  dom.serviceModalTitle.textContent = service.name;
  dom.serviceModalCategory.textContent = service.category + ' Nurse';
  dom.serviceModalDesc.textContent = service.description;
  dom.serviceModalIncludes.innerHTML = service.includes.map((item) => `<li>${item}</li>`).join('');

  dom.serviceModal.hidden = false;
  document.body.style.overflow = 'hidden';
}

function closeServiceModal() {
  dom.serviceModal.hidden = true;
  document.body.style.overflow = '';
}

function init() {
  setGreeting();
  renderServices();
  renderBottomNav('home');

  document.addEventListener('click', (e) => {
    const exploreBtn = e.target.closest('.service-card-explore');
    if (exploreBtn) openServiceModal(exploreBtn.dataset.serviceId);
  });

  dom.serviceModalClose.addEventListener('click', closeServiceModal);
  dom.serviceModal.addEventListener('click', (e) => {
    if (e.target === dom.serviceModal) closeServiceModal();
  });
  dom.serviceModalRequestBtn.addEventListener('click', () => {
    window.location.href = 'member-nurses.html';
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !dom.serviceModal.hidden) closeServiceModal();
  });

  console.info('%c[NMS] Member Home module initialised.', 'color: #E91E63; font-weight: bold;');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

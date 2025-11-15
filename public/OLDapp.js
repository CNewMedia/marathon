// Loch Ness Marathon Trainer - COMPLETE
const supabase = window.supabase.createClient(CONFIG.supabase.url, CONFIG.supabase.anonKey);

const trainingPlan = {
  phases: [
    { name: "Fase 1 - Terug in beweging", weeks: [1, 2, 3, 4], description: "Run-walk, trap lopen zonder buiten adem", weeklyMinutes: "150-180'", workouts: [
        { type: "Run-Walk", description: "10×(1' jog / 2' wandelen)", day: "Maandag" },
        { type: "Kracht", description: "30-40' heup/bil, kuit, core", day: "Dinsdag" },
        { type: "Alternatief", description: "35' stevig wandelen", day: "Woensdag" },
        { type: "Rust", description: "Volledige rustdag", day: "Donderdag" },
        { type: "Run-Walk", description: "8×(2' jog / 2' wandel)", day: "Vrijdag" },
        { type: "Kracht", description: "30-40' heup/bil, kuit, core", day: "Zaterdag" },
        { type: "Lange Duur", description: "45-50' run-walk (Z2)", day: "Zondag" }
      ]
    },
    { name: "Fase 2 - Basis opbouwen", weeks: [5, 6, 7, 8, 9, 10, 11, 12], description: "25-35 km/week", weeklyMinutes: "180-220'", workouts: [
        { type: "Z2 Duur", description: "45-60' comfortabel tempo", day: "Maandag" },
        { type: "Kracht", description: "30-40' spierversterking", day: "Dinsdag" },
        { type: "Strides", description: "6-8×15-20\" vlot", day: "Woensdag" },
        { type: "Rust", description: "Volledige rustdag", day: "Donderdag" },
        { type: "Z2 Duur", description: "50-70' comfortabel", day: "Vrijdag" },
        { type: "Kracht", description: "30-40' spierversterking", day: "Zaterdag" },
        { type: "Lange Duur", description: "75-90' Z2", day: "Zondag" }
      ]
    },
    { name: "Fase 3 - Uitbouwen", weeks: [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28], description: "35-45 km/week", weeklyMinutes: "220-260'", workouts: [
        { type: "Z2 Duur", description: "60-75' comfortabel", day: "Maandag" },
        { type: "Kracht", description: "30-40' + mobility", day: "Dinsdag" },
        { type: "Tempo", description: "4-6×5' vlot", day: "Woensdag" },
        { type: "Rust", description: "Actief herstel", day: "Donderdag" },
        { type: "Z2 Duur", description: "45-60' easy", day: "Vrijdag" },
        { type: "Kracht", description: "30-40' + core", day: "Zaterdag" },
        { type: "Lange Duur", description: "1u45-2u15 Z2", day: "Zondag" }
      ]
    },
    { name: "Fase 4 - Marathonspecifiek", weeks: [29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42], description: "45-60 km/week", weeklyMinutes: "260-320'", workouts: [
        { type: "Kracht", description: "30' onderhoud", day: "Maandag" },
        { type: "Z2 + Strides", description: "45-60' Z2 + strides", day: "Dinsdag" },
        { type: "Easy", description: "30-40' herstel", day: "Woensdag" },
        { type: "Marathon Tempo", description: "2×20' aan MT", day: "Donderdag" },
        { type: "Rust", description: "Volledige rust", day: "Vrijdag" },
        { type: "Z2 Duur", description: "60-75' Z2", day: "Zaterdag" },
        { type: "Lange Duur", description: "2u45-3u15", day: "Zondag" }
      ]
    },
    { name: "Fase 5 - Taper", weeks: [43, 44, 45], description: "Volume afbouwen", weeklyMinutes: "Aflopend", workouts: [
        { type: "Kracht", description: "Licht 20'", day: "Maandag" },
        { type: "Easy", description: "30-40' ontspannen", day: "Dinsdag" },
        { type: "Rust", description: "Focus op herstel", day: "Woensdag" },
        { type: "Tempo", description: "3×5' aan MT", day: "Donderdag" },
        { type: "Rust", description: "Slapen en laden!", day: "Vrijdag" },
        { type: "Easy", description: "20-30' licht", day: "Zaterdag" },
        { type: "Lange Duur", description: "Aflopend", day: "Zondag" }
      ]
    }
  ]
};

let completedWorkouts = new Set();
let currentWeekNumber = 1;
let currentStep = 1;
let userData = { name: '', experience: '', currentKm: 0, longestRun: 0, sessionsPerWeek: 4, timePerSession: 60, goal: 'finish', targetTime: '' };

document.addEventListener('DOMContentLoaded', () => {
  loadProgress();
  showWelcome();
});

function saveProgress() {
  localStorage.setItem('marathonProgress', JSON.stringify({ completedWorkouts: Array.from(completedWorkouts), currentWeek: currentWeekNumber, userData }));
}

function loadProgress() {
  const saved = localStorage.getItem('marathonProgress');
  if (saved) {
    const progress = JSON.parse(saved);
    completedWorkouts = new Set(progress.completedWorkouts || []);
    currentWeekNumber = progress.currentWeek || 1;
    if (progress.userData) userData = progress.userData;
  }
}

function getPhaseForWeek(weekNum) {
  for (let phase of trainingPlan.phases) {
    if (phase.weeks.includes(weekNum)) return phase;
  }
  return trainingPlan.phases[0];
}

function showWelcome() {
  document.getElementById('app').innerHTML = '<div class="welcome-screen"><div class="welcome-card"><div class="logo">🏃‍♂️</div><h1>Loch Ness Marathon Trainer</h1><p class="subtitle">AI-Powered Persoonlijk Trainingsschema</p><div class="input-group"><label class="input-label">Hoe mogen we je noemen?</label><input type="text" id="userName" class="input-field" placeholder="Vul je naam in" value="' + (userData.name || '') + '"></div><button class="btn" onclick="startOnboarding()">🚀 Start Jouw Training</button>' + (userData.name ? '<button class="btn btn-secondary" onclick="showDashboard()">📊 Ga naar Dashboard</button>' : '') + '</div></div>';
  setTimeout(() => document.getElementById('userName')?.focus(), 100);
}

function startOnboarding() {
  const name = document.getElementById('userName')?.value.trim();
  if (!name) { alert('Vul je naam in!'); return; }
  userData.name = name;
  currentStep = 1;
  showOnboardingStep(1);
}

function showOnboardingStep(step) {
  currentStep = step;
  const steps = ['Niveau', 'Beschikbaarheid', 'Doelen', 'Gezondheid', 'Overzicht'];
  
  let content = '';
  if (step === 1) {
    content = '<h2 class="question-title">Wat is je huidige loopniveau?</h2><p class="question-subtitle">Dit helpt ons je schema af te stemmen</p><div class="option-grid"><div class="option-card" onclick="selectOption(\'experience\', \'beginner\')"><div class="option-icon">🌱</div><div class="option-title">Beginner</div><div class="option-desc">0-10 km/week</div></div><div class="option-card" onclick="selectOption(\'experience\', \'intermediate\')"><div class="option-icon">🏃</div><div class="option-title">Gemiddeld</div><div class="option-desc">10-25 km/week</div></div><div class="option-card" onclick="selectOption(\'experience\', \'advanced\')"><div class="option-icon">⚡</div><div class="option-title">Gevorderd</div><div class="option-desc">25+ km/week</div></div></div>';
  } else if (step === 2) {
    content = '<h2 class="question-title">Hoeveel keer per week kun je trainen?</h2><p class="question-subtitle">We passen het schema aan</p><div class="slider-container"><input type="range" class="slider" id="sessionsSlider" min="3" max="6" value="4" oninput="document.getElementById(\'sessionsValue\').textContent = this.value"><div class="slider-value"><span id="sessionsValue">4</span> trainingen/week</div></div>';
  } else if (step === 3) {
    content = '<h2 class="question-title">Wat is je doel?</h2><p class="question-subtitle">Dit bepaalt de intensiteit</p><div class="option-grid"><div class="option-card" onclick="selectOption(\'goal\', \'finish\')"><div class="option-icon">🎯</div><div class="option-title">Finishen</div></div><div class="option-card" onclick="selectOption(\'goal\', \'time\')"><div class="option-icon">⏱️</div><div class="option-title">Tijd Doel</div></div></div>';
  } else if (step === 4) {
    content = '<h2 class="question-title">Medische overwegingen</h2><p class="question-subtitle">Dit helpt ons een veilig schema te maken</p><div class="alert alert-warning"><span>⚠️</span><span>Deze info wordt gebruikt om je schema aan te passen</span></div><div class="input-group"><label class="input-label">Blessure geschiedenis (optioneel)</label><textarea id="injuries" class="input-field" placeholder="bijv. knieklachten..." style="min-height: 80px;"></textarea></div>';
  } else if (step === 5) {
    content = '<h2 class="question-title">Jouw Samenvatting</h2><p class="question-subtitle">Controleer je gegevens</p><div class="summary-grid"><div class="summary-card"><div class="summary-label">Naam</div><div class="summary-value">' + userData.name + '</div></div><div class="summary-card"><div class="summary-label">Niveau</div><div class="summary-value">' + (userData.experience || 'Niet ingevuld') + '</div></div><div class="summary-card"><div class="summary-label">Trainingen/Week</div><div class="summary-value">' + userData.sessionsPerWeek + 'x</div></div><div class="summary-card"><div class="summary-label">Doel</div><div class="summary-value">' + (userData.goal === 'finish' ? 'Finishen' : 'Tijd') + '</div></div></div>';
  }
  
  document.getElementById('app').innerHTML = '<div class="container"><div class="onboarding-container"><div class="progress-bar-container"><div class="progress-steps">' + steps.map((s, i) => '<div class="progress-step ' + (i + 1 === step ? 'active' : i + 1 < step ? 'completed' : '') + '"><div class="step-number">' + (i + 1) + '</div><div class="step-label">' + s + '</div></div>').join('') + '</div></div><div class="onboarding-card">' + content + '<div class="navigation-buttons">' + (step > 1 ? '<button class="btn btn-secondary" onclick="goToStep(' + (step - 1) + ')">← Terug</button>' : '') + '<button class="btn" onclick="' + (step < 5 ? 'goToStep(' + (step + 1) + ')' : 'finishOnboarding()') + '">' + (step < 5 ? 'Volgende →' : '✨ Naar Dashboard') + '</button></div></div></div></div>';
}

function selectOption(key, value) {
  userData[key] = value;
  document.querySelectorAll('.option-card').forEach(c => c.classList.remove('selected'));
  event.target.closest('.option-card').classList.add('selected');
}

function goToStep(step) {
  if (currentStep === 2) userData.sessionsPerWeek = document.getElementById('sessionsSlider')?.value || 4;
  if (currentStep === 4) userData.injuries = document.getElementById('injuries')?.value || '';
  showOnboardingStep(step);
}

function finishOnboarding() {
  saveProgress();
  showDashboard();
}

function showDashboard() {
  const totalWorkouts = 45 * 6;
  const completedCount = completedWorkouts.size;
  const progressPercent = Math.min((completedCount / totalWorkouts) * 100, 100);
  const currentPhase = getPhaseForWeek(currentWeekNumber);
  
  document.getElementById('app').innerHTML = '<div class="container"><div class="header"><h1>🏃‍♂️ Loch Ness Marathon Trainer Pro</h1><p class="subtitle">Je persoonlijke 45-weken trainingsschema</p><div class="race-info"><div class="info-item"><span class="info-icon">📅</span><div><div style="font-weight: 600;">Racedag</div><div style="font-size: 0.9em; color: var(--text-secondary);">27 september 2026</div></div></div><div class="info-item"><span class="info-icon">📍</span><div><div style="font-weight: 600;">Locatie</div><div style="font-size: 0.9em; color: var(--text-secondary);">Loch Ness, Schotland</div></div></div></div></div><div class="dashboard"><div class="card"><div class="card-header"><h3 class="card-title">Totale Voortgang</h3><span class="card-icon">📊</span></div><div class="progress-ring"><svg width="150" height="150"><circle class="progress-ring-circle" cx="75" cy="75" r="65"></circle><circle class="progress-ring-progress" cx="75" cy="75" r="65" style="stroke-dasharray: ' + (2 * Math.PI * 65) + '; stroke-dashoffset: ' + (2 * Math.PI * 65 * (1 - progressPercent / 100)) + ';"></circle></svg><div class="progress-text"><div class="progress-value">' + Math.round(progressPercent) + '%</div><div class="progress-label">Voltooid</div></div></div></div><div class="card"><div class="card-header"><h3 class="card-title">Statistieken</h3><span class="card-icon">📈</span></div><div class="stat-grid"><div class="stat-item"><div class="stat-value">' + currentWeekNumber + '</div><div class="stat-label">Huidige Week</div></div><div class="stat-item"><div class="stat-value">' + (45 - currentWeekNumber + 1) + '</div><div class="stat-label">Weken Te Gaan</div></div><div class="stat-item"><div class="stat-value">' + completedCount + '</div><div class="stat-label">Trainingen</div></div><div class="stat-item"><div class="stat-value">' + currentPhase.name.split('-')[0].trim() + '</div><div class="stat-label">Fase</div></div></div></div></div><div class="phase-selector">' + trainingPlan.phases.map((phase, idx) => '<button class="phase-btn ' + (idx === 0 ? 'active' : '') + '" onclick="filterByPhase(' + idx + ')">' + phase.name + '</button>').join('') + '</div><div class="week-calendar" id="weekCalendar">' + renderWeekCalendar() + '</div><div class="tips-section"><h3 class="tips-title">💡 Belangrijke Trainingstips</h3><div class="tip-item"><strong>10% Regel:</strong> Verhoog je lange duurloop nooit meer dan 10%.</div><div class="tip-item"><strong>Talk Test:</strong> Tijdens Z2-training moet je nog kunnen praten.</div><div class="tip-item"><strong>Voeding >90\':</strong> Neem 30-60g koolhydraten per uur.</div></div></div><div class="modal" id="weekModal"><div class="modal-content"><div class="modal-header"><h2 class="modal-title" id="modalTitle">Week Details</h2><button class="close-btn" onclick="closeModal()">&times;</button></div><div id="modalBody"></div></div></div>';
}

function renderWeekCalendar(weeks) {
  const weeksToShow = weeks || Array.from({length: 45}, (_, i) => i + 1);
  return weeksToShow.map(weekNum => {
    const phase = getPhaseForWeek(weekNum);
    const isCurrent = weekNum === currentWeekNumber;
    const weekWorkouts = phase.workouts.filter(w => w.type !== 'Rust');
    const completedCount = weekWorkouts.filter(w => completedWorkouts.has(weekNum + '-' + w.day)).length;
    const progressPercent = (completedCount / weekWorkouts.length) * 100;
    return '<div class="week-card ' + (isCurrent ? 'current' : '') + '" onclick="openWeekModal(' + weekNum + ')"><div class="week-number">Week ' + weekNum + '</div><div class="week-phase">' + phase.name + '</div><div class="week-summary">' + phase.weeklyMinutes + '</div><div class="week-summary">' + completedCount + '/' + weekWorkouts.length + ' trainingen</div><div class="week-progress"><div class="week-progress-bar" style="width: ' + progressPercent + '%"></div></div></div>';
  }).join('');
}

function filterByPhase(phaseIdx) {
  document.querySelectorAll('.phase-btn').forEach((btn, idx) => btn.classList.toggle('active', idx === phaseIdx));
  document.getElementById('weekCalendar').innerHTML = renderWeekCalendar(trainingPlan.phases[phaseIdx].weeks);
}

function openWeekModal(weekNum) {
  const phase = getPhaseForWeek(weekNum);
  document.getElementById('modalTitle').textContent = 'Week ' + weekNum + ' - ' + phase.name;
  document.getElementById('modalBody').innerHTML = '<div class="alert alert-info"><span>ℹ️</span><div><strong>Doel:</strong> ' + phase.description + '<br><strong>Totale tijd:</strong> ' + phase.weeklyMinutes + '</div></div><h3 style="margin: 20px 0 15px; color: var(--success);">Trainingen</h3><ul class="workout-list">' + phase.workouts.map(workout => {
    const workoutId = weekNum + '-' + workout.day;
    const isCompleted = completedWorkouts.has(workoutId);
    return '<li class="workout-item ' + (isCompleted ? 'completed' : '') + '" onclick="toggleWorkout(\'' + workoutId + '\', event)"><div class="workout-checkbox"></div><div style="flex: 1;"><div style="display: flex; gap: 10px; margin-bottom: 5px;"><span class="workout-type">' + workout.type + '</span><strong>' + workout.day + '</strong></div><div style="color: var(--text-secondary);">' + workout.description + '</div></div></li>';
  }).join('') + '</ul><div style="margin-top: 30px; display: flex; gap: 10px;"><button class="btn" onclick="markWeekComplete(' + weekNum + ')">Week Voltooien</button><button class="btn btn-secondary" onclick="closeModal()">Sluiten</button></div>';
  document.getElementById('weekModal').classList.add('active');
}

function closeModal() {
  document.getElementById('weekModal').classList.remove('active');
}

function toggleWorkout(workoutId, event) {
  event.stopPropagation();
  if (completedWorkouts.has(workoutId)) completedWorkouts.delete(workoutId);
  else completedWorkouts.add(workoutId);
  saveProgress();
  const weekNum = parseInt(workoutId.split('-')[0]);
  showDashboard();
  setTimeout(() => openWeekModal(weekNum), 100);
}

function markWeekComplete(weekNum) {
  const phase = getPhaseForWeek(weekNum);
  phase.workouts.forEach(w => completedWorkouts.add(weekNum + '-' + w.day));
  if (weekNum === currentWeekNumber) currentWeekNumber++;
  saveProgress();
  closeModal();
  showDashboard();
}

document.addEventListener('click', e => {
  if (e.target === document.getElementById('weekModal')) closeModal();
});

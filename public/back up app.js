// Loch Ness Marathon Trainer - IMPROVED VERSION
const supabase = window.supabase.createClient(CONFIG.supabase.url, CONFIG.supabase.anonKey);

let completedWorkouts = new Set();
let currentWeekNumber = 1;
let currentStep = 1;
let generatedPlan = null;

let userData = {
  name: '', age: '', gender: '', weight: '', height: '',
  runningYears: '', experience: '', currentKmPerWeek: 0, longestRun: 0,
  previousMarathons: 0, previousMarathonTime: '',
  trainingHistory: '', // NIEUW
  injuries: '', medications: '',
  sessionsPerWeek: 4, timePerSession: 60,
  goal: 'finish', targetTime: '',
  strengthTraining: false, sleepHours: 7
};

document.addEventListener('DOMContentLoaded', () => {
  loadProgress();
  showWelcome();
});

function saveProgress() {
  localStorage.setItem('marathonProgress', JSON.stringify({
    completedWorkouts: Array.from(completedWorkouts),
    currentWeek: currentWeekNumber,
    userData,
    generatedPlan
  }));
}

function loadProgress() {
  const saved = localStorage.getItem('marathonProgress');
  if (saved) {
    const progress = JSON.parse(saved);
    completedWorkouts = new Set(progress.completedWorkouts || []);
    currentWeekNumber = progress.currentWeek || 1;
    if (progress.userData) userData = progress.userData;
    if (progress.generatedPlan) generatedPlan = progress.generatedPlan;
  }
}

function getPhaseForWeek(weekNum) {
  if (!generatedPlan || !generatedPlan.phases) return null;
  for (let phase of generatedPlan.phases) {
    if (phase.weeks.includes(weekNum)) return phase;
  }
  return generatedPlan.phases[0];
}

function getCurrentPhaseIndex() {
  if (!generatedPlan || !generatedPlan.phases) return 0;
  for (let i = 0; i < generatedPlan.phases.length; i++) {
    if (generatedPlan.phases[i].weeks.includes(currentWeekNumber)) return i;
  }
  return 0;
}

function showWelcome() {
  document.getElementById('app').innerHTML = `
    <div class="welcome-screen">
      <div class="welcome-card">
        <div class="logo">🏃‍♂️</div>
        <h1>Loch Ness Marathon Trainer</h1>
        <p class="subtitle">AI-Powered Persoonlijk Trainingsschema</p>
        <div class="input-group">
          <label class="input-label">Hoe mogen we je noemen?</label>
          <input type="text" id="userName" class="input-field" placeholder="Vul je naam in" value="${userData.name || ''}">
        </div>
        <button class="btn" onclick="startOnboarding()">🚀 Start Jouw Training</button>
        ${userData.name && generatedPlan ? '<button class="btn btn-secondary" onclick="showDashboard()">📊 Ga naar Dashboard</button>' : ''}
      </div>
    </div>
  `;
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
  const steps = ['Persoonlijk', 'Sportief', 'Historiek', 'Gezondheid', 'Beschikbaarheid', 'Doelen', 'Overzicht'];
  let content = '';
  
  if (step === 1) {
    content = `
      <h2 class="question-title">Persoonlijke Gegevens</h2>
      <p class="question-subtitle">We gebruiken dit om je schema te personaliseren</p>
      <div class="input-group">
        <label class="input-label">Leeftijd (jaren)</label>
        <input type="number" id="age" class="input-field" placeholder="bijv. 35" min="18" max="80" value="${userData.age}">
      </div>
      <div class="input-group">
        <label class="input-label">Geslacht</label>
        <div class="option-grid">
          <div class="option-card ${userData.gender === 'M' ? 'selected' : ''}" onclick="selectOption('gender', 'M')">
            <div class="option-icon">👨</div>
            <div class="option-title">Man</div>
          </div>
          <div class="option-card ${userData.gender === 'V' ? 'selected' : ''}" onclick="selectOption('gender', 'V')">
            <div class="option-icon">👩</div>
            <div class="option-title">Vrouw</div>
          </div>
          <div class="option-card ${userData.gender === 'X' ? 'selected' : ''}" onclick="selectOption('gender', 'X')">
            <div class="option-icon">🧑</div>
            <div class="option-title">Anders</div>
          </div>
        </div>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
        <div class="input-group">
          <label class="input-label">Gewicht (kg)</label>
          <input type="number" id="weight" class="input-field" placeholder="bijv. 75" min="40" max="150" value="${userData.weight}">
        </div>
        <div class="input-group">
          <label class="input-label">Lengte (cm)</label>
          <input type="number" id="height" class="input-field" placeholder="bijv. 180" min="140" max="220" value="${userData.height}">
        </div>
      </div>
    `;
  } else if (step === 2) {
    content = `
      <h2 class="question-title">Sportieve Achtergrond</h2>
      <p class="question-subtitle">Vertel ons over je loop ervaring</p>
      <div class="input-group">
        <label class="input-label">Hoe lang loop je al?</label>
        <div class="option-grid">
          <div class="option-card ${userData.runningYears === '<1' ? 'selected' : ''}" onclick="selectOption('runningYears', '<1')">
            <div class="option-icon">🌱</div>
            <div class="option-title">< 1 jaar</div>
          </div>
          <div class="option-card ${userData.runningYears === '1-2' ? 'selected' : ''}" onclick="selectOption('runningYears', '1-2')">
            <div class="option-icon">🏃</div>
            <div class="option-title">1-2 jaar</div>
          </div>
          <div class="option-card ${userData.runningYears === '2-5' ? 'selected' : ''}" onclick="selectOption('runningYears', '2-5')">
            <div class="option-icon">⚡</div>
            <div class="option-title">2-5 jaar</div>
          </div>
          <div class="option-card ${userData.runningYears === '5+' ? 'selected' : ''}" onclick="selectOption('runningYears', '5+')">
            <div class="option-icon">🏆</div>
            <div class="option-title">5+ jaar</div>
          </div>
        </div>
      </div>
      <div class="input-group">
        <label class="input-label">Huidige Niveau</label>
        <div class="option-grid">
          <div class="option-card ${userData.experience === 'beginner' ? 'selected' : ''}" onclick="selectOption('experience', 'beginner')">
            <div class="option-icon">🌱</div>
            <div class="option-title">Beginner</div>
            <div class="option-desc">0-10 km/week</div>
          </div>
          <div class="option-card ${userData.experience === 'intermediate' ? 'selected' : ''}" onclick="selectOption('experience', 'intermediate')">
            <div class="option-icon">🏃</div>
            <div class="option-title">Gemiddeld</div>
            <div class="option-desc">10-30 km/week</div>
          </div>
          <div class="option-card ${userData.experience === 'advanced' ? 'selected' : ''}" onclick="selectOption('experience', 'advanced')">
            <div class="option-icon">⚡</div>
            <div class="option-title">Gevorderd</div>
            <div class="option-desc">30+ km/week</div>
          </div>
        </div>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
        <div class="input-group">
          <label class="input-label">Huidige km/week</label>
          <input type="number" id="currentKm" class="input-field" placeholder="bijv. 20" min="0" max="100" value="${userData.currentKmPerWeek}">
        </div>
        <div class="input-group">
          <label class="input-label">Langste loop (min)</label>
          <input type="number" id="longestRun" class="input-field" placeholder="bijv. 60" min="0" max="240" value="${userData.longestRun}">
        </div>
      </div>
    `;
  } else if (step === 3) {
    content = `
      <h2 class="question-title">Trainingshistoriek</h2>
      <p class="question-subtitle">Dit helpt ons je opbouw beter af te stemmen</p>
      <div class="input-group">
        <label class="input-label">Beschrijf je training van de laatste 6 maanden</label>
        <textarea id="trainingHistory" class="input-field" placeholder="bijv. 3x per week 5km gelopen, 1x krachttraining, gestopt tijdens zomervakantie..." style="min-height: 120px; font-family: inherit;">${userData.trainingHistory}</textarea>
        <small style="color: var(--text-secondary); display: block; margin-top: 8px;">
          Vertel over frequentie, afstanden, rustperiodes, blessures, etc.
        </small>
      </div>
    `;
  } else if (step === 4) {
    content = `
      <h2 class="question-title">Gezondheid</h2>
      <p class="question-subtitle">Voor een veilig trainingsplan</p>
      <div class="alert alert-warning">
        <span style="font-size: 1.5em;">⚠️</span>
        <div><strong>Medisch:</strong> Raadpleeg een arts voordat je begint met intensief trainen.</div>
      </div>
      <div class="input-group">
        <label class="input-label">Blessures (laatste 2 jaar)</label>
        <textarea id="injuries" class="input-field" placeholder="bijv. knie, achillespees..." style="min-height: 80px; font-family: inherit;">${userData.injuries}</textarea>
      </div>
      <div class="input-group">
        <label class="input-label">Medicatie (indien relevant)</label>
        <textarea id="medications" class="input-field" placeholder="indien van toepassing..." style="min-height: 60px; font-family: inherit;">${userData.medications}</textarea>
      </div>
    `;
  } else if (step === 5) {
    content = `
      <h2 class="question-title">Beschikbaarheid</h2>
      <p class="question-subtitle">Afgestemd op jouw leven</p>
      <div class="input-group">
        <label class="input-label">Hoeveel trainingen per week?</label>
        <small style="color: var(--text-secondary); display: block; margin-bottom: 12px;">
          (inclusief kracht/cross-training, minimum 3 loopsessies)
        </small>
        <div class="slider-container">
          <input type="range" class="slider" id="sessionsSlider" min="3" max="6" value="${userData.sessionsPerWeek}" oninput="document.getElementById('sessionsValue').textContent = this.value">
          <div class="slider-value"><span id="sessionsValue">${userData.sessionsPerWeek}</span> trainingen/week</div>
        </div>
      </div>
      <div class="input-group">
        <label class="input-label">Gemiddelde tijd per training</label>
        <div class="option-grid">
          <div class="option-card ${userData.timePerSession === 30 ? 'selected' : ''}" onclick="selectOption('timePerSession', 30)">
            <div class="option-title">30-45 min</div>
          </div>
          <div class="option-card ${userData.timePerSession === 60 ? 'selected' : ''}" onclick="selectOption('timePerSession', 60)">
            <div class="option-title">45-75 min</div>
          </div>
          <div class="option-card ${userData.timePerSession === 90 ? 'selected' : ''}" onclick="selectOption('timePerSession', 90)">
            <div class="option-title">75-120 min</div>
          </div>
        </div>
      </div>
      <div class="input-group">
        <label class="input-label">Ervaring met krachttraining?</label>
        <div class="option-grid">
          <div class="option-card ${userData.strengthTraining ? 'selected' : ''}" onclick="selectOption('strengthTraining', true)">
            <div class="option-icon">💪</div>
            <div class="option-title">Ja</div>
          </div>
          <div class="option-card ${!userData.strengthTraining ? 'selected' : ''}" onclick="selectOption('strengthTraining', false)">
            <div class="option-icon">❌</div>
            <div class="option-title">Nee</div>
          </div>
        </div>
      </div>
    `;
  } else if (step === 6) {
    content = `
      <h2 class="question-title">Jouw Doel</h2>
      <p class="question-subtitle">27 september 2026</p>
      <div class="input-group">
        <label class="input-label">Hoofddoel</label>
        <div class="option-grid">
          <div class="option-card ${userData.goal === 'finish' ? 'selected' : ''}" onclick="selectOption('goal', 'finish')">
            <div class="option-icon">🎯</div>
            <div class="option-title">Finishen</div>
            <div class="option-desc">Gezond de finish halen</div>
          </div>
          <div class="option-card ${userData.goal === 'time' ? 'selected' : ''}" onclick="selectOption('goal', 'time')">
            <div class="option-icon">⏱️</div>
            <div class="option-title">Tijd Doel</div>
            <div class="option-desc">Specifieke finish tijd</div>
          </div>
        </div>
      </div>
      <div id="targetTimeGroup" style="display: ${userData.goal === 'time' ? 'block' : 'none'};">
        <div class="input-group">
          <label class="input-label">Doel Finish Tijd</label>
          <div style="display: flex; gap: 10px; align-items: center;">
            <input type="number" id="targetHours" class="input-field" placeholder="uren" min="2" max="7" value="${userData.targetTime.split(':')[0] || ''}" style="width: 100px;">
            <span style="font-size: 1.5em;">:</span>
            <input type="number" id="targetMinutes" class="input-field" placeholder="min" min="0" max="59" value="${userData.targetTime.split(':')[1] || ''}" style="width: 100px;">
          </div>
        </div>
      </div>
    `;
  } else if (step === 7) {
    const bmi = userData.weight && userData.height ? (userData.weight / Math.pow(userData.height / 100, 2)).toFixed(1) : 'N/A';
    content = `
      <h2 class="question-title">Overzicht</h2>
      <p class="question-subtitle">Controleer je gegevens</p>
      <div class="summary-grid">
        <div class="summary-card">
          <div class="summary-label">Naam</div>
          <div class="summary-value">${userData.name}</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">Leeftijd</div>
          <div class="summary-value">${userData.age} jaar</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">BMI</div>
          <div class="summary-value">${bmi}</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">Niveau</div>
          <div class="summary-value">${userData.experience || 'N/A'}</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">Trainingen</div>
          <div class="summary-value">${userData.sessionsPerWeek}x/week</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">Doel</div>
          <div class="summary-value">${userData.goal === 'finish' ? 'Finishen' : userData.targetTime}</div>
        </div>
      </div>
      <div class="alert alert-info">
        <span style="font-size: 1.8em;">🤖</span>
        <div><strong>AI Ready!</strong> We gaan nu je schema genereren op basis van al deze informatie.</div>
      </div>
    `;
  }
  
  document.getElementById('app').innerHTML = `
    <div class="container">
      <div class="onboarding-container">
        <div class="progress-bar-container">
          <div class="progress-steps">
            ${steps.map((s, i) => `
              <div class="progress-step ${i + 1 === step ? 'active' : i + 1 < step ? 'completed' : ''}">
                <div class="step-number">${i + 1}</div>
                <div class="step-label">${s}</div>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="onboarding-card">
          ${content}
          <div class="navigation-buttons">
            ${step > 1 ? '<button class="btn btn-secondary" onclick="goToStep(' + (step - 1) + ')">← Terug</button>' : ''}
            <button class="btn" onclick="${step < 7 ? 'goToStep(' + (step + 1) + ')' : 'generateAIPlan()'}">
              ${step < 7 ? 'Volgende →' : '✨ Genereer AI Schema'}
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function selectOption(key, value) {
  userData[key] = value;
  document.querySelectorAll('.option-card').forEach(c => c.classList.remove('selected'));
  if (event && event.target) {
    const card = event.target.closest('.option-card');
    if (card) card.classList.add('selected');
  }
  if (key === 'goal') {
    const targetTimeGroup = document.getElementById('targetTimeGroup');
    if (targetTimeGroup) {
      targetTimeGroup.style.display = value === 'time' ? 'block' : 'none';
    }
  }
}

function goToStep(step) {
  if (currentStep === 1) {
    userData.age = document.getElementById('age')?.value || '';
    userData.weight = document.getElementById('weight')?.value || '';
    userData.height = document.getElementById('height')?.value || '';
  } else if (currentStep === 2) {
    userData.currentKmPerWeek = document.getElementById('currentKm')?.value || 0;
    userData.longestRun = document.getElementById('longestRun')?.value || 0;
  } else if (currentStep === 3) {
    userData.trainingHistory = document.getElementById('trainingHistory')?.value || '';
  } else if (currentStep === 4) {
    userData.injuries = document.getElementById('injuries')?.value || '';
    userData.medications = document.getElementById('medications')?.value || '';
  } else if (currentStep === 5) {
    userData.sessionsPerWeek = document.getElementById('sessionsSlider')?.value || 4;
  } else if (currentStep === 6) {
    const hours = document.getElementById('targetHours')?.value;
    const minutes = document.getElementById('targetMinutes')?.value;
    if (hours && minutes) {
      userData.targetTime = `${hours}:${minutes}`;
    }
  }
  showOnboardingStep(step);
}

async function generateAIPlan() {
  document.getElementById('app').innerHTML = `
    <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%); color: #eee; padding: 20px;">
      <div style="background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px); border-radius: 20px; padding: 40px; max-width: 600px; text-align: center; border: 1px solid rgba(255, 255, 255, 0.2);">
        <div style="width: 80px; height: 80px; border: 6px solid rgba(255, 255, 255, 0.1); border-top-color: #4ecca3; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 30px;"></div>
        <div style="font-size: 1.5em; color: #4ecca3; margin-bottom: 10px;">🤖 AI genereert jouw schema...</div>
        <div style="color: #aaa;">Op basis van je BMI, historiek en doelen</div>
      </div>
    </div>
    <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
  `;
  
  try {
    const response = await fetch('/.netlify/functions/generate-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userData: userData })
    });
    
    const responseText = await response.text();
    const data = JSON.parse(responseText);
    generatedPlan = data.plan;
    saveProgress();
    showDashboard();
    
  } catch (error) {
    console.error('Error:', error);
    generatedPlan = createDemoPlan();
    saveProgress();
    showDashboard();
  }
}

function createDemoPlan() {
  return {
    phases: [
      { name: "Fase 1 - Terug in beweging", weeks: [1, 2, 3, 4], description: "Opbouw", weeklyMinutes: "150-180'", workouts: [
        { type: "Easy", description: "30'", day: "Maandag" },
        { type: "Kracht", description: "30'", day: "Dinsdag" },
        { type: "Easy", description: "35'", day: "Woensdag" },
        { type: "Rust", description: "", day: "Donderdag" },
        { type: "Easy", description: "30'", day: "Vrijdag" },
        { type: "Rust", description: "", day: "Zaterdag" },
        { type: "Long", description: "50'", day: "Zondag" }
      ]},
      { name: "Fase 2 - Basis opbouwen", weeks: [5, 6, 7, 8], description: "Volume", weeklyMinutes: "200'", workouts: [
        { type: "Easy", description: "45'", day: "Maandag" },
        { type: "Kracht", description: "35'", day: "Dinsdag" },
        { type: "Tempo", description: "40'", day: "Woensdag" },
        { type: "Rust", description: "", day: "Donderdag" },
        { type: "Easy", description: "40'", day: "Vrijdag" },
        { type: "Rust", description: "", day: "Zaterdag" },
        { type: "Long", description: "75'", day: "Zondag" }
      ]}
    ]
  };
}

function showDashboard() {
  const plan = generatedPlan || createDemoPlan();
  const totalWorkouts = 45 * 6;
  const completedCount = completedWorkouts.size;
  const progressPercent = Math.min((completedCount / totalWorkouts) * 100, 100);
  const currentPhase = getPhaseForWeek(currentWeekNumber);
  const currentPhaseIndex = getCurrentPhaseIndex();
  
  const currentWeekWorkouts = currentPhase ? currentPhase.workouts.filter(w => w.type !== 'Rust') : [];
  const currentWeekCompleted = currentWeekWorkouts.filter(w => completedWorkouts.has(currentWeekNumber + '-' + w.day)).length;
  
  document.getElementById('app').innerHTML = `
    <div class="container">
      <div class="header">
        <h1>🏃‍♂️ Loch Ness Marathon Trainer Pro</h1>
        <p class="subtitle">Je persoonlijke 45-weken trainingsschema</p>
        <div class="race-info">
          <div class="info-item">
            <span class="info-icon">📅</span>
            <div>
              <div style="font-weight: 600;">Racedag</div>
              <div style="font-size: 0.9em; color: var(--text-secondary);">27 september 2026</div>
            </div>
          </div>
          <div class="info-item">
            <span class="info-icon">📍</span>
            <div>
              <div style="font-weight: 600;">Locatie</div>
              <div style="font-size: 0.9em; color: var(--text-secondary);">Loch Ness, Schotland</div>
            </div>
          </div>
          <div class="info-item">
            <span class="info-icon">🎯</span>
            <div>
              <div style="font-weight: 600;">Afstand</div>
              <div style="font-size: 0.9em; color: var(--text-secondary);">42.195 km</div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="dashboard-grid">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Totale Voortgang</h3>
            <span class="card-icon">📊</span>
          </div>
          <div class="progress-ring">
            <svg width="150" height="150">
              <circle class="progress-ring-circle" cx="75" cy="75" r="65"></circle>
              <circle class="progress-ring-progress" cx="75" cy="75" r="65" style="stroke-dasharray: ${2 * Math.PI * 65}; stroke-dashoffset: ${2 * Math.PI * 65 * (1 - progressPercent / 100)};"></circle>
            </svg>
            <div class="progress-text">
              <div class="progress-value">${Math.round(progressPercent)}%</div>
              <div class="progress-label">Voltooid</div>
            </div>
          </div>
        </div>
        
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Week Statistieken</h3>
            <span class="card-icon">📈</span>
          </div>
          <div class="stat-grid">
            <div class="stat-item">
              <div class="stat-value">${currentWeekNumber}</div>
              <div class="stat-label">Huidige Week</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">${45 - currentWeekNumber + 1}</div>
              <div class="stat-label">Weken Te Gaan</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">${completedCount}</div>
              <div class="stat-label">Trainingen Voltooid</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">${currentPhase ? currentPhase.name.split('-')[0].trim() : 'Fase 1'}</div>
              <div class="stat-label">Huidige Fase</div>
            </div>
          </div>
        </div>
        
        <div class="card current-week-card">
          <div class="card-header">
            <h3 class="card-title">Deze Week</h3>
            <span class="card-icon">🎯</span>
          </div>
          <div style="text-align: center; margin: 20px 0;">
            <div style="font-size: 2.5em; color: var(--success); font-weight: 700; margin-bottom: 5px;">
              ${currentWeekCompleted}/${currentWeekWorkouts.length}
            </div>
            <div style="color: var(--text-secondary); margin-bottom: 15px;">Trainingen</div>
            <div style="color: var(--text-secondary); font-size: 0.9em; margin-bottom: 15px;">
              ${currentPhase ? currentPhase.weeklyMinutes : ''} totaal gepland
            </div>
          </div>
          <button class="btn" onclick="openWeekModal(${currentWeekNumber})" style="width: 100%;">
            Bekijk Week ${currentWeekNumber}
          </button>
        </div>
      </div>
      
      <div class="phase-selector">
        ${plan.phases.map((phase, idx) => `<button class="phase-btn ${idx === currentPhaseIndex ? 'active' : ''}" onclick="filterByPhase(${idx})">${phase.name}</button>`).join('')}
      </div>
      
      <div class="week-calendar" id="weekCalendar">
        ${renderWeekCalendar(plan.phases[currentPhaseIndex].weeks)}
      </div>
      
      <div class="tips-section">
        <h3 class="tips-title">💡 Persoonlijke Tips</h3>
        <div class="tip-item"><strong>Voor jou:</strong> ${getPersonalizedTip()}</div>
      </div>
    </div>
    
    <div class="modal" id="weekModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2 class="modal-title" id="modalTitle">Week Details</h2>
          <button class="close-btn" onclick="closeModal()">&times;</button>
        </div>
        <div id="modalBody"></div>
      </div>
    </div>
  `;
}

function renderWeekCalendar(weeks) {
  const plan = generatedPlan || createDemoPlan();
  const weeksToShow = weeks || Array.from({length: 45}, (_, i) => i + 1);
  
  return weeksToShow.map(weekNum => {
    const phase = getPhaseForWeek(weekNum);
    if (!phase) return '';
    
    const isCurrent = weekNum === currentWeekNumber;
    const weekWorkouts = phase.workouts.filter(w => w.type !== 'Rust');
    const completedCount = weekWorkouts.filter(w => completedWorkouts.has(weekNum + '-' + w.day)).length;
    const progressPercent = weekWorkouts.length > 0 ? (completedCount / weekWorkouts.length) * 100 : 0;
    
    return `
      <div class="week-card ${isCurrent ? 'current' : ''}" onclick="openWeekModal(${weekNum})">
        <div class="week-number">Week ${weekNum}</div>
        <div class="week-phase">${phase.name}</div>
        <div class="week-summary">${phase.weeklyMinutes}</div>
        <div class="week-summary">${completedCount}/${weekWorkouts.length} trainingen</div>
        <div class="week-progress">
          <div class="week-progress-bar" style="width: ${progressPercent}%"></div>
        </div>
      </div>
    `;
  }).join('');
}

function filterByPhase(phaseIdx) {
  const plan = generatedPlan || createDemoPlan();
  document.querySelectorAll('.phase-btn').forEach((btn, idx) => btn.classList.toggle('active', idx === phaseIdx));
  document.getElementById('weekCalendar').innerHTML = renderWeekCalendar(plan.phases[phaseIdx].weeks);
}

function openWeekModal(weekNum) {
  const phase = getPhaseForWeek(weekNum);
  if (!phase) return;
  
  document.getElementById('modalTitle').textContent = 'Week ' + weekNum + ' - ' + phase.name;
  document.getElementById('modalBody').innerHTML = `
    <div class="alert alert-info">
      <span>ℹ️</span>
      <div><strong>Doel:</strong> ${phase.description}<br><strong>Totale tijd:</strong> ${phase.weeklyMinutes}</div>
    </div>
    <h3 style="margin: 20px 0 15px; color: var(--success);">Trainingen</h3>
    <ul class="workout-list">
      ${phase.workouts.map(workout => {
        const workoutId = weekNum + '-' + workout.day;
        const isCompleted = completedWorkouts.has(workoutId);
        return `
          <li class="workout-item ${isCompleted ? 'completed' : ''}" onclick="toggleWorkout('${workoutId}', event)">
            <div class="workout-checkbox"></div>
            <div style="flex: 1;">
              <div style="display: flex; gap: 10px; margin-bottom: 5px;">
                <span class="workout-type">${workout.type}</span>
                <strong>${workout.day}</strong>
              </div>
              <div style="color: var(--text-secondary);">${workout.description}</div>
            </div>
          </li>
        `;
      }).join('')}
    </ul>
    <div style="margin-top: 30px; display: flex; gap: 10px;">
      <button class="btn" onclick="markWeekComplete(${weekNum})">Week Voltooien</button>
      <button class="btn btn-secondary" onclick="closeModal()">Sluiten</button>
    </div>
  `;
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

function getPersonalizedTip() {
  const bmi = userData.weight && userData.height ? (userData.weight / Math.pow(userData.height / 100, 2)) : 0;
  
  if (bmi > 30) {
    return "Met je BMI is extra aandacht voor gewichtsbeheersing en gewrichtsbescherming belangrijk - bouw rustig op!";
  } else if (userData.age > 50) {
    return "Extra focus op herstel en mobiliteit - neem rust serieus!";
  } else if (userData.experience === 'beginner') {
    return "Begin rustig en bouw geleidelijk op - consistentie is belangrijker dan snelheid!";
  } else if (userData.injuries) {
    return "Let extra op blessure preventie - warm goed op en cool down!";
  } else if (userData.trainingHistory && userData.trainingHistory.includes('gestopt')) {
    return "Na een rustperiode is extra voorzichtig opbouwen belangrijk - neem de tijd!";
  } else {
    return "Luister naar je lichaam en geniet van het proces!";
  }
}

document.addEventListener('click', e => {
  if (e.target === document.getElementById('weekModal')) closeModal();
});

console.log('Improved Marathon Trainer loaded! 🎉');

// Add custom CSS for 3-column dashboard
const style = document.createElement('style');
style.textContent = `
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 30px;
}

@media (max-width: 1024px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}

.current-week-card {
  background: linear-gradient(135deg, rgba(233, 69, 96, 0.1), rgba(78, 204, 163, 0.1));
}
`;
document.head.appendChild(style);
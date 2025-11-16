// Loch Ness Marathon Trainer - COMPLETE AI VERSION
const supabase = window.supabase.createClient(CONFIG.supabase.url, CONFIG.supabase.anonKey);

let completedWorkouts = new Set();
let currentWeekNumber = 1;
let currentStep = 1;
let generatedPlan = null;

let userData = {
  // Stap 1: Persoonlijk
  name: '',
  age: '',
  gender: '',
  weight: '',
  height: '',
  
  // Stap 2: Sportieve Achtergrond
  runningYears: '',
  experience: '',
  currentKmPerWeek: 0,
  longestRun: 0,
  previousMarathons: 0,
  previousMarathonTime: '',
  
  // Stap 3: Gezondheid
  injuries: '',
  medications: '',
  heartRateZonesKnown: false,
  lastMedicalCheck: '',
  smokingStatus: 'never',
  
  // Stap 4: Beschikbaarheid
  sessionsPerWeek: 4,
  timePerSession: 60,
  preferredTimes: [],
  facilitiesAccess: [],
  runningEnvironment: 'mixed',
  
  // Stap 5: Doelen
  goal: 'finish',
  targetTime: '',
  raceDate: '2026-09-27',
  otherRaces: [],
  
  // Stap 6: Extra
  crossTraining: [],
  strengthTraining: false,
  nutritionPlan: false,
  sleepHours: 7
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
  const steps = ['Persoonlijk', 'Sportief', 'Gezondheid', 'Beschikbaarheid', 'Doelen', 'Extra', 'Overzicht'];
  
  let content = '';
  
  if (step === 1) {
    // Persoonlijke Gegevens
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
    // Sportieve Achtergrond
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
          <label class="input-label">Langste loop (minuten)</label>
          <input type="number" id="longestRun" class="input-field" placeholder="bijv. 60" min="0" max="240" value="${userData.longestRun}">
        </div>
      </div>
      
      <div class="input-group">
        <label class="input-label">Heb je al marathons gelopen?</label>
        <input type="number" id="previousMarathons" class="input-field" placeholder="0 = nee, anders aantal" min="0" max="50" value="${userData.previousMarathons}">
      </div>
    `;
  } else if (step === 3) {
    // Gezondheid
    content = `
      <h2 class="question-title">Gezondheid & Conditie</h2>
      <p class="question-subtitle">Belangrijk voor een veilig trainingsplan</p>
      
      <div class="alert alert-warning">
        <span style="font-size: 1.5em;">⚠️</span>
        <div>
          <strong>Medisch Advies:</strong> Raadpleeg een arts voordat je begint met intensief trainen, vooral als je ouder bent dan 40 of gezondheidsproblemen hebt.
        </div>
      </div>
      
      <div class="input-group">
        <label class="input-label">Blessure geschiedenis (laatste 2 jaar)</label>
        <textarea id="injuries" class="input-field" placeholder="bijv. knieklachten, achillespees, IT-band..." style="min-height: 80px; font-family: inherit;">${userData.injuries}</textarea>
      </div>
      
      <div class="input-group">
        <label class="input-label">Medicatie (indien relevant)</label>
        <textarea id="medications" class="input-field" placeholder="bijv. bloeddruk, astma, diabetes..." style="min-height: 60px; font-family: inherit;">${userData.medications}</textarea>
      </div>
      
      <div class="input-group">
        <label class="input-label">Ken je je hartslagzones?</label>
        <div class="option-grid">
          <div class="option-card ${userData.heartRateZonesKnown ? 'selected' : ''}" onclick="selectOption('heartRateZonesKnown', true)">
            <div class="option-icon">✅</div>
            <div class="option-title">Ja</div>
          </div>
          <div class="option-card ${!userData.heartRateZonesKnown ? 'selected' : ''}" onclick="selectOption('heartRateZonesKnown', false)">
            <div class="option-icon">❌</div>
            <div class="option-title">Nee</div>
          </div>
        </div>
      </div>
    `;
  } else if (step === 4) {
    // Beschikbaarheid
    content = `
      <h2 class="question-title">Beschikbaarheid & Voorkeuren</h2>
      <p class="question-subtitle">We stemmen het schema af op jouw leven</p>
      
      <div class="input-group">
        <label class="input-label">Hoeveel trainingen per week?</label>
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
        <label class="input-label">Loopomgeving</label>
        <div class="option-grid">
          <div class="option-card ${userData.runningEnvironment === 'urban' ? 'selected' : ''}" onclick="selectOption('runningEnvironment', 'urban')">
            <div class="option-icon">🏙️</div>
            <div class="option-title">Stad</div>
          </div>
          <div class="option-card ${userData.runningEnvironment === 'nature' ? 'selected' : ''}" onclick="selectOption('runningEnvironment', 'nature')">
            <div class="option-icon">🌲</div>
            <div class="option-title">Natuur</div>
          </div>
          <div class="option-card ${userData.runningEnvironment === 'mixed' ? 'selected' : ''}" onclick="selectOption('runningEnvironment', 'mixed')">
            <div class="option-icon">🏞️</div>
            <div class="option-title">Gemengd</div>
          </div>
        </div>
      </div>
    `;
  } else if (step === 5) {
    // Doelen
    content = `
      <h2 class="question-title">Jouw Marathon Doel</h2>
      <p class="question-subtitle">Wat wil je bereiken op 27 september 2026?</p>
      
      <div class="input-group">
        <label class="input-label">Hoofddoel</label>
        <div class="option-grid">
          <div class="option-card ${userData.goal === 'finish' ? 'selected' : ''}" onclick="selectOption('goal', 'finish')">
            <div class="option-icon">🎯</div>
            <div class="option-title">Finishen</div>
            <div class="option-desc">Gezond finishen is het doel</div>
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
          <small style="color: var(--text-secondary); margin-top: 5px; display: block;">Bijvoorbeeld: 4:30 voor 4 uur en 30 minuten</small>
        </div>
      </div>
    `;
  } else if (step === 6) {
    // Extra Factoren
    content = `
      <h2 class="question-title">Extra Factoren</h2>
      <p class="question-subtitle">Dit helpt je schema optimaliseren</p>
      
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
      
      <div class="input-group">
        <label class="input-label">Cross-training (kan meerdere selecteren)</label>
        <div class="checkbox-group" id="crossTrainingGroup">
          <label class="checkbox-item">
            <input type="checkbox" value="cycling" ${userData.crossTraining.includes('cycling') ? 'checked' : ''}>
            🚴 Fietsen
          </label>
          <label class="checkbox-item">
            <input type="checkbox" value="swimming" ${userData.crossTraining.includes('swimming') ? 'checked' : ''}>
            🏊 Zwemmen
          </label>
          <label class="checkbox-item">
            <input type="checkbox" value="yoga" ${userData.crossTraining.includes('yoga') ? 'checked' : ''}>
            🧘 Yoga
          </label>
          <label class="checkbox-item">
            <input type="checkbox" value="elliptical" ${userData.crossTraining.includes('elliptical') ? 'checked' : ''}>
            🏃 Crosstrainer
          </label>
        </div>
      </div>
      
      <div class="input-group">
        <label class="input-label">Gemiddelde slaap (uur/nacht)</label>
        <input type="number" id="sleepHours" class="input-field" placeholder="bijv. 7" min="4" max="12" step="0.5" value="${userData.sleepHours}">
      </div>
    `;
  } else if (step === 7) {
    // Overzicht
    const bmi = userData.weight && userData.height ? (userData.weight / Math.pow(userData.height / 100, 2)).toFixed(1) : 'N/A';
    content = `
      <h2 class="question-title">Jouw Samenvatting</h2>
      <p class="question-subtitle">Controleer je gegevens voordat we je schema genereren</p>
      
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
          <div class="summary-label">Geslacht</div>
          <div class="summary-value">${userData.gender === 'M' ? 'Man' : userData.gender === 'V' ? 'Vrouw' : 'Anders'}</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">BMI</div>
          <div class="summary-value">${bmi}</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">Ervaring</div>
          <div class="summary-value">${userData.runningYears || 'N/A'}</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">Niveau</div>
          <div class="summary-value">${userData.experience || 'N/A'}</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">Trainingen/Week</div>
          <div class="summary-value">${userData.sessionsPerWeek}x</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">Doel</div>
          <div class="summary-value">${userData.goal === 'finish' ? 'Finishen' : userData.targetTime || 'Tijd'}</div>
        </div>
      </div>
      
      <div class="alert alert-info">
        <span style="font-size: 1.8em;">🤖</span>
        <div>
          <strong>AI Personalisatie Ready!</strong><br>
          Op basis van al deze informatie gaan we nu een volledig gepersonaliseerd 45-weken trainingsschema genereren, aangepast aan jouw specifieke situatie, doelen en mogelijkheden.
        </div>
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
  
  // Show/hide target time based on goal
  if (key === 'goal') {
    const targetTimeGroup = document.getElementById('targetTimeGroup');
    if (targetTimeGroup) {
      targetTimeGroup.style.display = value === 'time' ? 'block' : 'none';
    }
  }
}

function goToStep(step) {
  // Save current step data
  if (currentStep === 1) {
    userData.age = document.getElementById('age')?.value || '';
    userData.weight = document.getElementById('weight')?.value || '';
    userData.height = document.getElementById('height')?.value || '';
  } else if (currentStep === 2) {
    userData.currentKmPerWeek = document.getElementById('currentKm')?.value || 0;
    userData.longestRun = document.getElementById('longestRun')?.value || 0;
    userData.previousMarathons = document.getElementById('previousMarathons')?.value || 0;
  } else if (currentStep === 3) {
    userData.injuries = document.getElementById('injuries')?.value || '';
    userData.medications = document.getElementById('medications')?.value || '';
  } else if (currentStep === 4) {
    userData.sessionsPerWeek = document.getElementById('sessionsSlider')?.value || 4;
  } else if (currentStep === 5) {
    const hours = document.getElementById('targetHours')?.value;
    const minutes = document.getElementById('targetMinutes')?.value;
    if (hours && minutes) {
      userData.targetTime = `${hours}:${minutes}`;
    }
  } else if (currentStep === 6) {
    userData.sleepHours = document.getElementById('sleepHours')?.value || 7;
    // Collect cross-training checkboxes
    const checkboxes = document.querySelectorAll('#crossTrainingGroup input[type="checkbox"]:checked');
    userData.crossTraining = Array.from(checkboxes).map(cb => cb.value);
  }
  
  showOnboardingStep(step);
}

async function generateAIPlan() {
  document.getElementById('app').innerHTML = `
    <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%); color: #eee; padding: 20px;">
      <div style="background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px); border-radius: 20px; padding: 40px; max-width: 600px; text-align: center; border: 1px solid rgba(255, 255, 255, 0.2);">
        <div style="width: 80px; height: 80px; border: 6px solid rgba(255, 255, 255, 0.1); border-top-color: #4ecca3; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 30px;"></div>
        <div style="font-size: 1.5em; color: #4ecca3; margin-bottom: 10px;">🤖 AI genereert jouw schema...</div>
      </div>
    </div>
    <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
  `;
  
  try {
    const requestBody = JSON.stringify({ userData: userData });
    console.log('Request body:', requestBody);
    
    const response = await fetch('/.netlify/functions/generate-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: requestBody
    });
    
    const responseText = await response.text();
    console.log('Response:', responseText);
    
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
  // Demo fallback plan
  return {
    phases: [
      { name: "Fase 1 - Terug in beweging", weeks: [1, 2, 3, 4], description: "Run-walk basis", weeklyMinutes: "150-180'", workouts: [
        { type: "Run-Walk", description: "10×(1' jog / 2' wandelen)", day: "Maandag" },
        { type: "Kracht", description: "30-40' heup/bil, kuit, core", day: "Dinsdag" },
        { type: "Rust", description: "Volledige rustdag", day: "Woensdag" },
        { type: "Run-Walk", description: "8×(2' jog / 2' wandel)", day: "Donderdag" },
        { type: "Rust", description: "Volledige rustdag", day: "Vrijdag" },
        { type: "Kracht", description: "30-40' spierversterking", day: "Zaterdag" },
        { type: "Lange Duur", description: "45-50' run-walk (Z2)", day: "Zondag" }
      ]}
    ]
  };
}

function showDashboard() {
  const plan = generatedPlan || createDemoPlan();
  const totalWorkouts = 45 * 6;
  const completedCount = completedWorkouts.size;
  const progressPercent = Math.min((completedCount / totalWorkouts) * 100, 100);
  
  document.getElementById('app').innerHTML = `
    <div class="container">
      <div class="header">
        <h1>🏃‍♂️ Loch Ness Marathon Trainer Pro</h1>
        <p class="subtitle">Je AI-gegenereerde 45-weken trainingsschema</p>
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
        </div>
      </div>
      
      <div class="dashboard">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Jouw Voortgang</h3>
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
            <h3 class="card-title">Statistieken</h3>
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
              <div class="stat-label">Trainingen</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">${userData.goal === 'finish' ? 'Finishen' : userData.targetTime}</div>
              <div class="stat-label">Doel</div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="alert alert-info" style="margin-bottom: 20px;">
        <span style="font-size: 1.5em;">🤖</span>
        <div>
          <strong>AI Gepersonaliseerd</strong><br>
          Dit schema is speciaal voor jou gemaakt op basis van je leeftijd (${userData.age}), ervaring (${userData.experience}), en doel (${userData.goal === 'finish' ? 'finishen' : userData.targetTime}).
        </div>
      </div>
      
      <div class="tips-section">
        <h3 class="tips-title">💡 Persoonlijke Tips</h3>
        <div class="tip-item"><strong>Voor jou:</strong> ${getPersonalizedTip()}</div>
      </div>
    </div>
  `;
}

function getPersonalizedTip() {
  if (userData.age > 50) {
    return "Extra focus op herstel en mobiliteit - neem rust serieus!";
  } else if (userData.experience === 'beginner') {
    return "Begin rustig en bouw geleidelijk op - consistentie is belangrijker dan snelheid!";
  } else if (userData.injuries) {
    return "Let extra op blessure preventie - warm goed op en cool down!";
  } else {
    return "Luister naar je lichaam en geniet van het proces!";
  }
}

console.log('Complete AI Marathon Trainer loaded! 🎉');

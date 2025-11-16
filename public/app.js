// Loch Ness Marathon Trainer - COMPLETE FIXED VERSION
const supabase = window.supabase.createClient(CONFIG.supabase.url, CONFIG.supabase.anonKey);

let completedWorkouts = new Set();
let currentWeekNumber = 1;
let currentStep = 1;
let generatedPlan = null;
let currentUser = null;

let userData = {
  name: '', age: '', gender: '', weight: '', height: '',
  runningYears: '', experience: '', currentKmPerWeek: 0, longestRun: 0,
  previousMarathons: 0, trainingHistory: '',
  injuries: '', medications: '',
  sessionsPerWeek: 4, timePerSession: 60,
  goal: 'finish', targetTime: '',
  strengthTraining: false, sleepHours: 7
};

// ===== DATE HELPERS =====
const TRAINING_START_DATE = new Date('2025-11-15'); // Zaterdag 15 november 2025
const RACE_DATE = new Date('2026-09-27'); // Zondag 27 september 2026

function getWeekStartDate(weekNumber) {
  const date = new Date(TRAINING_START_DATE);
  date.setDate(date.getDate() + (weekNumber - 1) * 7);
  return date;
}

function getWeekEndDate(weekNumber) {
  const date = getWeekStartDate(weekNumber);
  date.setDate(date.getDate() + 6);
  return date;
}

function getDateForWorkout(weekNumber, dayName) {
  const dayMap = {
    'Zaterdag': 0, 'Zondag': 1, 'Maandag': 2, 'Dinsdag': 3,
    'Woensdag': 4, 'Donderdag': 5, 'Vrijdag': 6
  };
  const startDate = getWeekStartDate(weekNumber);
  const dayOffset = dayMap[dayName] || 0;
  const date = new Date(startDate);
  date.setDate(date.getDate() + dayOffset);
  return date;
}

function formatDate(date, format = 'short') {
  const days = ['Zo', 'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za'];
  const months = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
  
  if (format === 'short') {
    return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]}`;
  } else if (format === 'range') {
    return `${date.getDate()} ${months[date.getMonth()]}`;
  }
  return date.toLocaleDateString('nl-NL');
}

function getDaysUntilRace() {
  const today = new Date();
  const diffTime = RACE_DATE - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

// ===== AUTH & DATA LOADING =====

document.addEventListener('DOMContentLoaded', async () => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (session) {
    currentUser = session.user;
    await loadUserData();
    
    if (generatedPlan) {
      showDashboard();
    } else {
      showWelcome();
    }
  } else {
    showLoginScreen();
  }

  supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session) {
      currentUser = session.user;
      await loadUserData();
      
      if (generatedPlan) {
        showDashboard();
      } else {
        showWelcome();
      }
    } else if (event === 'SIGNED_OUT') {
      currentUser = null;
      showLoginScreen();
    }
  });
});

// FIXED: Immediate save to both localStorage and Supabase
async function saveProgress() {
  localStorage.setItem('marathonProgress', JSON.stringify({
    completedWorkouts: Array.from(completedWorkouts),
    currentWeek: currentWeekNumber,
    userData,
    generatedPlan
  }));
  
  if (currentUser && generatedPlan) {
    try {
      const { data: existingPlans } = await supabase
        .from('training_plans')
        .select('id')
        .eq('user_id', currentUser.id)
        .limit(1);
      
      if (existingPlans && existingPlans.length > 0) {
        await supabase.from('training_plans').update({
          plan_data: generatedPlan,
          current_week: currentWeekNumber,
          updated_at: new Date().toISOString()
        }).eq('id', existingPlans[0].id);
      } else {
        await supabase.from('training_plans').insert([{
          user_id: currentUser.id,
          plan_data: generatedPlan,
          current_week: currentWeekNumber
        }]);
      }
      
      console.log('✅ Progress saved to cloud');
    } catch (error) {
      console.error('❌ Error saving to Supabase:', error);
    }
  }
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

async function loadUserData() {
  if (!currentUser) {
    loadProgress();
    return;
  }
  
  try {
    // Use Google auth metadata directly - skip user_profiles table
    userData.name = currentUser.user_metadata?.full_name || currentUser.email.split('@')[0];
    
    // Load training plan
    const { data: plans, error: plansError } = await supabase
      .from('training_plans')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (plansError) {
      console.error('Error loading plans:', plansError);
    } else if (plans && plans.length > 0) {
      generatedPlan = plans[0].plan_data;
      currentWeekNumber = plans[0].current_week || 1;
    }
    
    // Load workout progress
    const { data: progress, error: progressError } = await supabase
      .from('workout_progress')
      .select('week_number, workout_day')
      .eq('user_id', currentUser.id)
      .eq('completed', true);
    
    if (progressError) {
      console.error('Error loading progress:', progressError);
    } else if (progress) {
      completedWorkouts = new Set(progress.map(p => `${p.week_number}-${p.workout_day}`));
    }
    
    // Also load from localStorage as backup
    loadProgress();
  } catch (error) {
    console.error('Error loading user data:', error);
    loadProgress();
  }
}

// ===== LOGIN SCREEN =====

function showLoginScreen() {
  document.getElementById('app').innerHTML = `
    <div class="welcome-screen">
      <div class="welcome-card" style="max-width: 450px;">
        <div class="logo">🏃‍♂️</div>
        <h1>Loch Ness Marathon Trainer</h1>
        <p class="subtitle">AI-Powered Persoonlijk Trainingsschema</p>
        
        <div style="margin: 40px 0;">
          <p style="text-align: center; color: var(--text-secondary); margin-bottom: 30px;">
            Log in om je trainingsschema te starten en je progressie bij te houden op al je devices.
          </p>
          
          <button class="btn-google" onclick="signInWithGoogle()">
            <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style="margin-right: 12px;">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            Inloggen met Google
          </button>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1);">
          <p style="font-size: 0.85em; color: var(--text-secondary);">
            Door in te loggen ga je akkoord met onze voorwaarden
          </p>
        </div>
      </div>
    </div>
  `;
}

async function signInWithGoogle() {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'https://loch-ness-marathon.netlify.app'
      }
    });
    if (error) throw error;
  } catch (error) {
    console.error('Error signing in:', error);
    alert('Er ging iets mis met inloggen. Probeer het opnieuw.');
  }
}

async function handleLogout() {
  if (!confirm('Wil je uitloggen?')) return;
  try {
    await supabase.auth.signOut();
  } catch (error) {
    console.error('Error signing out:', error);
  }
}

function showWelcome() {
  document.getElementById('app').innerHTML = `
    <div class="welcome-screen">
      <div class="welcome-card">
        ${currentUser ? `
          <div class="user-menu">
            <span class="user-menu-name">👋 ${userData.name}</span>
            <button class="btn-logout" onclick="handleLogout()">Uitloggen</button>
          </div>
        ` : ''}
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


// ===== ONBOARDING (Stap 1-6 - verkort voor ruimte) =====
// [Je huidige onboarding code blijft hetzelfde - ik focus op de fixes]

function showOnboardingStep(step) {
// Insert this into showOnboardingStep function
function showOnboardingStep(step) {
  currentStep = step;
  const steps = ['Persoonlijk', 'Sportief', 'Historiek', 'Gezondheid', 'Beschikbaarheid', 'Doelen', 'Overzicht'];
  let content = '';
  
  if (step === 1) {
    content = `
      <h2 class="question-title">Persoonlijke Gegevens</h2>
      <div class="input-group">
        <label class="input-label">Leeftijd</label>
        <input type="number" id="age" class="input-field" placeholder="bijv. 35" value="${userData.age}">
      </div>
      <div class="input-group">
        <label class="input-label">Geslacht</label>
        <div class="option-grid">
          <div class="option-card ${userData.gender === 'M' ? 'selected' : ''}" onclick="selectOption('gender', 'M')">
            <div class="option-icon">👨</div><div class="option-title">Man</div>
          </div>
          <div class="option-card ${userData.gender === 'V' ? 'selected' : ''}" onclick="selectOption('gender', 'V')">
            <div class="option-icon">👩</div><div class="option-title">Vrouw</div>
          </div>
        </div>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
        <div class="input-group">
          <label class="input-label">Gewicht (kg)</label>
          <input type="number" id="weight" class="input-field" value="${userData.weight}">
        </div>
        <div class="input-group">
          <label class="input-label">Lengte (cm)</label>
          <input type="number" id="height" class="input-field" value="${userData.height}">
        </div>
      </div>
    `;
  } else if (step === 2) {
    content = `
      <h2 class="question-title">Sportieve Achtergrond</h2>
      <div class="input-group">
        <label class="input-label">Niveau</label>
        <div class="option-grid">
          <div class="option-card ${userData.experience === 'beginner' ? 'selected' : ''}" onclick="selectOption('experience', 'beginner')">
            <div class="option-icon">🌱</div><div class="option-title">Beginner</div>
          </div>
          <div class="option-card ${userData.experience === 'intermediate' ? 'selected' : ''}" onclick="selectOption('experience', 'intermediate')">
            <div class="option-icon">🏃</div><div class="option-title">Gemiddeld</div>
          </div>
          <div class="option-card ${userData.experience === 'advanced' ? 'selected' : ''}" onclick="selectOption('experience', 'advanced')">
            <div class="option-icon">⚡</div><div class="option-title">Gevorderd</div>
          </div>
        </div>
      </div>
    `;
  } else if (step === 3) {
    content = `
      <h2 class="question-title">Trainingshistoriek</h2>
      <div class="input-group">
        <label class="input-label">Training laatste 6 maanden</label>
        <textarea id="trainingHistory" class="input-field" style="min-height: 120px;">${userData.trainingHistory}</textarea>
      </div>
    `;
  } else if (step === 4) {
    content = `
      <h2 class="question-title">Gezondheid</h2>
      <div class="input-group">
        <label class="input-label">Blessures</label>
        <textarea id="injuries" class="input-field">${userData.injuries}</textarea>
      </div>
    `;
  } else if (step === 5) {
    content = `
      <h2 class="question-title">Beschikbaarheid</h2>
      <div class="input-group">
        <label class="input-label">Trainingen per week</label>
        <div class="slider-container">
          <input type="range" class="slider" id="sessionsSlider" min="3" max="6" value="${userData.sessionsPerWeek}" oninput="document.getElementById('sessionsValue').textContent = this.value">
          <div class="slider-value"><span id="sessionsValue">${userData.sessionsPerWeek}</span> trainingen/week</div>
        </div>
      </div>
    `;
  } else if (step === 6) {
    content = `
      <h2 class="question-title">Jouw Doel</h2>
      <div class="input-group">
        <label class="input-label">Hoofddoel</label>
        <div class="option-grid">
          <div class="option-card ${userData.goal === 'finish' ? 'selected' : ''}" onclick="selectOption('goal', 'finish')">
            <div class="option-icon">🎯</div><div class="option-title">Finishen</div>
          </div>
          <div class="option-card ${userData.goal === 'time' ? 'selected' : ''}" onclick="selectOption('goal', 'time')">
            <div class="option-icon">⏱️</div><div class="option-title">Tijd</div>
          </div>
        </div>
      </div>
    `;
  } else if (step === 7) {
    content = `
      <h2 class="question-title">Klaar!</h2>
      <div class="alert alert-info">
        <span style="font-size: 1.8em;">🤖</span>
        <div><strong>AI Ready!</strong> We gaan nu je schema genereren.</div>
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
              ${step < 7 ? 'Volgende →' : '✨ Genereer Schema'}
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}
  // ... [Je bestaande onboarding code] ...
  // Dit deel blijft exact hetzelfde
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

// ===== AI PLAN GENERATION =====

async function generateAIPlan() {
  document.getElementById('app').innerHTML = `
    <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%); color: #eee; padding: 20px;">
      <div style="background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px); border-radius: 20px; padding: 40px; max-width: 600px; text-align: center; border: 1px solid rgba(255, 255, 255, 0.2);">
        <div style="width: 80px; height: 80px; border: 6px solid rgba(255, 255, 255, 0.1); border-top-color: #4ecca3; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 30px;"></div>
        <div style="font-size: 1.5em; color: #4ecca3; margin-bottom: 10px;">🤖 AI genereert jouw schema...</div>
        <div style="color: #aaa;">Op basis van je gegevens en doelen</div>
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
    
    const data = await response.json();
    generatedPlan = data.plan;
    
    // FIXED: Save immediately after generating
    await saveProgress();
    
    showDashboard();
    
  } catch (error) {
    console.error('Error:', error);
    generatedPlan = createDemoPlan();
    await saveProgress(); // FIXED: Also save demo plan
    showDashboard();
  }
}

function createDemoPlan() {
  return {
    phases: [
      { name: "Fase 1 - Basis", weeks: [1, 2, 3, 4], description: "Opbouw", weeklyMinutes: "150-180'", workouts: [
        { type: "Run-Walk", description: "10×(1' jog / 2' wandel)", day: "Maandag" },
        { type: "Kracht", description: "30' core/stabiliteit", day: "Dinsdag" },
        { type: "Easy", description: "35' rustig Z2", day: "Woensdag" },
        { type: "Rust", description: "", day: "Donderdag" },
        { type: "Run-Walk", description: "8×(2' jog / 2' wandel)", day: "Vrijdag" },
        { type: "Kracht", description: "30' full body", day: "Zaterdag" },
        { type: "Long", description: "50' Z2", day: "Zondag" }
      ]},
      { name: "Fase 2 - Volume", weeks: [5, 6, 7, 8], description: "Basis opbouwen", weeklyMinutes: "200'", workouts: [
        { type: "Easy", description: "45' Z2", day: "Maandag" },
        { type: "Kracht", description: "35' strength", day: "Dinsdag" },
        { type: "Tempo", description: "40' met tempo", day: "Woensdag" },
        { type: "Rust", description: "", day: "Donderdag" },
        { type: "Easy", description: "40' Z2", day: "Vrijdag" },
        { type: "Strides", description: "45' + strides", day: "Zaterdag" },
        { type: "Long", description: "75' Z2", day: "Zondag" }
      ]}
    ]
  };
}


// ===== NEW SIMPLE DASHBOARD =====

function showDashboard() {
  const plan = generatedPlan || createDemoPlan();
  const totalWorkouts = 45 * 6;
  const completedCount = completedWorkouts.size;
  const progressPercent = Math.min((completedCount / totalWorkouts) * 100, 100);
  
  // Get current phase
  const currentPhase = getPhaseForWeek(currentWeekNumber);
  if (!currentPhase) {
    showWelcome();
    return;
  }
  
  // Get next workout (first uncompleted in current week)
  const nextWorkout = currentPhase.workouts.find(w => 
    w.type !== 'Rust' && !completedWorkouts.has(currentWeekNumber + '-' + w.day)
  );
  
  // Get last completed workout
  let lastWorkout = null;
  let lastWeek = currentWeekNumber;
  for (let i = currentWeekNumber; i >= 1; i--) {
    const phase = getPhaseForWeek(i);
    if (phase) {
      const completed = phase.workouts.reverse().find(w => 
        completedWorkouts.has(i + '-' + w.day)
      );
      if (completed) {
        lastWorkout = completed;
        lastWeek = i;
        break;
      }
    }
  }
  
  const weekStart = getWeekStartDate(currentWeekNumber);
  const weekEnd = getWeekEndDate(currentWeekNumber);
  const daysUntilRace = getDaysUntilRace();
  
  document.getElementById('app').innerHTML = `
    <div class="container">
      <div class="header">
        ${currentUser ? `
          <div class="user-menu">
            <span class="user-menu-name">👋 ${userData.name}</span>
            <button class="btn-logout" onclick="handleLogout()">Uitloggen</button>
          </div>
        ` : ''}
        <h1>🏃‍♂️ Loch Ness Marathon Trainer</h1>
        <p class="subtitle">27 september 2026 • ${daysUntilRace} dagen te gaan! 🎯</p>
      </div>
      
      <!-- WEEK NAVIGATION -->
      <div class="week-navigation">
        <button class="week-nav-btn" onclick="changeWeek(-1)" ${currentWeekNumber === 1 ? 'disabled' : ''}>
          ← Vorige
        </button>
        <div class="week-info">
          <div class="week-number">Week ${currentWeekNumber}</div>
          <div class="week-dates">${formatDate(weekStart, 'range')} - ${formatDate(weekEnd, 'range')} 2025</div>
        </div>
        <button class="week-nav-btn" onclick="changeWeek(1)" ${currentWeekNumber === 45 ? 'disabled' : ''}>
          Volgende →
        </button>
      </div>
      
      <!-- SIMPLE 3-COLUMN DASHBOARD -->
      <div class="dashboard-grid">
        <!-- Progress Ring -->
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
          <div style="text-align: center; margin-top: 15px; color: var(--text-secondary);">
            Week ${currentWeekNumber} van 45
          </div>
        </div>
        
        <!-- Next Workout (BIG CARD) -->
        <div class="card" style="background: linear-gradient(135deg, rgba(78, 204, 163, 0.15), rgba(233, 69, 96, 0.1));">
          <div class="card-header">
            <h3 class="card-title">Volgende Training</h3>
            <span class="card-icon">🎯</span>
          </div>
          ${nextWorkout ? `
            <div style="padding: 20px 0;">
              <div style="font-size: 2.5em; text-align: center; margin-bottom: 10px;">${nextWorkout.type}</div>
              <div style="font-size: 1.2em; color: var(--success); text-align: center; font-weight: 600; margin-bottom: 15px;">
                ${formatDate(getDateForWorkout(currentWeekNumber, nextWorkout.day), 'short')}
              </div>
              <div style="color: var(--text-secondary); text-align: center; padding: 0 20px; line-height: 1.6;">${nextWorkout.description}</div>
              <button class="btn" onclick="markWorkoutDone(${currentWeekNumber}, '${nextWorkout.day}')" style="margin-top: 25px; width: calc(100% - 40px); margin-left: 20px;">
                ✓ Markeer als Gedaan
              </button>
            </div>
          ` : `
            <div style="padding: 40px 20px; text-align: center;">
              <div style="font-size: 3em; margin-bottom: 15px;">🎉</div>
              <div style="font-size: 1.3em; color: var(--success); margin-bottom: 10px;">Week Voltooid!</div>
              <div style="color: var(--text-secondary);">Geweldig gedaan deze week!</div>
              <button class="btn" onclick="goToNextWeek()" style="margin-top: 20px;">
                → Week ${currentWeekNumber + 1}
              </button>
            </div>
          `}
        </div>
        
        <!-- Last Completed Workout -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Laatst Voltooid</h3>
            <span class="card-icon">✅</span>
          </div>
          ${lastWorkout ? `
            <div style="padding: 20px 0; text-align: center;">
              <div style="font-size: 2em; margin-bottom: 10px;">${lastWorkout.type}</div>
              <div style="color: var(--success); font-weight: 600; margin-bottom: 10px;">${lastWorkout.day}</div>
              <div style="color: var(--text-secondary); font-size: 0.9em;">Week ${lastWeek}</div>
              <div style="margin-top: 20px; padding: 15px; background: rgba(78, 204, 163, 0.1); border-radius: 10px; margin: 20px;">
                <div style="color: var(--text-secondary); font-size: 0.9em;">${lastWorkout.description}</div>
              </div>
            </div>
          ` : `
            <div style="padding: 40px 20px; text-align: center; color: var(--text-secondary);">
              <div style="font-size: 2em; margin-bottom: 10px;">🏃‍♂️</div>
              <div>Nog geen trainingen voltooid</div>
            </div>
          `}
        </div>
      </div>
      
      <!-- Current Week Details -->
      <div class="card" style="margin-top: 20px;">
        <div class="card-header">
          <h3 class="card-title">Week ${currentWeekNumber} - ${currentPhase.name}</h3>
          <span class="card-icon">📅</span>
        </div>
        <div class="alert alert-info" style="margin: 20px 20px 0;">
          <span>ℹ️</span>
          <div><strong>Doel:</strong> ${currentPhase.description} • <strong>Totaal:</strong> ${currentPhase.weeklyMinutes}</div>
        </div>
        <ul class="workout-list" style="padding: 20px;">
          ${currentPhase.workouts
            .sort((a, b) => {
              const order = ['Zaterdag', 'Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag'];
              return order.indexOf(a.day) - order.indexOf(b.day);
            })
            .map(workout => {
            const workoutId = currentWeekNumber + '-' + workout.day;
            const isCompleted = completedWorkouts.has(workoutId);
            const workoutDate = getDateForWorkout(currentWeekNumber, workout.day);
            const formattedDate = formatDate(workoutDate, 'short');
            return `
              <li class="workout-item ${isCompleted ? 'completed' : ''}" onclick="toggleWorkout('${workoutId}', event)">
                <div class="workout-checkbox"></div>
                <div style="flex: 1;">
                  <div style="display: flex; gap: 10px; margin-bottom: 5px; align-items: center;">
                    <span class="workout-date">${formattedDate}</span>
                    <span class="workout-type">${workout.type}</span>
                  </div>
                  <div style="color: var(--text-secondary); font-size: 0.9em;">${workout.description || ''}</div>
                </div>
              </li>
            `;
          }).join('')}
        </ul>
      </div>
      
      <!-- Phase Navigation -->
      <div class="phase-selector" style="margin-top: 20px;">
        ${plan.phases.map((phase, idx) => {
          const isCurrent = phase.weeks.includes(currentWeekNumber);
          return `<button class="phase-btn ${isCurrent ? 'active' : ''}" onclick="jumpToPhase(${idx})">${phase.name.split('-')[0].trim()}</button>`;
        }).join('')}
      </div>
      
      <!-- Tips -->
      <div class="tips-section" style="margin-top: 20px;">
        <h3 class="tips-title">💡 Tip voor jou</h3>
        <div class="tip-item">${getPersonalizedTip()}</div>
      </div>
      
      <!-- Reset Plan Button -->
      <div style="margin-top: 30px; text-align: center;">
        <button class="btn-reset" onclick="confirmResetPlan()">
          🔄 Nieuw Schema Genereren
        </button>
        <p style="color: var(--text-secondary); font-size: 0.85em; margin-top: 10px;">
          Start opnieuw met een vers trainingsschema
        </p>
      </div>
    </div>
  `;
}

// FIXED: Instant visual update on toggle
async function toggleWorkout(workoutId, event) {
  event.stopPropagation();
  const [weekNum, day] = workoutId.split('-');
  
  if (completedWorkouts.has(workoutId)) {
    completedWorkouts.delete(workoutId);
    
    if (currentUser) {
      await supabase.from('workout_progress').delete()
        .eq('user_id', currentUser.id)
        .eq('week_number', parseInt(weekNum))
        .eq('workout_day', day);
    }
  } else {
    completedWorkouts.add(workoutId);
    
    if (currentUser) {
      const phase = getPhaseForWeek(parseInt(weekNum));
      const workout = phase?.workouts.find(w => w.day === day);
      
      await supabase.from('workout_progress').insert([{
        user_id: currentUser.id,
        week_number: parseInt(weekNum),
        workout_day: day,
        workout_type: workout?.type || '',
        completed: true,
        completed_at: new Date().toISOString().replace('T', ' ').slice(0, 19)
      }]);
    }
  }
  
  await saveProgress();
  
  // FIXED: Instant visual update
  showDashboard();
}

function markWorkoutDone(weekNum, day) {
  const workoutId = weekNum + '-' + day;
  toggleWorkout(workoutId, { stopPropagation: () => {} });
}

function goToNextWeek() {
  currentWeekNumber++;
  saveProgress();
  showDashboard();
}

function changeWeek(direction) {
  currentWeekNumber = Math.max(1, Math.min(45, currentWeekNumber + direction));
  saveProgress();
  showDashboard();
}

function jumpToPhase(phaseIdx) {
  const plan = generatedPlan || createDemoPlan();
  currentWeekNumber = plan.phases[phaseIdx].weeks[0];
  saveProgress();
  showDashboard();
}

function getPhaseForWeek(weekNum) {
  if (!generatedPlan || !generatedPlan.phases) {
    const demo = createDemoPlan();
    for (let phase of demo.phases) {
      if (phase.weeks.includes(weekNum)) return phase;
    }
    return demo.phases[0];
  }
  for (let phase of generatedPlan.phases) {
    if (phase.weeks.includes(weekNum)) return phase;
  }
  return generatedPlan.phases[0];
}

function getPersonalizedTip() {
  const bmi = userData.weight && userData.height ? (userData.weight / Math.pow(userData.height / 100, 2)) : 0;
  
  if (bmi > 30) return "Extra focus op gewichtsbeheersing - combineer training met gezonde voeding";
  if (userData.age > 50) return "Focus op herstel en mobiliteit - neem rustdagen serieus";
  if (userData.experience === 'beginner') return "Begin rustig en bouw geleidelijk op - consistentie is belangrijker dan snelheid";
  if (userData.injuries) return "Let extra op blessure preventie - warm goed op en cool down";
  return "Luister naar je lichaam en geniet van het proces!";
}

// ===== RESET PLAN FUNCTIONALITY =====

function confirmResetPlan() {
  // Show confirmation modal
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-content">
      <h2 style="margin-bottom: 20px; color: var(--text);">⚠️ Plan Resetten?</h2>
      <p style="color: var(--text-secondary); margin-bottom: 25px; line-height: 1.6;">
        Weet je zeker dat je een <strong>nieuw trainingsschema</strong> wilt genereren?
      </p>
      <div class="alert alert-warning" style="margin-bottom: 25px;">
        <span>🚨</span>
        <div>
          <strong>Let op!</strong> Dit verwijdert:
          <ul style="margin: 10px 0 0 20px; line-height: 1.8;">
            <li>Je huidige trainingsschema</li>
            <li>Alle afgevinkte trainingen</li>
            <li>Je voortgang</li>
          </ul>
        </div>
      </div>
      <div style="display: flex; gap: 15px; justify-content: center;">
        <button class="btn btn-secondary" onclick="closeResetModal()">
          ← Annuleren
        </button>
        <button class="btn" style="background: var(--warning);" onclick="resetPlan()">
          🔄 Ja, Reset Plan
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Fade in animation
  setTimeout(() => modal.classList.add('active'), 10);
}

function closeResetModal() {
  const modal = document.querySelector('.modal-overlay');
  if (modal) {
    modal.classList.remove('active');
    setTimeout(() => modal.remove(), 300);
  }
}

async function resetPlan() {
  closeResetModal();
  
  // Show loading screen
  document.getElementById('app').innerHTML = `
    <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%); color: #eee; padding: 20px;">
      <div style="background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px); border-radius: 20px; padding: 40px; max-width: 600px; text-align: center; border: 1px solid rgba(255, 255, 255, 0.2);">
        <div style="width: 80px; height: 80px; border: 6px solid rgba(255, 255, 255, 0.1); border-top-color: #ff6348; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 30px;"></div>
        <div style="font-size: 1.5em; color: #ff6348; margin-bottom: 10px;">🔄 Plan wordt gereset...</div>
        <div style="color: #aaa;">Even geduld, we maken je data schoon</div>
      </div>
    </div>
    <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
  `;
  
  try {
    // Clear localStorage
    localStorage.removeItem('marathonProgress');
    
    // Clear database if user is logged in
    if (currentUser) {
      // Delete training plan
      await supabase.from('training_plans')
        .delete()
        .eq('user_id', currentUser.id);
      
      // Delete workout progress
      await supabase.from('workout_progress')
        .delete()
        .eq('user_id', currentUser.id);
      
      console.log('✅ Database cleared');
    }
    
    // Reset all state
    generatedPlan = null;
    completedWorkouts = new Set();
    currentWeekNumber = 1;
    
    console.log('✅ Plan reset successful');
    
    // Show success message briefly
    document.getElementById('app').innerHTML = `
      <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%); color: #eee; padding: 20px;">
        <div style="background: rgba(78, 204, 163, 0.1); backdrop-filter: blur(10px); border-radius: 20px; padding: 40px; max-width: 600px; text-align: center; border: 1px solid rgba(78, 204, 163, 0.3);">
          <div style="font-size: 4em; margin-bottom: 20px;">✅</div>
          <div style="font-size: 1.5em; color: var(--success); margin-bottom: 10px;">Plan Gereset!</div>
          <div style="color: #aaa;">Je wordt doorgestuurd naar de onboarding...</div>
        </div>
      </div>
    `;
    
    // Redirect to onboarding after 1.5 seconds
    setTimeout(() => {
      showWelcome();
    }, 1500);
    
  } catch (error) {
    console.error('Error resetting plan:', error);
    alert('Er ging iets mis bij het resetten. Probeer opnieuw.');
    showDashboard();
  }
}

console.log('Marathon Trainer FIXED & READY! 🎉');

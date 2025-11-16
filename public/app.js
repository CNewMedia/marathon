// Loch Ness Marathon Trainer - COMPLETE WORKING VERSION
const supabase = window.supabase.createClient(CONFIG.supabase.url, CONFIG.supabase.anonKey);

let completedWorkouts = new Set();
let currentWeekNumber = 1;
let currentStep = 1;
let generatedPlan = null;
let currentUser = null;

let userData = {
  name: '', age: '', gender: '', weight: '', height: '',
  runningYears: '', experience: '', currentKmPerWeek: 0, longestRun: 0,
  previousMarathons: 0, previousMarathonTime: '',
  injuries: '', medications: '', heartRateZonesKnown: false,
  lastMedicalCheck: '', smokingStatus: 'never',
  sessionsPerWeek: 4, timePerSession: 60, preferredTimes: [],
  facilitiesAccess: [], runningEnvironment: 'mixed',
  goal: 'finish', targetTime: '', raceDate: '2026-09-27', otherRaces: [],
  crossTraining: [], strengthTraining: false, nutritionPlan: false, sleepHours: 7
};

document.addEventListener('DOMContentLoaded', async () => {
  // Check if user is logged in
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

  // Listen for auth state changes
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

function saveProgress() {
  // Always save to localStorage as backup
  localStorage.setItem('marathonProgress', JSON.stringify({
    completedWorkouts: Array.from(completedWorkouts),
    currentWeek: currentWeekNumber,
    userData,
    generatedPlan
  }));
  
  // Also save to Supabase if logged in
  if (currentUser && generatedPlan) {
    supabase.from('training_plans')
      .upsert({
        user_id: currentUser.id,
        plan_data: generatedPlan,
        current_week: currentWeekNumber,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
      .then(({ error }) => {
        if (error) console.error('Error saving to Supabase:', error);
      });
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
        redirectTo: window.location.origin
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

async function loadUserData() {
  if (!currentUser) {
    loadProgress();
    return;
  }
  
  try {
    // Load user profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', currentUser.id)
      .single();
    
    if (profile) {
      userData.name = profile.name || currentUser.user_metadata?.full_name || currentUser.email.split('@')[0];
      userData.age = profile.age || '';
      userData.gender = profile.gender || '';
      userData.weight = profile.weight || '';
      userData.height = profile.height || '';
      userData.experience = profile.experience || '';
    } else {
      // Create new profile
      userData.name = currentUser.user_metadata?.full_name || currentUser.email.split('@')[0];
      
      await supabase.from('user_profiles').insert([{
        id: currentUser.id,
        email: currentUser.email,
        name: userData.name,
        created_at: new Date().toISOString()
      }]);
    }
    
    // Load training plan
    const { data: plans } = await supabase
      .from('training_plans')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (plans && plans.length > 0) {
      generatedPlan = plans[0].plan_data;
      currentWeekNumber = plans[0].current_week || 1;
    }
    
    // Load workout progress
    const { data: progress } = await supabase
      .from('workout_progress')
      .select('week_number, workout_day')
      .eq('user_id', currentUser.id)
      .eq('completed', true);
    
    if (progress) {
      completedWorkouts = new Set(progress.map(p => `${p.week_number}-${p.workout_day}`));
    }
  } catch (error) {
    console.error('Error loading user data:', error);
    loadProgress(); // Fallback to localStorage
  }
}

function getPhaseForWeek(weekNum) {
  if (!generatedPlan || !generatedPlan.phases) return null;
  for (let phase of generatedPlan.phases) {
    if (phase.weeks.includes(weekNum)) return phase;
  }
  return generatedPlan.phases[0];
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

function showOnboardingStep(step) {
  currentStep = step;
  const steps = ['Persoonlijk', 'Sportief', 'Gezondheid', 'Beschikbaarheid', 'Doelen', 'Extra', 'Overzicht'];
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
        <label class="input-label">Medicatie</label>
        <textarea id="medications" class="input-field" placeholder="indien relevant..." style="min-height: 60px; font-family: inherit;">${userData.medications}</textarea>
      </div>
    `;
  } else if (step === 4) {
    content = `
      <h2 class="question-title">Beschikbaarheid</h2>
      <p class="question-subtitle">Afgestemd op jouw leven</p>
      <div class="input-group">
        <label class="input-label">Trainingen per week</label>
        <div class="slider-container">
          <input type="range" class="slider" id="sessionsSlider" min="3" max="6" value="${userData.sessionsPerWeek}" oninput="document.getElementById('sessionsValue').textContent = this.value">
          <div class="slider-value"><span id="sessionsValue">${userData.sessionsPerWeek}</span> trainingen/week</div>
        </div>
      </div>
      <div class="input-group">
        <label class="input-label">Tijd per training</label>
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
    `;
  } else if (step === 5) {
    content = `
      <h2 class="question-title">Jouw Doel</h2>
      <p class="question-subtitle">27 september 2026</p>
      <div class="input-group">
        <label class="input-label">Hoofddoel</label>
        <div class="option-grid">
          <div class="option-card ${userData.goal === 'finish' ? 'selected' : ''}" onclick="selectOption('goal', 'finish')">
            <div class="option-icon">🎯</div>
            <div class="option-title">Finishen</div>
          </div>
          <div class="option-card ${userData.goal === 'time' ? 'selected' : ''}" onclick="selectOption('goal', 'time')">
            <div class="option-icon">⏱️</div>
            <div class="option-title">Tijd Doel</div>
          </div>
        </div>
      </div>
      <div id="targetTimeGroup" style="display: ${userData.goal === 'time' ? 'block' : 'none'};">
        <div class="input-group">
          <label class="input-label">Doel Tijd</label>
          <div style="display: flex; gap: 10px; align-items: center;">
            <input type="number" id="targetHours" class="input-field" placeholder="uren" min="2" max="7" value="${userData.targetTime.split(':')[0] || ''}" style="width: 100px;">
            <span style="font-size: 1.5em;">:</span>
            <input type="number" id="targetMinutes" class="input-field" placeholder="min" min="0" max="59" value="${userData.targetTime.split(':')[1] || ''}" style="width: 100px;">
          </div>
        </div>
      </div>
    `;
  } else if (step === 6) {
    content = `
      <h2 class="question-title">Extra</h2>
      <div class="input-group">
        <label class="input-label">Krachttraining</label>
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
        <label class="input-label">Slaap (uur/nacht)</label>
        <input type="number" id="sleepHours" class="input-field" placeholder="7" min="4" max="12" step="0.5" value="${userData.sleepHours}">
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
        <div><strong>AI Ready!</strong> We gaan nu je gepersonaliseerde schema genereren.</div>
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
    console.log('Request:', requestBody);
    
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
  return {
    phases: [
      { name: "Fase 1", weeks: [1, 2, 3, 4], description: "Opbouw", weeklyMinutes: "150'", workouts: [
        { type: "Easy", description: "30'", day: "Maandag" },
        { type: "Rust", description: "", day: "Dinsdag" },
        { type: "Easy", description: "35'", day: "Woensdag" },
        { type: "Rust", description: "", day: "Donderdag" },
        { type: "Easy", description: "30'", day: "Vrijdag" },
        { type: "Rust", description: "", day: "Zaterdag" },
        { type: "Long", description: "50'", day: "Zondag" }
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
        ${currentUser ? `
          <div class="user-menu">
            <span class="user-menu-name">👋 ${userData.name}</span>
            <button class="btn-logout" onclick="handleLogout()">Uitloggen</button>
          </div>
        ` : ''}
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
      
      <div class="phase-selector">
        ${plan.phases.map((phase, idx) => `<button class="phase-btn ${idx === 0 ? 'active' : ''}" onclick="filterByPhase(${idx})">${phase.name}</button>`).join('')}
      </div>
      
      <div class="week-calendar" id="weekCalendar">
        ${renderWeekCalendar()}
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
    const progressPercent = (completedCount / weekWorkouts.length) * 100;
    
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

async function toggleWorkout(workoutId, event) {
  event.stopPropagation();
  const [weekNum, day] = workoutId.split('-');
  
  if (completedWorkouts.has(workoutId)) {
    completedWorkouts.delete(workoutId);
    
    // Delete from Supabase if logged in
    if (currentUser) {
      await supabase.from('workout_progress').delete()
        .eq('user_id', currentUser.id)
        .eq('week_number', parseInt(weekNum))
        .eq('workout_day', day);
    }
  } else {
    completedWorkouts.add(workoutId);
    
    // Save to Supabase if logged in
    if (currentUser) {
      const phase = getPhaseForWeek(parseInt(weekNum));
      const workout = phase?.workouts.find(w => w.day === day);
      
      await supabase.from('workout_progress').insert([{
        user_id: currentUser.id,
        week_number: parseInt(weekNum),
        workout_day: day,
        workout_type: workout?.type || '',
        completed: true,
        completed_at: new Date().toISOString()
      }]);
    }
  }
  
  saveProgress();
  showDashboard();
  setTimeout(() => openWeekModal(parseInt(weekNum)), 100);
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

document.addEventListener('click', e => {
  if (e.target === document.getElementById('weekModal')) closeModal();
});

console.log('Complete AI Marathon Trainer loaded! 🎉');
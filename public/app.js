// Loch Ness Marathon Trainer - Main Application
// Simplified version - full version would include all onboarding logic

// Initialize Supabase
const supabase = window.supabase.createClient(
  CONFIG.supabase.url,
  CONFIG.supabase.anon  Key
);

// App State
let currentUser = null;
let currentPlan = null;
let currentStep = 1;
let userData = {};

// Initialize App
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Marathon Trainer initializing...');
  
  // Check if user is logged in
  const { data: { session } } = await supabase.auth.getSession();
  
  if (session) {
    currentUser = session.user;
    await loadUserData();
    showDashboard();
  } else {
    showWelcome();
  }
});

// Show Welcome Screen
function showWelcome() {
  document.getElementById('app').innerHTML = `
    <div class="welcome-screen">
      <div class="welcome-card">
        <div class="logo">🏃‍♂️</div>
        <h1>Loch Ness Marathon Trainer</h1>
        <p class="subtitle">AI-Powered Persoonlijk Trainingsschema</p>
        
        <div class="input-group">
          <label class="input-label">Hoe mogen we je noemen?</label>
          <input type="text" id="userName" class="input-field" placeholder="Vul je naam in">
        </div>
        
        <button class="btn" onclick="startOnboarding()">
          🚀 Start Jouw Training
        </button>
        
        <p style="margin-top: 20px; color: var(--text-secondary);">
          We gaan je een paar vragen stellen om een volledig gepersonaliseerd trainingsschema te maken.
        </p>
      </div>
    </div>
  `;
}

// Load user data from Supabase
async function loadUserData() {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', currentUser.id)
    .single();
    
  if (data) {
    userData = data;
  }
  
  // Load active training plan
  const { data: planData } = await supabase
    .from('training_plans')
    .select('*')
    .eq('user_id', currentUser.id)
    .eq('is_active', true)
    .single();
    
  if (planData) {
    currentPlan = planData;
  }
}

// Generate plan with Claude API
async function generateTrainingPlan(userData) {
  try {
    const response = await fetch(CONFIG.api.generatePlan, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    
    if (!response.ok) {
      throw new Error('Failed to generate plan');
    }
    
    const data = await response.json();
    return data.plan;
    
  } catch (error) {
    console.error('Error generating plan:', error);
    throw error;
  }
}

// Save plan to Supabase
async function savePlan(plan) {
  const { data, error } = await supabase
    .from('training_plans')
    .insert({
      user_id: currentUser.id,
      plan_name: 'Loch Ness Marathon 2026',
      start_date: new Date().toISOString().split('T')[0],
      race_date: userData.raceDate || '2026-09-27',
      plan_data: plan,
      is_active: true,
    })
    .select()
    .single();
    
  if (error) {
    console.error('Error saving plan:', error);
    throw error;
  }
  
  return data;
}

// Show Dashboard (simplified)
function showDashboard() {
  document.getElementById('app').innerHTML = `
    <div class="container">
      <h1>Welkom terug, ${userData.full_name}!</h1>
      <p>Je trainingsschema is gereed. Volle versie komt hier...</p>
      
      <div class="alert alert-info">
        <span class="alert-icon">ℹ️</span>
        <div>
          <strong>Volgende Stap:</strong><br>
          De volledige dashboard met weekoverzicht, progress tracking en alle features 
          wordt toegevoegd in app.js. Dit is een basis template om mee te starten.
        </div>
      </div>
      
      <button class="btn" onclick="location.reload()">Herstart</button>
    </div>
  `;
}

// NOTE: De volledige onboarding flow (5 stappen) en dashboard 
// kunnen worden toegevoegd vanaf de demo versie.
// Dit is een basis om mee te starten en te testen of de 
// Supabase en Claude API connecties werken.

console.log('App loaded. Ready to start!');

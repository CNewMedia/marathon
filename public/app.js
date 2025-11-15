// Loch Ness Marathon Trainer - Complete Application
// With full onboarding and AI schema generation

// Initialize Supabase
const supabase = window.supabase.createClient(
  CONFIG.supabase.url,
  CONFIG.supabase.anonKey
);

// App State
let currentUser = null;
let currentStep = 1;
let userData = {
  name: '',
  experience: '',
  currentKm: 0,
  longestRun: 0,
  sessionsPerWeek: 4,
  timePerSession: 60,
  timePreferences: [],
  goal: '',
  targetTime: '',
  raceDate: '2026-09-27',
  crossTrain: [],
  medication: [],
  injuries: '',
  notes: ''
};

// Initialize App
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Marathon Trainer initializing...');
  showWelcome();
});

// Show Welcome Screen
function showWelcome() {
  document.getElementById('app').innerHTML = `
    <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%); color: #eee; font-family: sans-serif; padding: 20px;">
      <div style="background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px); border-radius: 20px; padding: 50px; max-width: 500px; width: 100%; text-align: center; border: 1px solid rgba(255, 255, 255, 0.2);">
        <div style="font-size: 4em; margin-bottom: 20px;">🏃‍♂️</div>
        <h1 style="font-size: 2.2em; color: #4ecca3; margin-bottom: 15px;">
          Loch Ness Marathon Trainer
        </h1>
        <p style="color: #aaa; font-size: 1.1em; margin-bottom: 30px;">
          AI-Powered Persoonlijk Trainingsschema
        </p>
        
        <div style="margin-bottom: 20px; text-align: left;">
          <label style="display: block; margin-bottom: 8px; color: #aaa; font-weight: 600;">
            Hoe mogen we je noemen?
          </label>
          <input type="text" id="userName" placeholder="Vul je naam in" style="width: 100%; padding: 15px; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 10px; color: #eee; font-size: 1em;">
        </div>
        
        <button onclick="startOnboarding()" style="width: 100%; padding: 15px; background: linear-gradient(135deg, #e94560, #4ecca3); border: none; border-radius: 10px; color: white; font-size: 1.1em; font-weight: 600; cursor: pointer;">
          🚀 Start Jouw Training
        </button>
        
        <p style="margin-top: 20px; color: #aaa; font-size: 0.9em;">
          We gaan je een paar vragen stellen om een volledig gepersonaliseerd trainingsschema te maken.
        </p>
      </div>
    </div>
  `;
  
  setTimeout(() => document.getElementById('userName')?.focus(), 100);
}

function startOnboarding() {
  const name = document.getElementById('userName')?.value.trim();
  if (!name) {
    alert('Vul je naam in om te beginnen!');
    return;
  }
  userData.name = name;
  currentStep = 1;
  showOnboardingStep(1);
}

function showOnboardingStep(step) {
  currentStep = step;
  
  const steps = [
    { title: 'Niveau', label: 'niveau' },
    { title: 'Beschikbaarheid', label: 'beschikbaarheid' },
    { title: 'Doelen', label: 'doelen' },
    { title: 'Gezondheid', label: 'gezondheid' },
    { title: 'Overzicht', label: 'overzicht' }
  ];
  
  let stepContent = '';
  
  if (step === 1) {
    stepContent = `
      <h2 style="color: #4ecca3; margin-bottom: 10px;">Wat is je huidige loopniveau?</h2>
      <p style="color: #aaa; margin-bottom: 30px;">Dit helpt ons je trainingsschema af te stemmen</p>
      
      <div style="display: grid; gap: 15px; margin-bottom: 30px;">
        <div class="option-card" onclick="selectOption('experience', 'beginner', this)" style="padding: 20px; background: rgba(255, 255, 255, 0.05); border: 2px solid rgba(255, 255, 255, 0.1); border-radius: 12px; cursor: pointer; text-align: center;">
          <div style="font-size: 2em; margin-bottom: 10px;">🌱</div>
          <div style="font-weight: 600; margin-bottom: 5px;">Beginner</div>
          <div style="font-size: 0.85em; color: #aaa;">0-10 km/week</div>
        </div>
        <div class="option-card" onclick="selectOption('experience', 'intermediate', this)" style="padding: 20px; background: rgba(255, 255, 255, 0.05); border: 2px solid rgba(255, 255, 255, 0.1); border-radius: 12px; cursor: pointer; text-align: center;">
          <div style="font-size: 2em; margin-bottom: 10px;">🏃</div>
          <div style="font-weight: 600; margin-bottom: 5px;">Gemiddeld</div>
          <div style="font-size: 0.85em; color: #aaa;">10-25 km/week</div>
        </div>
        <div class="option-card" onclick="selectOption('experience', 'advanced', this)" style="padding: 20px; background: rgba(255, 255, 255, 0.05); border: 2px solid rgba(255, 255, 255, 0.1); border-radius: 12px; cursor: pointer; text-align: center;">
          <div style="font-size: 2em; margin-bottom: 10px;">⚡</div>
          <div style="font-weight: 600; margin-bottom: 5px;">Gevorderd</div>
          <div style="font-size: 0.85em; color: #aaa;">25+ km/week</div>
        </div>
      </div>
      
      <div style="margin-bottom: 20px; text-align: left;">
        <label style="display: block; margin-bottom: 8px; color: #aaa;">Huidige wekelijkse kilometers</label>
        <input type="number" id="currentKm" placeholder="bijv. 15" min="0" max="100" style="width: 100%; padding: 12px; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 8px; color: #eee; font-size: 1em;">
      </div>
      
      <div style="margin-bottom: 20px; text-align: left;">
        <label style="display: block; margin-bottom: 8px; color: #aaa;">Langste recente loop (minuten)</label>
        <input type="number" id="longestRun" placeholder="bijv. 60" min="0" max="300" style="width: 100%; padding: 12px; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 8px; color: #eee; font-size: 1em;">
      </div>
    `;
  } else if (step === 2) {
    stepContent = `
      <h2 style="color: #4ecca3; margin-bottom: 10px;">Hoeveel keer per week kun je trainen?</h2>
      <p style="color: #aaa; margin-bottom: 30px;">We passen het schema aan op jouw beschikbaarheid</p>
      
      <div style="margin: 30px 0;">
        <input type="range" id="sessionsPerWeek" min="3" max="6" value="4" oninput="document.getElementById('sessionsValue').textContent = this.value" style="width: 100%; height: 8px; border-radius: 5px; background: rgba(255, 255, 255, 0.1);">
        <div style="text-align: center; font-size: 1.5em; font-weight: 700; color: #4ecca3; margin: 15px 0;">
          <span id="sessionsValue">4</span> trainingen per week
        </div>
      </div>
      
      <div style="margin-bottom: 20px; text-align: left;">
        <label style="display: block; margin-bottom: 8px; color: #aaa;">Tijd per training</label>
        <select id="timePerSession" style="width: 100%; padding: 12px; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 8px; color: #eee; font-size: 1em;">
          <option value="30">30-45 minuten</option>
          <option value="60" selected>45-75 minuten</option>
          <option value="90">75-120 minuten</option>
        </select>
      </div>
    `;
  } else if (step === 3) {
    stepContent = `
      <h2 style="color: #4ecca3; margin-bottom: 10px;">Wat is je doel?</h2>
      <p style="color: #aaa; margin-bottom: 30px;">Dit bepaalt de intensiteit van je schema</p>
      
      <div style="display: grid; gap: 15px; margin-bottom: 30px;">
        <div class="option-card" onclick="selectOption('goal', 'finish', this)" style="padding: 20px; background: rgba(255, 255, 255, 0.05); border: 2px solid rgba(255, 255, 255, 0.1); border-radius: 12px; cursor: pointer; text-align: center;">
          <div style="font-size: 2em; margin-bottom: 10px;">🎯</div>
          <div style="font-weight: 600;">Finishen</div>
        </div>
        <div class="option-card" onclick="selectOption('goal', 'time', this)" style="padding: 20px; background: rgba(255, 255, 255, 0.05); border: 2px solid rgba(255, 255, 255, 0.1); border-radius: 12px; cursor: pointer; text-align: center;">
          <div style="font-size: 2em; margin-bottom: 10px;">⏱️</div>
          <div style="font-weight: 600;">Tijd Doel</div>
        </div>
      </div>
      
      <div id="targetTimeGroup" style="display: none; margin-bottom: 20px; text-align: left;">
        <label style="display: block; margin-bottom: 8px; color: #aaa;">Doel finish tijd (uren:minuten)</label>
        <div style="display: flex; gap: 10px;">
          <input type="number" id="targetHours" placeholder="4" min="2" max="8" style="width: 100px; padding: 12px; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 8px; color: #eee;">
          <span style="display: flex; align-items: center;">:</span>
          <input type="number" id="targetMinutes" placeholder="30" min="0" max="59" style="width: 100px; padding: 12px; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 8px; color: #eee;">
        </div>
      </div>
    `;
  } else if (step === 4) {
    stepContent = `
      <h2 style="color: #4ecca3; margin-bottom: 10px;">Medische overwegingen</h2>
      <p style="color: #aaa; margin-bottom: 30px;">Dit helpt ons een veilig schema te maken</p>
      
      <div style="padding: 15px; background: rgba(255, 215, 0, 0.1); border: 1px solid #ffd700; border-radius: 10px; margin-bottom: 20px; text-align: left;">
        <span style="font-size: 1.5em;">⚠️</span>
        <span style="color: #ffd700;">Deze info wordt gebruikt om je schema aan te passen</span>
      </div>
      
      <div style="margin-bottom: 20px; text-align: left;">
        <label style="display: block; margin-bottom: 8px; color: #aaa;">Gebruik je medicatie?</label>
        <textarea id="medications" placeholder="bijv. statines, bloedverdunners..." style="width: 100%; padding: 12px; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 8px; color: #eee; min-height: 80px; font-family: inherit;"></textarea>
      </div>
      
      <div style="margin-bottom: 20px; text-align: left;">
        <label style="display: block; margin-bottom: 8px; color: #aaa;">Blessure geschiedenis</label>
        <textarea id="injuries" placeholder="bijv. knieklachten, achillespees..." style="width: 100%; padding: 12px; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 8px; color: #eee; min-height: 80px; font-family: inherit;"></textarea>
      </div>
    `;
  } else if (step === 5) {
    const experienceLabels = {
      'beginner': 'Beginner (0-10 km/week)',
      'intermediate': 'Gemiddeld (10-25 km/week)',
      'advanced': 'Gevorderd (25+ km/week)'
    };
    
    const goalLabels = {
      'finish': 'Marathon finishen',
      'time': `Finish in ${userData.targetTime || '4:30'}`,
    };
    
    stepContent = `
      <h2 style="color: #4ecca3; margin-bottom: 10px;">Jouw Samenvatting</h2>
      <p style="color: #aaa; margin-bottom: 30px;">Controleer je gegevens</p>
      
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 30px;">
        <div style="padding: 15px; background: rgba(255, 255, 255, 0.05); border-radius: 10px; text-align: center;">
          <div style="font-size: 0.9em; color: #aaa; margin-bottom: 5px;">Naam</div>
          <div style="font-size: 1.3em; font-weight: 700;">${userData.name}</div>
        </div>
        <div style="padding: 15px; background: rgba(255, 255, 255, 0.05); border-radius: 10px; text-align: center;">
          <div style="font-size: 0.9em; color: #aaa; margin-bottom: 5px;">Niveau</div>
          <div style="font-size: 1.3em; font-weight: 700;">${experienceLabels[userData.experience] || 'Niet ingevuld'}</div>
        </div>
        <div style="padding: 15px; background: rgba(255, 255, 255, 0.05); border-radius: 10px; text-align: center;">
          <div style="font-size: 0.9em; color: #aaa; margin-bottom: 5px;">Trainingen/Week</div>
          <div style="font-size: 1.3em; font-weight: 700;">${userData.sessionsPerWeek}x</div>
        </div>
        <div style="padding: 15px; background: rgba(255, 255, 255, 0.05); border-radius: 10px; text-align: center;">
          <div style="font-size: 0.9em; color: #aaa; margin-bottom: 5px;">Doel</div>
          <div style="font-size: 1.3em; font-weight: 700;">${goalLabels[userData.goal] || 'Niet ingevuld'}</div>
        </div>
      </div>
      
      <div style="padding: 20px; background: rgba(78, 204, 163, 0.1); border: 1px solid #4ecca3; border-radius: 10px; text-align: left; margin-bottom: 20px;">
        <div style="display: flex; gap: 12px;">
          <span style="font-size: 1.5em;">🤖</span>
          <div>
            <strong style="color: #4ecca3;">AI Personalisatie</strong><br>
            <span style="font-size: 0.9em;">Op basis van je antwoorden genereren we een volledig gepersonaliseerd 45-weken schema!</span>
          </div>
        </div>
      </div>
    `;
  }
  
  document.getElementById('app').innerHTML = `
    <div style="min-height: 100vh; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%); color: #eee; font-family: sans-serif; padding: 20px;">
      <div style="max-width: 800px; margin: 0 auto;">
        
        <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
          ${steps.map((s, i) => `
            <div style="flex: 1; text-align: center;">
              <div style="width: 40px; height: 40px; border-radius: 50%; background: ${i + 1 === step ? '#e94560' : i + 1 < step ? '#4ecca3' : 'rgba(255, 255, 255, 0.1)'}; border: 2px solid ${i + 1 === step ? '#e94560' : i + 1 < step ? '#4ecca3' : 'rgba(255, 255, 255, 0.3)'}; display: inline-flex; align-items: center; justify-content: center; font-weight: 700; margin-bottom: 5px;">
                ${i + 1}
              </div>
              <div style="font-size: 0.85em; color: ${i + 1 === step ? '#eee' : '#aaa'};">${s.title}</div>
            </div>
          `).join('')}
        </div>
        
        <div style="background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px); border-radius: 20px; padding: 40px; border: 1px solid rgba(255, 255, 255, 0.2);">
          ${stepContent}
          
          <div style="display: flex; gap: 15px; margin-top: 30px;">
            ${step > 1 ? '<button onclick="goToStep(' + (step - 1) + ')" style="flex: 1; padding: 12px; background: rgba(255, 255, 255, 0.1); border: none; border-radius: 10px; color: #eee; font-size: 1em; cursor: pointer;">← Terug</button>' : ''}
            <button onclick="${step < 5 ? 'goToStep(' + (step + 1) + ')' : 'generatePlan()'}" style="flex: 1; padding: 12px; background: linear-gradient(135deg, #e94560, #4ecca3); border: none; border-radius: 10px; color: white; font-size: 1em; font-weight: 600; cursor: pointer;">
              ${step < 5 ? 'Volgende →' : '✨ Genereer Mijn Schema'}
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function selectOption(category, value, element) {
  document.querySelectorAll('.option-card').forEach(card => {
    card.style.background = 'rgba(255, 255, 255, 0.05)';
    card.style.borderColor = 'rgba(255, 255, 255, 0.1)';
  });
  
  element.style.background = 'rgba(78, 204, 163, 0.1)';
  element.style.borderColor = '#4ecca3';
  
  userData[category] = value;
  
  if (category === 'goal' && (value === 'time' || value === 'pr')) {
    document.getElementById('targetTimeGroup').style.display = 'block';
  } else if (category === 'goal') {
    document.getElementById('targetTimeGroup').style.display = 'none';
  }
}

function goToStep(step) {
  if (currentStep === 1 && step > 1) {
    userData.currentKm = document.getElementById('currentKm')?.value || 0;
    userData.longestRun = document.getElementById('longestRun')?.value || 0;
  } else if (currentStep === 2 && step > 2) {
    userData.sessionsPerWeek = document.getElementById('sessionsPerWeek')?.value || 4;
    userData.timePerSession = document.getElementById('timePerSession')?.value || 60;
  } else if (currentStep === 3 && step > 3) {
    const hours = document.getElementById('targetHours')?.value;
    const minutes = document.getElementById('targetMinutes')?.value;
    if (hours && minutes) {
      userData.targetTime = `${hours}:${minutes}`;
    }
  } else if (currentStep === 4 && step > 4) {
    userData.medications = document.getElementById('medications')?.value || '';
    userData.injuries = document.getElementById('injuries')?.value || '';
  }
  
  showOnboardingStep(step);
}

function generatePlan() {
  document.getElementById('app').innerHTML = `
    <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%); color: #eee; padding: 20px;">
      <div style="background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px); border-radius: 20px; padding: 40px; max-width: 600px; text-align: center; border: 1px solid rgba(255, 255, 255, 0.2);">
        <div style="width: 80px; height: 80px; border: 6px solid rgba(255, 255, 255, 0.1); border-top-color: #4ecca3; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 30px;"></div>
        <div style="font-size: 1.3em; color: #4ecca3; margin-bottom: 10px;">
          Jouw trainingsschema wordt gegenereerd...
        </div>
        <div style="color: #aaa;">Dit duurt ongeveer 5 seconden</div>
        
        <div style="text-align: left; background: rgba(78, 204, 163, 0.1); padding: 20px; border-radius: 10px; border: 1px solid #4ecca3; margin-top: 30px;">
          <strong style="color: #4ecca3;">Demo Modus:</strong><br>
          <span style="font-size: 0.9em;">
            In productie zou hier de Claude API je volledige 45-weken schema genereren. 
            Voor nu simuleren we dit proces.
          </span>
        </div>
      </div>
    </div>
    <style>
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    </style>
  `;
  
  setTimeout(showDashboard, 3000);
}

function showDashboard() {
  document.getElementById('app').innerHTML = `
    <div style="min-height: 100vh; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%); color: #eee; padding: 20px;">
      <div style="max-width: 1200px; margin: 0 auto;">
        <div style="background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px); border-radius: 20px; padding: 40px; border: 1px solid rgba(255, 255, 255, 0.2); text-align: center; margin-bottom: 30px;">
          <div style="font-size: 4em; margin-bottom: 20px;">🎉</div>
          <h1 style="font-size: 2.5em; color: #4ecca3; margin-bottom: 15px;">Schema Gegenereerd!</h1>
          <p style="font-size: 1.2em; color: #aaa;">Je gepersonaliseerde Loch Ness Marathon trainingsschema is klaar</p>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px;">
          <div style="background: rgba(255, 255, 255, 0.1); padding: 25px; border-radius: 15px; text-align: center;">
            <div style="font-size: 0.9em; color: #aaa; margin-bottom: 5px;">Totale Weken</div>
            <div style="font-size: 2em; font-weight: 700; color: #4ecca3;">45</div>
          </div>
          <div style="background: rgba(255, 255, 255, 0.1); padding: 25px; border-radius: 15px; text-align: center;">
            <div style="font-size: 0.9em; color: #aaa; margin-bottom: 5px;">Trainingen/Week</div>
            <div style="font-size: 2em; font-weight: 700; color: #4ecca3;">${userData.sessionsPerWeek}x</div>
          </div>
          <div style="background: rgba(255, 255, 255, 0.1); padding: 25px; border-radius: 15px; text-align: center;">
            <div style="font-size: 0.9em; color: #aaa; margin-bottom: 5px;">Doel</div>
            <div style="font-size: 2em; font-weight: 700; color: #4ecca3;">Finishen</div>
          </div>
          <div style="background: rgba(255, 255, 255, 0.1); padding: 25px; border-radius: 15px; text-align: center;">
            <div style="font-size: 0.9em; color: #aaa; margin-bottom: 5px;">Race Datum</div>
            <div style="font-size: 2em; font-weight: 700; color: #4ecca3;">27 sep 2026</div>
          </div>
        </div>
        
        <div style="background: rgba(255, 255, 255, 0.1); padding: 30px; border-radius: 15px; margin-bottom: 20px;">
          <h2 style="color: #4ecca3; margin-bottom: 20px;">🎯 Volgende Stappen</h2>
          <div style="background: rgba(78, 204, 163, 0.1); padding: 20px; border-radius: 10px; border-left: 3px solid #4ecca3; margin-bottom: 15px;">
            <strong>Week 1-4:</strong> Terug in beweging - run-walk training, 150-180' per week
          </div>
          <div style="background: rgba(78, 204, 163, 0.1); padding: 20px; border-radius: 10px; border-left: 3px solid #4ecca3; margin-bottom: 15px;">
            <strong>Week 5-12:</strong> Basis opbouwen - 25-35 km/week, lange duur 75-90'
          </div>
          <div style="background: rgba(78, 204, 163, 0.1); padding: 20px; border-radius: 10px; border-left: 3px solid #4ecca3; margin-bottom: 15px;">
            <strong>Week 13-28:</strong> Uitbouwen - 35-45 km/week, heuvels toevoegen
          </div>
          <div style="background: rgba(78, 204, 163, 0.1); padding: 20px; border-radius: 10px; border-left: 3px solid #4ecca3; margin-bottom: 15px;">
            <strong>Week 29-42:</strong> Marathonspecifiek - lange runs 26-32 km
          </div>
          <div style="background: rgba(78, 204, 163, 0.1); padding: 20px; border-radius: 10px; border-left: 3px solid #4ecca3;">
            <strong>Week 43-45:</strong> Taper - volume afbouwen naar race day!
          </div>
        </div>
        
        <button onclick="location.reload()" style="width: 100%; padding: 15px; background: linear-gradient(135deg, #e94560, #4ecca3); border: none; border-radius: 10px; color: white; font-size: 1.1em; font-weight: 600; cursor: pointer;">
          🔄 Nieuw Schema Maken
        </button>
      </div>
    </div>
  `;
}

console.log('Complete app loaded! 🎉');
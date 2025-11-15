// Loch Ness Marathon Trainer - Main Application

// Initialize Supabase
const supabase = window.supabase.createClient(
  CONFIG.supabase.url,
  CONFIG.supabase.anonKey
);

// App State
let currentUser = null;

// Initialize App
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Marathon Trainer initializing...');
  console.log('Config:', CONFIG);
  
  showWelcome();
});

// Show Welcome Screen
function showWelcome() {
  document.getElementById('app').innerHTML = `
    <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%); color: #eee; font-family: sans-serif;">
      <div style="background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px); border-radius: 20px; padding: 50px; max-width: 500px; text-align: center;">
        <div style="font-size: 4em; margin-bottom: 20px;">🏃‍♂️</div>
        <h1 style="font-size: 2em; color: #4ecca3; margin-bottom: 15px;">
          Loch Ness Marathon Trainer
        </h1>
        <p style="color: #aaa; margin-bottom: 30px;">
          AI-Powered Persoonlijk Trainingsschema
        </p>
        
        <div style="margin-bottom: 20px; text-align: left;">
          <label style="display: block; margin-bottom: 8px; color: #aaa;">
            Hoe mogen we je noemen?
          </label>
          <input type="text" id="userName" placeholder="Vul je naam in" style="width: 100%; padding: 15px; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 10px; color: #eee; font-size: 1em;">
        </div>
        
        <button onclick="startOnboarding()" style="width: 100%; padding: 15px; background: linear-gradient(135deg, #e94560, #4ecca3); border: none; border-radius: 10px; color: white; font-size: 1.1em; cursor: pointer;">
          Start Jouw Training
        </button>
      </div>
    </div>
  `;
}

function startOnboarding() {
  const name = document.getElementById('userName').value.trim();
  if (!name) {
    alert('Vul je naam in!');
    return;
  }
  
  document.getElementById('app').innerHTML = `
    <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%); color: #eee; padding: 20px;">
      <div style="background: rgba(255, 255, 255, 0.1); padding: 40px; border-radius: 20px; max-width: 600px; text-align: center;">
        <h1 style="color: #4ecca3;">Welkom ${name}! 🎉</h1>
        <p style="font-size: 1.2em; margin: 20px 0;">
          Je app is live en functioneel!
        </p>
        <button onclick="location.reload()" style="padding: 15px 30px; background: #4ecca3; border: none; border-radius: 10px; color: white; font-size: 1em; cursor: pointer;">
          Opnieuw Starten
        </button>
      </div>
    </div>
  `;
}

console.log('App loaded!');
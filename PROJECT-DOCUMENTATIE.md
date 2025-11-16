# Loch Ness Marathon Trainer - Project Documentatie

**Laatste update:** 16 november 2025  
**Status:** Production Ready  
**Live URL:** https://marathon-trainer-lochness.netlify.app

---

## 📋 INHOUDSOPGAVE

1. [Project Overzicht](#project-overzicht)
2. [Tech Stack](#tech-stack)
3. [Folder Structuur](#folder-structuur)
4. [Database Schema](#database-schema)
5. [Authenticatie Flow](#authenticatie-flow)
6. [Core Features](#core-features)
7. [API Endpoints](#api-endpoints)
8. [Deployment](#deployment)
9. [Belangrijke Configuraties](#belangrijke-configuraties)
10. [Veelvoorkomende Taken](#veelvoorkomende-taken)
11. [Troubleshooting](#troubleshooting)

---

## 🎯 PROJECT OVERZICHT

Een AI-powered marathon trainingsapp die gebruikers door een gepersonaliseerd 45-weken trainingsschema leidt voor de Loch Ness Marathon (27 september 2026).

**Key Features:**
- Google OAuth authenticatie
- AI-gegenereerde gepersonaliseerde trainingsschema's
- Cloud sync via Supabase
- Gedetailleerde workout tracking
- Multi-device support
- Responsive design

---

## 💻 TECH STACK

### Frontend
- **Vanilla JavaScript** (geen frameworks)
- **HTML5**
- **CSS3** (custom styling, geen frameworks)
- **Supabase JS Client** voor database & auth

### Backend
- **Netlify Functions** (serverless)
- **Node.js** runtime
- **Supabase** (PostgreSQL database)

### Hosting & Services
- **Netlify** - hosting & CI/CD
- **Supabase** - database, auth, storage
- **Google Cloud Platform** - OAuth credentials

---

## 📁 FOLDER STRUCTUUR

```
marathon/
├── api/
│   └── generate-plan.js          # Netlify function voor AI plan generatie
├── public/
│   ├── index.html                # Main HTML file
│   ├── app.js                    # Complete app logica met Google Auth
│   ├── styles.css                # Complete styling
│   └── config.js                 # Supabase config (NIET in Git!)
├── netlify.toml                  # Netlify configuratie
├── package.json                  # Dependencies
└── README.md
```

### Belangrijke Files

#### `public/config.js` (NIET IN GIT!)
```javascript
const CONFIG = {
  supabase: {
    url: 'https://uneazkpnasexwnyvsunr.supabase.co',
    anonKey: 'YOUR_ANON_KEY_HERE'
  }
};
```

#### `public/index.html`
Minimale HTML met:
- Supabase CDN script
- config.js
- app.js
- styles.css
- Div met id="app" voor dynamic content

#### `public/app.js`
Complete app logica:
- Google OAuth flow
- Supabase data sync
- Onboarding (7 stappen)
- Dashboard rendering
- Workout tracking
- Modal management

#### `public/styles.css`
Complete styling:
- CSS variables voor theming
- Responsive design (mobile/tablet/desktop)
- Animations
- 3-column dashboard layout
- Modal styling

#### `api/generate-plan.js`
Netlify serverless function:
- Input: userData object
- Output: 45-week training plan met 5 fases
- Gedetailleerde workouts (sets, reps, instructies)
- Gepersonaliseerde adviezen

---

## 🗄️ DATABASE SCHEMA

### Supabase Tables

#### `user_profiles`
```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY,                    -- Matches auth.users.id
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  age INTEGER,
  gender TEXT,
  weight DECIMAL,
  height DECIMAL,
  experience TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### `training_plans`
```sql
CREATE TABLE training_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  plan_data JSONB NOT NULL,              -- Complete plan object
  current_week INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### `workout_progress`
```sql
CREATE TABLE workout_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES training_plans(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  workout_day TEXT NOT NULL,
  workout_type TEXT,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP,
  skipped BOOLEAN DEFAULT false,
  
  -- Extra tracking data
  actual_duration INTEGER,              -- in minuten
  actual_distance NUMERIC,              -- in km
  actual_pace TEXT,
  average_heart_rate INTEGER,
  perceived_effort INTEGER,             -- 1-10 schaal
  felt_good BOOLEAN,
  notes TEXT,
  weather TEXT,
  temperature INTEGER,
  location TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, week_number, workout_day)
);
```

#### `weekly_reflections`
```sql
CREATE TABLE weekly_reflections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  overall_feeling INTEGER,              -- 1-10
  energy_level INTEGER,                 -- 1-10
  sleep_quality INTEGER,                -- 1-10
  motivation INTEGER,                   -- 1-10
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, week_number)
);
```

### Row Level Security (RLS)

**Alle tabellen hebben RLS enabled:**

```sql
-- Users kunnen alleen eigen data zien/wijzigen
CREATE POLICY "Users can view own data" ON user_profiles
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own data" ON user_profiles
  FOR UPDATE USING (auth.uid()::text = id::text);

-- Hetzelfde voor training_plans, workout_progress, weekly_reflections
```

---

## 🔐 AUTHENTICATIE FLOW

### Google OAuth Setup

#### 1. Google Cloud Console
- Project: **Marathon** (ID: 1023690573450)
- OAuth Client ID: `1023690573450-ps86qied4rgk1gu97dsufacavaggt9mg.apps.googleusercontent.com`
- Client Secret: `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`
- Authorized redirect URI: `https://uneazkpnasexwnyvsunr.supabase.co/auth/v1/callback`

#### 2. Supabase Auth Setup
- **Authentication → Providers → Google**
- Client ID en Secret ingevuld
- Enabled ✅

#### 3. Login Flow in App

```javascript
// 1. User klikt "Inloggen met Google"
async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin
    }
  });
}

// 2. Google popup → user selecteert account

// 3. Redirect terug naar app

// 4. Auth state change event
supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === 'SIGNED_IN' && session) {
    currentUser = session.user;
    await loadUserData();
    // Show dashboard of onboarding
  }
});

// 5. Check of user profile bestaat, anders aanmaken
const { data: profile } = await supabase
  .from('user_profiles')
  .select('*')
  .eq('id', currentUser.id)
  .single();

if (!profile) {
  // Maak nieuw profiel aan
  await supabase.from('user_profiles').insert([{
    id: currentUser.id,
    email: currentUser.email,
    name: currentUser.user_metadata?.full_name
  }]);
}
```

---

## ⚙️ CORE FEATURES

### 1. Onboarding (7 Stappen)

**Stap 1: Persoonlijk**
- Leeftijd, geslacht, gewicht, lengte
- **BMI wordt berekend:** `weight / (height/100)²`

**Stap 2: Sportief**
- Loopervaring (jaren)
- Niveau (beginner/intermediate/advanced)
- Huidige km/week
- Langste loop

**Stap 3: Historiek** ⭐ NIEUW
- Textarea voor trainingshistoriek laatste 6 maanden
- Gebruikt in AI plan generatie

**Stap 4: Gezondheid**
- Blessures
- Medicatie

**Stap 5: Beschikbaarheid**
- Trainingen per week (3-6)
- Tijd per sessie
- Krachttraining ervaring

**Stap 6: Doelen**
- Finishen / Tijd doel
- Target tijd (HH:MM)

**Stap 7: Overzicht**
- Samenvatting
- BMI display
- "Genereer AI Schema" knop

### 2. AI Plan Generatie

**Input:**
```javascript
{
  userData: {
    name, age, gender, weight, height,
    experience, trainingHistory,
    injuries, medications,
    sessionsPerWeek, goal, targetTime,
    strengthTraining
  }
}
```

**Output:**
```javascript
{
  plan: {
    phases: [
      {
        name: "Fase 1 - Terug in beweging",
        weeks: [1, 2, 3, 4],
        description: "Run-walk, trap lopen zonder buiten adem",
        weeklyMinutes: "150-180'",
        workouts: [
          {
            type: "Run-Walk",
            description: "10×(1' joggen / 2' wandelen). Start met 5' wandelen als warm-up...",
            day: "Maandag"
          },
          {
            type: "Kracht",
            description: "30-40' - Heup/bil: 3×12 squats, 3×10 lunges per been, 3×15 glute bridges...",
            day: "Dinsdag"
          }
          // ... meer workouts
        ]
      }
      // ... 5 fases totaal
    ],
    personalizedAdvice: "Voor John: Extra focus op herstel..."
  }
}
```

**Fases:**
1. **Fase 1** (wk 1-4): Terug in beweging - Run-walk
2. **Fase 2** (wk 5-12): Basis opbouwen - 25-35 km/week
3. **Fase 3** (wk 13-28): Uitbouwen - 35-45 km/week
4. **Fase 4** (wk 29-42): Marathon specifiek - 45-60 km/week, MP workouts
5. **Fase 5** (wk 43-45): Taper - Volume afbouwen

### 3. Dashboard

**3-kolom layout:**
1. **Totale Voortgang** - Progress ring
2. **Week Statistieken** - Huidige week, weken te gaan, trainingen voltooid
3. **Deze Week** - Quick access, X/Y trainingen

**Features:**
- Fase selector buttons (filter weken per fase)
- Week calendar (grid met alle weken van huidige fase)
- Week cards (klikbaar → modal)
- Tips sectie (gepersonaliseerd op basis van BMI, leeftijd, ervaring, historiek)

### 4. Workout Tracking

**Afvinken:**
```javascript
async function toggleWorkout(workoutId, event) {
  const [weekNum, day] = workoutId.split('-');
  
  if (completedWorkouts.has(workoutId)) {
    // Uncheck
    completedWorkouts.delete(workoutId);
    await supabase.from('workout_progress').delete()
      .eq('user_id', currentUser.id)
      .eq('week_number', parseInt(weekNum))
      .eq('workout_day', day);
  } else {
    // Check
    completedWorkouts.add(workoutId);
    await supabase.from('workout_progress').insert([{
      user_id: currentUser.id,
      week_number: parseInt(weekNum),
      workout_day: day,
      workout_type: workout.type,
      completed: true,
      completed_at: new Date().toISOString()
    }]);
  }
}
```

**Week voltooien:**
```javascript
function markWeekComplete(weekNum) {
  const phase = getPhaseForWeek(weekNum);
  phase.workouts.forEach(w => {
    completedWorkouts.add(weekNum + '-' + w.day);
  });
  if (weekNum === currentWeekNumber) currentWeekNumber++;
  saveProgress();
}
```

### 5. Data Sync

**Save Progress:**
```javascript
async function saveProgress() {
  if (!currentUser) {
    // Fallback naar localStorage
    localStorage.setItem('marathonProgress', JSON.stringify({
      completedWorkouts: Array.from(completedWorkouts),
      currentWeek: currentWeekNumber,
      userData,
      generatedPlan
    }));
    return;
  }
  
  // Save naar Supabase
  await supabase.from('training_plans').upsert({
    user_id: currentUser.id,
    plan_data: generatedPlan,
    current_week: currentWeekNumber,
    updated_at: new Date().toISOString()
  });
}
```

**Load User Data:**
```javascript
async function loadUserData() {
  // 1. Load profile
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', currentUser.id)
    .single();
  
  // 2. Load training plan
  const { data: plans } = await supabase
    .from('training_plans')
    .select('*')
    .eq('user_id', currentUser.id)
    .order('created_at', { ascending: false })
    .limit(1);
  
  // 3. Load workout progress
  const { data: progress } = await supabase
    .from('workout_progress')
    .select('week_number, workout_day')
    .eq('user_id', currentUser.id)
    .eq('completed', true);
  
  completedWorkouts = new Set(
    progress.map(p => `${p.week_number}-${p.workout_day}`)
  );
}
```

---

## 🔌 API ENDPOINTS

### Netlify Functions

#### `/.netlify/functions/generate-plan`

**Method:** POST

**Request:**
```json
{
  "userData": {
    "name": "John",
    "age": 35,
    "gender": "M",
    "weight": 75,
    "height": 180,
    "experience": "intermediate",
    "trainingHistory": "3x per week 5km...",
    "injuries": "",
    "medications": "",
    "sessionsPerWeek": 4,
    "goal": "finish",
    "targetTime": "",
    "strengthTraining": true
  }
}
```

**Response:**
```json
{
  "plan": {
    "phases": [...],
    "personalizedAdvice": "..."
  },
  "generated": "2025-11-16T14:30:00Z"
}
```

**Implementation:**
```javascript
exports.handler = async (event, context) => {
  const { userData } = JSON.parse(event.body);
  
  // Calculate BMI
  const bmi = userData.weight && userData.height 
    ? (userData.weight / Math.pow(userData.height / 100, 2)) 
    : 0;
  
  // Generate personalized plan
  const plan = {
    phases: [
      // 5 phases met gedetailleerde workouts
    ],
    personalizedAdvice: getPersonalizedAdvice(userData, bmi)
  };
  
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({ plan })
  };
};
```

---

## 🚀 DEPLOYMENT

### Netlify Setup

**Build Settings:**
```toml
[build]
  publish = "public"
  
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

**Environment Variables** (Netlify Dashboard):
```
SUPABASE_URL=https://uneazkpnasexwnyvsunr.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Deploy Process:**
```bash
# 1. Push naar GitHub
git add .
git commit -m "Update"
git push origin main

# 2. Netlify auto-deploy (connected to GitHub)
# 3. Live binnen ~1 minuut
```

### Manual Deploy:
```bash
npm install -g netlify-cli
netlify login
netlify deploy --prod
```

---

## ⚙️ BELANGRIJKE CONFIGURATIES

### 1. Supabase Project
- **Project ID:** uneazkpnasexwnyvsunr
- **Region:** West Europe
- **URL:** https://uneazkpnasexwnyvsunr.supabase.co
- **Anon Key:** In config.js (NIET in Git!)

### 2. Google OAuth
- **Project:** Marathon
- **Client ID:** 1023690573450-ps86qied4rgk1gu97dsufacavaggt9mg.apps.googleusercontent.com
- **Redirect URI:** https://uneazkpnasexwnyvsunr.supabase.co/auth/v1/callback

### 3. Netlify
- **Site Name:** marathon-trainer-lochness
- **Domain:** https://marathon-trainer-lochness.netlify.app
- **GitHub Repo:** Connected
- **Auto Deploy:** Enabled

---

## 🔧 VEELVOORKOMENDE TAKEN

### Nieuwe Feature Toevoegen

1. **Lokaal ontwikkelen:**
```bash
cd ~/Documents/GitHub/marathon
# Edit files in public/
```

2. **Testen:**
```bash
# Open index.html in browser
# OF gebruik local server:
npx serve public
```

3. **Deployen:**
```bash
git add .
git commit -m "Add feature X"
git push
```

### Database Query Uitvoeren

```javascript
// In browser console (na inloggen):
const { data, error } = await supabase
  .from('workout_progress')
  .select('*')
  .eq('user_id', currentUser.id);

console.log(data);
```

### Plan Structuur Aanpassen

**Bewerk:** `api/generate-plan.js`

```javascript
// Voeg nieuwe fase toe of wijzig workouts
{
  name: "Fase 6 - Recovery",
  weeks: [46],
  description: "Post-race recovery",
  weeklyMinutes: "60'",
  workouts: [
    {
      type: "Easy Walk",
      description: "30' wandelen",
      day: "Maandag"
    }
  ]
}
```

### Styling Aanpassen

**Bewerk:** `public/styles.css`

```css
/* Bijvoorbeeld: verander primary color */
:root {
  --success: #00ff00;  /* Was #4ecca3 */
}
```

---

## 🐛 TROUBLESHOOTING

### "Auth error: Invalid login"
**Probleem:** Google OAuth werkt niet  
**Oplossing:**
1. Check Google Cloud Console → Client ID correct?
2. Check Supabase → Google provider enabled?
3. Check redirect URI: `https://[PROJECT].supabase.co/auth/v1/callback`

### "Network error" bij plan generatie
**Probleem:** Netlify function niet bereikbaar  
**Oplossing:**
1. Check `api/generate-plan.js` bestaat
2. Check `netlify.toml` configuratie
3. Test lokaal: `netlify dev`
4. Check function logs in Netlify Dashboard

### Data wordt niet opgeslagen
**Probleem:** Supabase RLS policies  
**Oplossing:**
```sql
-- Check policies
SELECT * FROM pg_policies 
WHERE tablename = 'workout_progress';

-- Test zonder RLS (TIJDELIJK)
ALTER TABLE workout_progress DISABLE ROW LEVEL SECURITY;
```

### App laadt niet na deploy
**Probleem:** config.js niet aanwezig  
**Oplossing:**
1. Check `public/config.js` exists
2. Voeg toe aan `.gitignore`
3. Zet environment variables in Netlify
4. OF: hardcode in app.js (NIET AANBEVOLEN)

### Workouts niet zichtbaar in modal
**Probleem:** Phase/week matching  
**Oplossing:**
```javascript
// Debug in console:
console.log('Current week:', currentWeekNumber);
console.log('Phases:', generatedPlan.phases);

const phase = getPhaseForWeek(currentWeekNumber);
console.log('Current phase:', phase);
```

---

## 📚 EXTRA RESOURCES

### Documentatie
- **Supabase:** https://supabase.com/docs
- **Netlify Functions:** https://docs.netlify.com/functions/overview/
- **Google OAuth:** https://developers.google.com/identity/protocols/oauth2

### Belangrijke Links
- **GitHub Repo:** [Link naar repo]
- **Netlify Dashboard:** https://app.netlify.com/sites/marathon-trainer-lochness
- **Supabase Dashboard:** https://supabase.com/dashboard/project/uneazkpnasexwnyvsunr
- **Google Cloud Console:** https://console.cloud.google.com/apis/credentials?project=marathon

---

## 🔑 CREDENTIALS (VEILIG BEWAREN!)

**Supabase:**
- URL: `https://uneazkpnasexwnyvsunr.supabase.co`
- Anon Key: `[IN config.js]`
- Service Role Key: `[IN Supabase Dashboard]`

**Google OAuth:**
- Client ID: `1023690573450-ps86qied4rgk1gu97dsufacavaggt9mg.apps.googleusercontent.com`
- Client Secret: `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`

**Netlify:**
- Site ID: `[IN Netlify Dashboard]`
- Deploy Key: `[IN Netlify Settings]`

---

## ✅ CHECKLIST VOOR NIEUWE DEVELOPER

- [ ] Clone GitHub repo
- [ ] Installeer Node.js (v18+)
- [ ] Maak `public/config.js` aan met Supabase credentials
- [ ] Test lokaal: open `public/index.html` in browser
- [ ] Maak Supabase account (of krijg toegang tot bestaand project)
- [ ] Krijg toegang tot Netlify site
- [ ] Krijg toegang tot Google Cloud project (voor OAuth)
- [ ] Test Google login flow
- [ ] Test plan generatie
- [ ] Test workout tracking
- [ ] Check mobile responsive design

---

## 📞 CONTACT

**Project Owner:** Christophe  
**Email:** christophe@cnip.be

**Voor vragen over:**
- Supabase: Check dashboard of docs
- Netlify: Check build logs
- Code: Check deze documentatie eerst

---

**Laatste wijzigingen:**
- 16 nov 2025: Google OAuth geïmplementeerd
- 16 nov 2025: Gedetailleerde workouts toegevoegd (sets, reps, instructies)
- 16 nov 2025: BMI berekening geïntegreerd
- 16 nov 2025: Trainingshistoriek vraag toegevoegd (stap 3)
- 16 nov 2025: 3-kolom dashboard layout
- 16 nov 2025: Fase filtering (toon alleen huidige fase weken)

**Volgende stappen:**
- [ ] Email notificaties voor week reminders
- [ ] PDF export van trainingsplan
- [ ] Social sharing van progressie
- [ ] Strava integratie
- [ ] Apple Health / Google Fit sync
- [ ] Coach dashboard voor meerdere atleten

---

**SUCCES MET ONTWIKKELEN! 🚀**

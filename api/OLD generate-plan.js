const Anthropic = require('@anthropic-ai/sdk');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  console.log('=== GENERATE PLAN CALLED ===');

  try {
    const { userData } = JSON.parse(event.body);
    console.log('User:', userData.name);
    console.log('Sessions per week:', userData.sessionsPerWeek);
    console.log('Strength training:', userData.strengthTraining);
    
    const sessionsPerWeek = parseInt(userData.sessionsPerWeek) || 4;
    const includeStrength = userData.strengthTraining === true;
    
    // Try AI generation if API key is available
    let plan;
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        console.log('Attempting AI generation...');
        plan = await generateWithAI(userData, sessionsPerWeek, includeStrength);
        console.log('AI generation successful');
      } catch (aiError) {
        console.error('AI generation failed:', aiError.message);
        console.log('Falling back to rule-based plan');
        plan = generateRuleBasedPlan(userData, sessionsPerWeek, includeStrength);
      }
    } else {
      console.log('No API key, using rule-based plan');
      plan = generateRuleBasedPlan(userData, sessionsPerWeek, includeStrength);
    }

    console.log('Plan phases:', plan.phases.length);
    console.log('Phase 1 workouts:', plan.phases[0].workouts.length);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        plan, 
        generated: new Date().toISOString(),
        aiGenerated: !!process.env.ANTHROPIC_API_KEY
      })
    };

  } catch (error) {
    console.error('Fatal error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};

// ============================================
// AI GENERATION (if API key available)
// ============================================
async function generateWithAI(userData, sessionsPerWeek, includeStrength) {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
  });

  const bmi = userData.weight && userData.height 
    ? (userData.weight / Math.pow(userData.height / 100, 2)).toFixed(1) 
    : 'unknown';

  const prompt = `Je bent een professionele marathon coach met kennis van Hal Higdon, Pfitzinger en Jack Daniels trainingsmethoden.

Genereer een wetenschappelijk onderbouwd 45-weken trainingsschema voor de Loch Ness Marathon.

KRITIEKE INFORMATIE:
- Race datum: 27 september 2026 (zondag) - WEEK 45, DAG ZONDAG
- Start training: 15 november 2025 (zaterdag) - WEEK 1
- Totaal: EXACT 45 weken

GEBRUIKERSPROFIEL:
- Naam: ${userData.name}
- Leeftijd: ${userData.age} jaar
- Gewicht: ${userData.weight}kg, Lengte: ${userData.height}cm, BMI: ${bmi}
- Loopervaring: ${userData.experience}
- Huidige km/week: ${userData.currentKmPerWeek} km
- Langste run ooit: ${userData.longestRun} km
- Eerdere marathons: ${userData.previousMarathons}
- Blessures: ${userData.injuries || 'geen'}
- Doel: ${userData.goal === 'time' ? `Finish in ${userData.targetTime}` : 'Veilig finishen'}

TRAININGSVOORKEUREN:
- Aantal run sessies per week: ${sessionsPerWeek}
- Krachttraining: ${includeStrength ? 'JA - 2x per week (Ma+Wo/Do)' : 'NEE'}
- Beschikbare tijd per sessie: ~${userData.timePerSession || 60} minuten

PROFESSIONELE RICHTLIJNEN:
1. PROGRESSIE: 10% regel - verhoog volume max 10% per week
2. HARD/EASY: Na elke zware dag volgt een rustige dag of rustdag
3. LONG RUN: Zondag = lange duur (build naar 3+ uur in fase 4)
4. WEEKEND: Back-to-back is OK (Za mid-long + Zo long = marathon-specifiek)
5. RECOVERY: Minimaal 1 volledige rustdag per week (niet tonen in schema!)
6. TAPER: Laatste 2-3 weken volume -40% maar intensiteit behouden

WORKOUT TYPES (gebaseerd op Jack Daniels):
- Easy Run (Zone 2): Conversatietempo, 60-70% max HR
- Long Run (Zone 2): 90-180+ minuten, aerobe base
- Tempo Run (Zone 3): Comfortably hard, 80-85% max HR, 20-40 min
- Marathon Pace (MP): Race tempo, laatste 8-12 weken
- Intervals: 400m-1km repeats, VO2max werk
- Strides: 15-20 sec @ 90% max, techniek + snelheid

SCHEMA STRUCTUUR (5 FASES):

FASE 1 (Week 1-4) - "Basis Leggen"
- Doel: Gewenning, run-walk methode voor beginners
- Volume: 120-180 min/week
- Focus: Blessurepreventie, techniek
- Voor ${sessionsPerWeek} sessies: Lange run (Zo) + easy runs

FASE 2 (Week 5-12) - "Aerobe Base"
- Doel: Volume opbouwen naar 25-35 km/week
- Volume: 200-260 min/week
- Focus: Zone 2 werk, endurance
- Introduce: Strides (1x/week), eerste tempo runs
- Long run build: 75 → 105 minuten

FASE 3 (Week 13-28) - "Volume Peak"
- Doel: 35-50 km/week, sterke aerobe base
- Volume: 240-300 min/week
- Focus: Long runs (105-135 min), tempo runs
- Workout patroon: Za mid-long (60-75) + Zo long (105-135) + Wo tempo
- Voor ${sessionsPerWeek} sessies: Prioriteer long runs + 1 quality

FASE 4 (Week 29-42) - "Marathon Specifiek"
- Doel: Race-ready, marathon pace integreren
- Volume: Peak 50-65 km/week (week 36-38)
- Focus: Long runs met MP finish, MP workouts
- KEY WORKOUTS:
  * Zo: 2u45-3u15 (laatste 30-60' aan MP)
  * Za: 60-90' easy/progressive
  * Midweek: 2-3x 15-20' @ MP
- Voor ${sessionsPerWeek} sessies: Long run + MP workout + easy runs

FASE 5 (Week 43-45) - "Taper"
- Week 43: -20% volume
- Week 44: -40% volume
- Week 45: Mini runs, RACE ZONDAG 27 SEPTEMBER
- Behoud: 1-2 MP intervals (kort!), strides
- Doel: Fris en scherp aan start

WORKOUT VERDELING VOOR ${sessionsPerWeek} SESSIES:
${sessionsPerWeek === 3 ? `
3 SESSIES (minimaal maar effectief):
- Zondag: Long run (build 60 → 180+ min)
- Woensdag/Donderdag: Quality (tempo/MP/intervals)
- Zaterdag OF Dinsdag: Easy run (45-60 min)
` : ''}
${sessionsPerWeek === 4 ? `
4 SESSIES (optimaal voor meeste runners):
- Zondag: Long run (build 75 → 195 min)
- Zaterdag: Mid-long run (60-90 min easy)
- Woensdag/Donderdag: Quality (tempo/MP/intervals)
- Dinsdag: Easy run (40-50 min recovery)
` : ''}
${sessionsPerWeek === 5 ? `
5 SESSIES (gevorderden):
- Zondag: Long run (90 → 210 min)
- Zaterdag: Mid-long (75-105 min)
- Woensdag: Tempo/MP workout
- Dinsdag: Easy run (45-60 min)
- Donderdag/Vrijdag: Easy + strides OF recovery run
` : ''}
${sessionsPerWeek === 6 ? `
6 SESSIES (competitieve runners):
- Zondag: Long run (105 → 210+ min)
- Zaterdag: Mid-long (75-120 min)
- Woensdag: Primary quality (tempo/MP)
- Dinsdag: Easy run (50-60 min)
- Donderdag: Secondary quality (strides/intervals)
- Vrijdag: Short easy (30-45 min)
- Maandag: RUST (verplicht!)
` : ''}

BELANGRIJKE REGELS:
1. GEEN rustdagen als workout tonen - gewoon weglaten uit schema
2. Week 45, Zondag = "🏁 LOCH NESS MARATHON - 27 SEPTEMBER 2026"
3. Back-to-back weekend (Za+Zo) is NORMAAL en effectief voor marathon prep
4. Progressive long runs: start kort (60-75'), build naar 3+ uur
5. Marathon pace: introduceer vanaf week 20, intensiveer vanaf week 30
6. ${includeStrength ? 'Krachttraining op Ma+Wo of Ma+Do, NOOIT dag voor/na long run' : 'Geen kracht'}

OUTPUT FORMAT (JSON):
{
  "phases": [
    {
      "name": "Fase 1 - Basis Leggen",
      "weeks": [1,2,3,4],
      "description": "Run-walk methode, blessurepreventie, gewenning",
      "weeklyMinutes": "120-180'",
      "workouts": [
        {"type": "Lange Duur", "description": "60' run-walk: 3' jog / 1' walk. Start Z2.", "day": "Zondag"},
        {"type": "Easy Run", "description": "40' rustig joggen Z2. Conversatietempo.", "day": "Dinsdag"}
        // GEEN rustdagen!
      ]
    }
  ],
  "personalizedAdvice": "Voor ${userData.name}: [specifiek advies op basis van leeftijd/ervaring/doel]"
}

Genereer een professioneel, bewezen schema. Wees specifiek met tijden en intensiteiten!`;

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8000,
    temperature: 0.7,
    messages: [{ role: 'user', content: prompt }]
  });

  const responseText = message.content[0].text;
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON in AI response');
  
  const plan = JSON.parse(jsonMatch[0]);
  return validatePlan(plan, sessionsPerWeek, includeStrength);
}

// ============================================
// RULE-BASED GENERATION (fallback)
// ============================================
function generateRuleBasedPlan(userData, sessionsPerWeek, includeStrength) {
  console.log(`Generating rule-based plan: ${sessionsPerWeek} sessions, strength=${includeStrength}`);
  
  return {
    phases: [
      buildPhase1(sessionsPerWeek, includeStrength),
      buildPhase2(sessionsPerWeek, includeStrength),
      buildPhase3(sessionsPerWeek, includeStrength),
      buildPhase4(sessionsPerWeek, includeStrength),
      buildPhase5(sessionsPerWeek, includeStrength)
    ],
    personalizedAdvice: getAdvice(userData)
  };
}

// ============================================
// WORKOUT BUILDER - THE CORE LOGIC
// ============================================
function buildWeeklyPlan(runWorkouts, strengthWorkouts, sessionsPerWeek, includeStrength) {
  console.log(`Building weekly plan: ${sessionsPerWeek} run sessions, strength=${includeStrength}`);
  
  let allWorkouts = [];
  const usedDays = new Set();
  
  // Step 1: Add exactly sessionsPerWeek RUN workouts
  const selectedRuns = runWorkouts.slice(0, sessionsPerWeek);
  console.log(`Selected ${selectedRuns.length} run workouts:`, selectedRuns.map(w => w.type));
  
  selectedRuns.forEach(workout => {
    allWorkouts.push(workout);
    usedDays.add(workout.day);
  });
  
  // Step 2: Add strength if requested (max 2)
  if (includeStrength) {
    const strengthDayPreferences = ['Maandag', 'Woensdag', 'Donderdag', 'Vrijdag'];
    let strengthAdded = 0;
    
    for (const preferredDay of strengthDayPreferences) {
      if (strengthAdded >= 2) break;
      if (!usedDays.has(preferredDay)) {
        allWorkouts.push({
          type: "Kracht",
          description: strengthWorkouts[strengthAdded]?.description || "Krachttraining",
          day: preferredDay
        });
        usedDays.add(preferredDay);
        strengthAdded++;
      }
    }
    console.log(`Added ${strengthAdded} strength workouts`);
  }
  
  // Step 3: GEEN rustdagen toevoegen - laat vrije dagen gewoon leeg
  // Rustdagen zijn impliciet: alle dagen zonder workout
  
  // Step 4: Sort by day order
  const dayOrder = ['Zaterdag', 'Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag'];
  allWorkouts.sort((a, b) => dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day));
  
  console.log(`Final workout count: ${allWorkouts.length} (rest days implicit)`);
  console.log(`Days:`, allWorkouts.map(w => `${w.day}(${w.type})`).join(', '));
  
  return allWorkouts;
}

// ============================================
// FASE 1: Week 1-4 - BASIS
// ============================================
function buildPhase1(sessionsPerWeek, includeStrength) {
  // Define ALL possible run workouts for this phase, in priority order
  const runWorkouts = [
    { type: "Lange Duur", description: "45-50' run-walk in zone 2. Wissel 3' joggen / 1' wandelen.", day: "Zondag" },
    { type: "Run-Walk", description: "10×(1' joggen / 2' wandelen). Start met 5' wandelen.", day: "Zaterdag" },
    { type: "Easy Run", description: "30' rustig joggen in zone 2. Conversatietempo.", day: "Dinsdag" },
    { type: "Run-Walk", description: "8×(2' joggen / 2' wandelen). Comfortabel tempo.", day: "Donderdag" },
    { type: "Strides", description: "25' rustig + 4×15\" strides op 85% max snelheid.", day: "Vrijdag" },
    { type: "Tempo", description: "35' waarvan 15' iets vlotter. Niet hard!", day: "Woensdag" }
  ];
  
  const strengthWorkouts = [
    { type: "Kracht", description: "30' - Core: 3×12 squats, 3×10 lunges, 3×30\" plank", day: "Maandag" },
    { type: "Kracht", description: "30' - Full body: 3×12 deadlifts, 3×10 step-ups, 3×15 rows", day: "Woensdag" }
  ];
  
  return {
    name: "Fase 1 - Basis Opbouw",
    weeks: [1, 2, 3, 4],
    description: "Run-walk en basisconditie opbouwen",
    weeklyMinutes: "120-180'",
    workouts: buildWeeklyPlan(runWorkouts, strengthWorkouts, sessionsPerWeek, includeStrength)
  };
}

// ============================================
// FASE 2: Week 5-12 - VOLUME
// ============================================
function buildPhase2(sessionsPerWeek, includeStrength) {
  const runWorkouts = [
    { type: "Lange Duur", description: "75-90' in zone 2. Start rustig, oefen voeding.", day: "Zondag" },
    { type: "Easy Run", description: "45-60' easy run in zone 2. Conversatietempo.", day: "Zaterdag" },
    { type: "Z2 Duur", description: "50' comfortabel Z2. Laatste 10' mag vlotter.", day: "Dinsdag" },
    { type: "Tempo", description: "45' totaal: 10' warm-up, 20' tempo, 15' cool-down", day: "Woensdag" },
    { type: "Strides", description: "40' easy + 6×20\" strides op 85-90% max.", day: "Donderdag" },
    { type: "Easy Run", description: "35' herstelrun. Bewust langzaam.", day: "Vrijdag" }
  ];
  
  const strengthWorkouts = [
    { type: "Kracht", description: "35' - Power: 3×15 squats, 3×12 deadlifts, 3×10 box jumps", day: "Maandag" },
    { type: "Kracht", description: "35' - Stabiliteit: 3×12 single-leg RDL, 3×10 Bulgarian splits", day: "Woensdag" }
  ];
  
  return {
    name: "Fase 2 - Volume Opbouwen",
    weeks: [5, 6, 7, 8, 9, 10, 11, 12],
    description: "Opbouwen naar 25-35 km/week",
    weeklyMinutes: "200-260'",
    workouts: buildWeeklyPlan(runWorkouts, strengthWorkouts, sessionsPerWeek, includeStrength)
  };
}

// ============================================
// FASE 3: Week 13-28 - UITBOUWEN
// ============================================
function buildPhase3(sessionsPerWeek, includeStrength) {
  const runWorkouts = [
    { type: "Lange Duur", description: "105-120' zone 2. Laatste 20-30' vlotter. Oefen race voeding vanaf 90'.", day: "Zondag" },
    { type: "Z2 Duur", description: "60-75' comfortabel Z2. Focus op constant tempo.", day: "Zaterdag" },
    { type: "Tempo Run", description: "50': 10' warm-up, 4×5' tempo (~80-85% max HR), 2' rust tussen, 10' cool-down", day: "Woensdag" },
    { type: "Easy Run", description: "45-60' herstelrun. Bewust langzaam!", day: "Dinsdag" },
    { type: "Progression", description: "60' start Z2, laatste 15-20' naar tempo pace", day: "Donderdag" },
    { type: "Strides", description: "50' Z2 + 8×20\" strides. Z2 comfortabel, strides scherp.", day: "Vrijdag" }
  ];
  
  const strengthWorkouts = [
    { type: "Kracht", description: "35' - Heavy: 4×10 squats, 4×8 deadlifts, 3×10 lunges", day: "Maandag" },
    { type: "Kracht", description: "35' - Core: 3×12 single-leg RDL, 3×60\" plank variations", day: "Donderdag" }
  ];
  
  return {
    name: "Fase 3 - Uitbouwen",
    weeks: [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28],
    description: "Opbouwen naar 35-45 km/week met meer structuur",
    weeklyMinutes: "240-300'",
    workouts: buildWeeklyPlan(runWorkouts, strengthWorkouts, sessionsPerWeek, includeStrength)
  };
}

// ============================================
// FASE 4: Week 29-42 - MARATHON SPECIFIEK
// ============================================
function buildPhase4(sessionsPerWeek, includeStrength) {
  const runWorkouts = [
    { type: "Lange Duur", description: "2u45-3u15 - KEY! Eerste 2u Z2, laatste 30-45' marathon pace. Oefen race strategie!", day: "Zondag" },
    { type: "Z2 Duur", description: "60-75' Z2, tweede helft progressive (niet MP!).", day: "Zaterdag" },
    { type: "Marathon Pace", description: "60-75': 15' warm-up, 2-3×15-20' MP, 5' rust tussen, 10' cool-down", day: "Donderdag" },
    { type: "Tempo", description: "55': 10' warm-up, 3×10' tempo, 3' tussen, 10' cool-down", day: "Woensdag" },
    { type: "Z2 + Strides", description: "45-60' Z2 + 6-8×20\" strides. Scherp maar ontspannen.", day: "Vrijdag" },
    { type: "Easy Run", description: "30-40' herstelrun. Focus op techniek en ontspanning.", day: "Dinsdag" }
  ];
  
  const strengthWorkouts = [
    { type: "Kracht", description: "30' onderhoud - Lichte gewichten: 3×12 goblet squats, 3×10 RDL", day: "Maandag" },
    { type: "Kracht", description: "25' core - 3×45\" planks, 3×20 bicycle crunches, 3×15 leg raises", day: "Woensdag" }
  ];
  
  return {
    name: "Fase 4 - Marathon Specifiek",
    weeks: [29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42],
    description: "Marathon pace integreren, 45-60 km/week",
    weeklyMinutes: "280-340'",
    workouts: buildWeeklyPlan(runWorkouts, strengthWorkouts, sessionsPerWeek, includeStrength)
  };
}

// ============================================
// FASE 5: Week 43-45 - TAPER
// ============================================
function buildPhase5(sessionsPerWeek, includeStrength) {
  // During taper, limit sessions
  const taperSessions = Math.min(sessionsPerWeek, 4);
  
  const runWorkouts = [
    { type: "RACE DAY", description: "🏃‍♂️ LOCH NESS MARATHON! Eerste helft rustig, tweede helft op gevoel. GENIET!", day: "Zondag" },
    { type: "Easy Run", description: "30-40' ontspannen Z2. Veel lichter dan normaal. Energie opbouwen!", day: "Dinsdag" },
    { type: "Marathon Pace", description: "40': 10' warm-up, 3×5' MP (voelt licht!), 2' tussen, 10' cool-down", day: "Donderdag" },
    { type: "Shakeout", description: "20-30' zeer licht + 4-6×15\" strides. Laatste run voor marathon!", day: "Zaterdag" },
    { type: "Easy Run", description: "25' zeer licht joggen. Focus op loopgevoel.", day: "Woensdag" }
  ];
  
  const strengthWorkouts = [
    { type: "Kracht", description: "20' licht - 2×10 squats, 2×10 lunges, 2×30\" planks. GEEN zware gewichten!", day: "Maandag" }
  ];
  
  return {
    name: "Fase 5 - Taper",
    weeks: [43, 44, 45],
    description: "Volume afbouwen, frisheid behouden",
    weeklyMinutes: "Aflopend naar race",
    workouts: buildWeeklyPlan(runWorkouts, strengthWorkouts, taperSessions, includeStrength)
  };
}

// ============================================
// VALIDATION
// ============================================
function validatePlan(plan, sessionsPerWeek, includeStrength) {
  if (!plan.phases || plan.phases.length !== 5) {
    throw new Error('Invalid plan structure');
  }
  
  // Validate each phase
  plan.phases.forEach((phase, idx) => {
    if (!phase.workouts || phase.workouts.length === 0) {
      console.warn(`Phase ${idx} invalid, regenerating`);
      const builders = [buildPhase1, buildPhase2, buildPhase3, buildPhase4, buildPhase5];
      plan.phases[idx] = builders[idx](sessionsPerWeek, includeStrength);
    }
  });
  
  return plan;
}

// ============================================
// PERSONALIZED ADVICE
// ============================================
function getAdvice(userData) {
  const bmi = userData.weight && userData.height 
    ? (userData.weight / Math.pow(userData.height / 100, 2)) 
    : 0;
  
  let advice = [];
  
  if (bmi > 30) advice.push("Focus op gewichtsbeheersing via gezonde voeding");
  if (userData.age > 50) advice.push("Extra focus op herstel - neem rustdagen serieus");
  if (userData.experience === 'beginner') advice.push("Bouw rustig op - consistentie > snelheid");
  if (userData.injuries) advice.push("Let op blessurepreventie - warm goed op");
  if (userData.goal === 'time') advice.push(`Voor je ${userData.targetTime} doel: focus op tempo runs in fase 3-4`);
  if (userData.strengthTraining) advice.push("Krachttraining helpt bij blessurepreventie");
  
  if (advice.length === 0) {
    advice.push("Luister naar je lichaam en geniet van het proces");
  }
  
  return `Voor ${userData.name}: ${advice.join('. ')}.`;
}

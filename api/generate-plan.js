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

  console.log('Generate plan called');

  try {
    const { userData } = JSON.parse(event.body);
    console.log('User:', userData.name, 'Sessions/week:', userData.sessionsPerWeek, 'Strength:', userData.strengthTraining);
    
    const bmi = userData.weight && userData.height ? (userData.weight / Math.pow(userData.height / 100, 2)) : 0;
    const sessionsPerWeek = parseInt(userData.sessionsPerWeek) || 4;
    const includeStrength = userData.strengthTraining === true;
    
    const plan = {
      phases: [
        generatePhase1(sessionsPerWeek, includeStrength),
        generatePhase2(sessionsPerWeek, includeStrength),
        generatePhase3(sessionsPerWeek, includeStrength),
        generatePhase4(sessionsPerWeek, includeStrength),
        generatePhase5(sessionsPerWeek, includeStrength)
      ],
      personalizedAdvice: getPersonalizedAdvice(userData, bmi)
    };

    console.log('Plan generated successfully');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        plan, 
        generated: new Date().toISOString() 
      })
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};

// FASE 1: Terug in beweging (Week 1-4)
function generatePhase1(sessionsPerWeek, includeStrength) {
  const runWorkouts = [
    { type: "Run-Walk", description: "10×(1' joggen / 2' wandelen). Start met 5' wandelen als warm-up.", day: "Zaterdag" },
    { type: "Lange Duur", description: "45-50' run-walk in zone 2 (conversatietempo). Wissel 3' joggen / 1' wandelen.", day: "Zondag" },
    { type: "Easy Run", description: "30' rustig joggen in zone 2. Tempo waarbij je nog kan praten.", day: "Dinsdag" },
    { type: "Run-Walk", description: "8×(2' joggen / 2' wandelen). Constant comfortabel tempo.", day: "Donderdag" },
    { type: "Strides", description: "25' rustig + 4×15\" strides. Accelereer tot 85% max snelheid.", day: "Vrijdag" },
    { type: "Tempo", description: "35' waarvan 15' iets vlotter (conversatietempo+). Niet hard!", day: "Woensdag" }
  ];
  
  const strengthWorkouts = [
    { type: "Kracht", description: "30' - Core/stabiliteit: 3×12 squats, 3×10 lunges, 3×30\" plank, 3×15 glute bridges", day: "Maandag" },
    { type: "Kracht", description: "30' - Full body: 3×12 deadlifts, 3×10 step-ups, 3×15 rows, 3×20 bicycle crunches", day: "Woensdag" }
  ];
  
  return {
    name: "Fase 1 - Basis Opbouw",
    weeks: [1, 2, 3, 4],
    description: "Run-walk en basisconditie opbouwen",
    weeklyMinutes: "120-180'",
    workouts: buildWeeklyWorkouts(runWorkouts, strengthWorkouts, sessionsPerWeek, includeStrength)
  };
}

// FASE 2: Basis opbouwen (Week 5-12)
function generatePhase2(sessionsPerWeek, includeStrength) {
  const runWorkouts = [
    { type: "Easy Run", description: "45-60' easy run in zone 2. Tempo waarbij je nog kan praten.", day: "Zaterdag" },
    { type: "Lange Duur", description: "75-90' in zone 2. Start rustig, oefen voeding/drinken.", day: "Zondag" },
    { type: "Z2 Duur", description: "50' comfortabel Z2 tempo. Laatste 10' mag iets vlotter.", day: "Dinsdag" },
    { type: "Strides", description: "40' easy + 6×20\" strides op 85-90% max snelheid.", day: "Donderdag" },
    { type: "Tempo", description: "45' totaal: 10' warm-up, 20' tempo (comfortably hard), 15' cool-down", day: "Woensdag" },
    { type: "Easy Run", description: "35' herstelrun. Bewust langzaam, moet makkelijk aanvoelen.", day: "Vrijdag" }
  ];
  
  const strengthWorkouts = [
    { type: "Kracht", description: "35' - Power: 3×15 squats, 3×12 deadlifts, 3×10 box jumps, 3×45\" planks", day: "Maandag" },
    { type: "Kracht", description: "35' - Stabiliteit: 3×12 single-leg RDL, 3×10 Bulgarian splits, 3×20 mountain climbers", day: "Woensdag" }
  ];
  
  return {
    name: "Fase 2 - Volume Opbouwen",
    weeks: [5, 6, 7, 8, 9, 10, 11, 12],
    description: "Opbouwen naar 25-35 km/week",
    weeklyMinutes: "200-260'",
    workouts: buildWeeklyWorkouts(runWorkouts, strengthWorkouts, sessionsPerWeek, includeStrength)
  };
}

// FASE 3: Uitbouwen (Week 13-28)
function generatePhase3(sessionsPerWeek, includeStrength) {
  const runWorkouts = [
    { type: "Z2 Duur", description: "60-75' comfortabel Z2 tempo. Focus op constant ontspannen tempo.", day: "Zaterdag" },
    { type: "Lange Duur", description: "105-120' zone 2. Laatste 20-30' mag vlotter. Oefen race voeding vanaf 90'.", day: "Zondag" },
    { type: "Tempo Run", description: "50' totaal: 10' warm-up, 4×5' tempo run (~80-85% max HR), 2' tussen intervallen, 10' cool-down", day: "Woensdag" },
    { type: "Easy Run", description: "45-60' herstelrun. Bewust langzaam! Voor herstel, niet training.", day: "Dinsdag" },
    { type: "Strides", description: "50' Z2 + 8×20\" strides. Houd Z2 comfortabel, strides scherp.", day: "Vrijdag" },
    { type: "Progression", description: "60' start Z2, laatste 15-20' geleidelijk naar tempo pace", day: "Donderdag" }
  ];
  
  const strengthWorkouts = [
    { type: "Kracht", description: "35' - Heavy: 4×10 squats, 4×8 deadlifts, 3×10 lunges, 3×45\" plank, 3×20 hollow rocks", day: "Maandag" },
    { type: "Kracht", description: "35' - Core: 3×12 single-leg RDL, 3×60\" plank variations, 3×15 leg raises, 3×20 pallof press", day: "Donderdag" }
  ];
  
  return {
    name: "Fase 3 - Uitbouwen",
    weeks: [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28],
    description: "Opbouwen naar 35-45 km/week met meer structuur",
    weeklyMinutes: "240-300'",
    workouts: buildWeeklyWorkouts(runWorkouts, strengthWorkouts, sessionsPerWeek, includeStrength)
  };
}

// FASE 4: Marathon specifiek (Week 29-42)
function generatePhase4(sessionsPerWeek, includeStrength) {
  const runWorkouts = [
    { type: "Z2 Duur", description: "60-75' Z2, tweede helft mag progressive worden (start Z2, eindig vlotter maar niet MP)", day: "Zaterdag" },
    { type: "Lange Duur", description: "2u45-3u15 - Key workout! Eerste 2u in Z2, laatste 30-45' aan marathon pace. Oefen race strategie!", day: "Zondag" },
    { type: "Marathon Pace", description: "60-75' totaal: 15' warm-up, 2-3×15-20' aan MP met 5' rustig ertussen, 10' cool-down", day: "Donderdag" },
    { type: "Easy Run", description: "30-40' herstelrun. Bewust langzaam, focus op techniek en ontspanning.", day: "Dinsdag" },
    { type: "Z2 + Strides", description: "45-60' Z2 + 6-8×20\" strides. Z2 comfortabel, strides scherp maar ontspannen.", day: "Vrijdag" },
    { type: "Tempo", description: "55' totaal: 10' warm-up, 3×10' tempo run, 3' tussen, 10' cool-down", day: "Woensdag" }
  ];
  
  const strengthWorkouts = [
    { type: "Kracht", description: "30' onderhoud - Lichte gewichten, mobiliteit: 3×12 goblet squats, 3×10 RDL, 3×15 calf raises, stretching", day: "Maandag" },
    { type: "Kracht", description: "25' core - 3×45\" planks, 3×20 bicycle crunches, 3×15 leg raises, 2×30\" side planks", day: "Woensdag" }
  ];
  
  return {
    name: "Fase 4 - Marathon Specifiek",
    weeks: [29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42],
    description: "Marathon pace integreren, 45-60 km/week",
    weeklyMinutes: "280-340'",
    workouts: buildWeeklyWorkouts(runWorkouts, strengthWorkouts, sessionsPerWeek, includeStrength)
  };
}

// FASE 5: Taper (Week 43-45)
function generatePhase5(sessionsPerWeek, includeStrength) {
  const runWorkouts = [
    { type: "Shakeout", description: "20-30' zeer licht joggen + 4-6×15\" strides. Laatste run voor marathon! Super makkelijk.", day: "Zaterdag" },
    { type: "RACE DAY", description: "🏃‍♂️ LOCH NESS MARATHON! Eerste helft rustig (< MP), tweede helft op gevoel. Geniet!", day: "Zondag" },
    { type: "Easy Run", description: "30-40' ontspannen Z2. Veel lichter dan gewoonlijk. Je bouwt op energie!", day: "Dinsdag" },
    { type: "Marathon Pace", description: "40' totaal: 10' warm-up, 3×5' aan MP (voelt licht!), 2' tussen, 10' cool-down. Scherpte behouden.", day: "Donderdag" },
    { type: "Easy Run", description: "25' zeer licht joggen. Focus op ontspanning en loopgevoel.", day: "Woensdag" }
  ];
  
  const strengthWorkouts = [
    { type: "Kracht", description: "20' licht onderhoud - 2×10 squats, 2×10 lunges, 2×30\" planks, stretching. Geen zware gewichten!", day: "Maandag" }
  ];
  
  return {
    name: "Fase 5 - Taper",
    weeks: [43, 44, 45],
    description: "Volume afbouwen, frisheid behouden",
    weeklyMinutes: "Aflopend naar race",
    workouts: buildWeeklyWorkouts(runWorkouts, strengthWorkouts, Math.min(sessionsPerWeek, 5), includeStrength)
  };
}

// HELPER: Build weekly workouts based on sessions per week
function buildWeeklyWorkouts(runWorkouts, strengthWorkouts, sessionsPerWeek, includeStrength) {
  let workouts = [];
  
  // Always add required runs based on sessions
  const runsToAdd = Math.min(sessionsPerWeek, runWorkouts.length);
  workouts = runWorkouts.slice(0, runsToAdd);
  
  // Add strength training if requested (max 2x per week)
  if (includeStrength) {
    const strengthToAdd = Math.min(2, strengthWorkouts.length);
    const selectedStrength = strengthWorkouts.slice(0, strengthToAdd);
    workouts = [...workouts, ...selectedStrength];
  }
  
  // Add rest days to fill the week (but not every day)
  const totalWorkouts = workouts.length;
  const restDaysNeeded = Math.max(0, Math.min(2, 7 - totalWorkouts)); // Max 2 rest days
  
  for (let i = 0; i < restDaysNeeded; i++) {
    const availableDays = ['Maandag', 'Woensdag', 'Vrijdag', 'Donderdag'];
    const usedDays = workouts.map(w => w.day);
    const restDay = availableDays.find(d => !usedDays.includes(d));
    
    if (restDay) {
      workouts.push({ 
        type: "Rust", 
        description: "Volledige rustdag - essentieel voor herstel", 
        day: restDay 
      });
    }
  }
  
  // Sort by day order: Za, Zo, Ma, Di, Wo, Do, Vr
  const dayOrder = ['Zaterdag', 'Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag'];
  workouts.sort((a, b) => dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day));
  
  return workouts;
}

function getPersonalizedAdvice(userData, bmi) {
  let advice = [];
  
  if (bmi > 30) {
    advice.push("Met je BMI is gewichtsbeheersing belangrijk - combineer training met gezonde voeding");
  }
  
  if (userData.age > 50) {
    advice.push("Extra focus op herstel en mobiliteit - neem rustdagen serieus");
  }
  
  if (userData.experience === 'beginner') {
    advice.push("Bouw rustig op - consistentie is belangrijker dan snelheid");
  }
  
  if (userData.injuries) {
    advice.push("Let extra op blessure preventie - warm goed op en stretch na trainingen");
  }
  
  if (userData.trainingHistory && userData.trainingHistory.toLowerCase().includes('gestopt')) {
    advice.push("Na een rustperiode is extra voorzichtig opbouwen cruciaal");
  }
  
  if (userData.goal === 'time' && userData.targetTime) {
    advice.push(`Voor je ${userData.targetTime} doel: focus op tempo runs en marathon pace trainingen in fase 3-4`);
  }
  
  if (userData.strengthTraining) {
    advice.push("Krachttraining 2x per week helpt bij blessurepreventie en loopefficiëntie");
  } else {
    advice.push("Overweeg in de toekomst krachttraining toe te voegen voor betere resultaten");
  }
  
  if (advice.length === 0) {
    advice.push("Luister naar je lichaam, geniet van het proces en blijf consistent");
  }
  
  return `Voor ${userData.name}: ${advice.join('. ')}.`;
}

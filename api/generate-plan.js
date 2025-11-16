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

  console.log('Generate plan called with AI');

  try {
    const { userData } = JSON.parse(event.body);
    console.log('User:', userData.name, 'Sessions/week:', userData.sessionsPerWeek, 'Strength:', userData.strengthTraining);
    
    // Initialize Claude API
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });

    // Calculate BMI and other metrics
    const bmi = userData.weight && userData.height ? (userData.weight / Math.pow(userData.height / 100, 2)).toFixed(1) : 'unknown';
    const sessionsPerWeek = parseInt(userData.sessionsPerWeek) || 4;
    
    // Build comprehensive context for Claude
    const userContext = buildUserContext(userData, bmi, sessionsPerWeek);
    
    // Call Claude API to generate the plan
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      temperature: 0.7,
      messages: [{
        role: 'user',
        content: generatePrompt(userContext, sessionsPerWeek, userData.strengthTraining)
      }]
    });

    // Parse Claude's response
    const responseText = message.content[0].text;
    console.log('Claude response received, length:', responseText.length);
    
    // Extract JSON from response (Claude might wrap it in markdown)
    let planData;
    try {
      // Try to find JSON in the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        planData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Error parsing Claude response:', parseError);
      // Fallback to rule-based plan if AI fails
      planData = generateFallbackPlan(userData, sessionsPerWeek);
    }

    // Ensure plan has correct structure
    const validatedPlan = validateAndEnhancePlan(planData, userData, sessionsPerWeek);

    console.log('Plan generated successfully');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        plan: validatedPlan,
        generated: new Date().toISOString(),
        aiGenerated: true
      })
    };

  } catch (error) {
    console.error('Error:', error);
    
    // Fallback to rule-based plan on any error
    try {
      const { userData } = JSON.parse(event.body);
      const sessionsPerWeek = parseInt(userData.sessionsPerWeek) || 4;
      const fallbackPlan = generateFallbackPlan(userData, sessionsPerWeek);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          plan: fallbackPlan,
          generated: new Date().toISOString(),
          aiGenerated: false,
          note: 'Fallback plan generated due to API error'
        })
      };
    } catch (fallbackError) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: error.message })
      };
    }
  }
};

function buildUserContext(userData, bmi, sessionsPerWeek) {
  return `
Gebruiker: ${userData.name}
Leeftijd: ${userData.age || 'onbekend'}
Geslacht: ${userData.gender || 'onbekend'}
Gewicht: ${userData.weight || 'onbekend'} kg
Lengte: ${userData.height || 'onbekend'} cm
BMI: ${bmi}

Loopervaring: ${userData.experience || 'onbekend'}
Jaren gelopen: ${userData.runningYears || 'onbekend'}
Huidige km per week: ${userData.currentKmPerWeek || 0} km
Langste run ooit: ${userData.longestRun || 0} km
Eerdere marathons: ${userData.previousMarathons || 0}
Training geschiedenis: ${userData.trainingHistory || 'geen'}

Blessures: ${userData.injuries || 'geen'}
Medicatie: ${userData.medications || 'geen'}

Trainingsvoorkeuren:
- Sessies per week: ${sessionsPerWeek}
- Tijd per sessie: ${userData.timePerSession || 60} minuten
- Krachttraining: ${userData.strengthTraining ? 'JA' : 'NEE'}
- Slaapuren: ${userData.sleepHours || 7} uur

Doel: ${userData.goal === 'time' ? `Tijd: ${userData.targetTime}` : 'Finishen'}

Race: Loch Ness Marathon op 27 september 2026
Startdatum training: 15 november 2025 (45 weken)
  `.trim();
}

function generatePrompt(userContext, sessionsPerWeek, includeStrength) {
  return `Je bent een professionele marathon coach. Genereer een VOLLEDIG 45-weken trainingsschema voor de Loch Ness Marathon.

GEBRUIKER INFORMATIE:
${userContext}

KRITIEKE VEREISTEN:
1. Het schema moet EXACT ${sessionsPerWeek} RUN-trainingen per week bevatten
2. ${includeStrength ? 'Voeg 2 krachttrainingen per week toe (Maandag en Woensdag of Donderdag)' : 'GEEN krachttrainingen'}
3. Trainingen moeten verdeeld zijn over specifieke dagen: Zaterdag, Zondag, Maandag, Dinsdag, Woensdag, Donderdag, Vrijdag
4. Elke week moet precies ${sessionsPerWeek} trainingen hebben (+ eventueel kracht)
5. GEEN dubbele dagen, GEEN ontbrekende trainingen

SCHEMA STRUCTUUR (5 FASES):

FASE 1 (Week 1-4): "Basis Opbouw"
- Run-walk methode
- Volume: 120-180 minuten/week
- Focus: Terug in beweging komen

FASE 2 (Week 5-12): "Volume Opbouwen"  
- Meer continue lopen
- Volume: 200-260 minuten/week
- Focus: 25-35 km/week

FASE 3 (Week 13-28): "Uitbouwen"
- Tempo runs introduceren
- Volume: 240-300 minuten/week
- Focus: 35-45 km/week

FASE 4 (Week 29-42): "Marathon Specifiek"
- Marathon pace trainingen
- Volume: 280-340 minuten/week
- Lange runs tot 3+ uur

FASE 5 (Week 43-45): "Taper"
- Volume afbouwen
- Sharpness behouden
- Week 45 = RACE WEEK (zondag 27 sept = marathon)

TRAININGSTYPES PER SESSIEAANTAL:

Voor ${sessionsPerWeek} sessies per week, gebruik deze verdeling:

${sessionsPerWeek === 3 ? `
3 SESSIES (Zaterdag, Zondag, Dinsdag of Woensdag):
1. Lange Duur (Zondag) - Zone 2, bouwt op naar 3+ uur
2. Tempo/Quality (midweek) - Intervals, tempo, of strides
3. Easy Run (midweek of weekend) - Herstel
` : ''}

${sessionsPerWeek === 4 ? `
4 SESSIES (Zaterdag, Zondag, Dinsdag, Donderdag):
1. Lange Duur (Zondag) - Zone 2, bouwt op naar 3+ uur  
2. Mid-week Long (Zaterdag) - 60-90min Z2
3. Tempo/Quality (Dinsdag of Woensdag) - Intervals, tempo, strides
4. Easy Run (Donderdag) - Herstel
` : ''}

${sessionsPerWeek === 5 ? `
5 SESSIES (Zaterdag, Zondag, Dinsdag, Woensdag, Donderdag):
1. Lange Duur (Zondag) - Zone 2, bouwt op naar 3+ uur
2. Mid-week Long (Zaterdag) - 60-90min Z2  
3. Tempo Run (Woensdag) - Marathon pace werk
4. Easy Run (Dinsdag) - Herstel
5. Strides (Donderdag) - Snelheid onderhouden
` : ''}

${sessionsPerWeek === 6 ? `
6 SESSIES (Alle dagen behalve 1 rustdag):
1. Lange Duur (Zondag) - Zone 2, bouwt op naar 3+ uur
2. Mid-week Long (Zaterdag) - 60-90min Z2
3. Tempo Run (Woensdag) - Marathon pace  
4. Easy Run (Dinsdag) - Herstel
5. Easy Run (Vrijdag) - Herstel
6. Quality (Donderdag) - Intervals of strides
` : ''}

BELANGRIJK:
- Week 45, Zondag 27 september = "RACE DAY - 🏃‍♂️ LOCH NESS MARATHON!"
- Geef voor elke workout een Nederlandse beschrijving met duur en intensiteit
- Gebruik Nederlandse termen: joggen, wandelen, tempo, rustig, etc.
- Progressieve opbouw: start conservatief, bouw langzaam op
- Laatste 2 weken (44-45) = taper met verminderd volume

OUTPUT FORMAAT (JSON):
{
  "phases": [
    {
      "name": "Fase 1 - Basis Opbouw",
      "weeks": [1, 2, 3, 4],
      "description": "Run-walk en basisconditie opbouwen",
      "weeklyMinutes": "120-180'",
      "workouts": [
        {
          "type": "Run-Walk",
          "description": "10×(1' joggen / 2' wandelen). Start met 5' wandelen als warm-up.",
          "day": "Zaterdag"
        },
        {
          "type": "Lange Duur",
          "description": "45-50' run-walk in zone 2. Wissel 3' joggen / 1' wandelen.",
          "day": "Zondag"
        }
        // ... exact ${sessionsPerWeek} workouts
      ]
    }
    // ... 5 phases totaal
  ],
  "personalizedAdvice": "Voor [naam]: [specifiek advies gebaseerd op profiel]"
}

Genereer nu het COMPLETE 45-weken schema in JSON formaat. Wees specifiek, praktisch en motiverend!`;
}

function generateFallbackPlan(userData, sessionsPerWeek) {
  const includeStrength = userData.strengthTraining === true;
  
  return {
    phases: [
      generatePhase1(sessionsPerWeek, includeStrength),
      generatePhase2(sessionsPerWeek, includeStrength),
      generatePhase3(sessionsPerWeek, includeStrength),
      generatePhase4(sessionsPerWeek, includeStrength),
      generatePhase5(sessionsPerWeek, includeStrength)
    ],
    personalizedAdvice: getPersonalizedAdvice(userData)
  };
}

// DYNAMIC WORKOUT SELECTION based on sessions per week
function selectWorkouts(allWorkouts, sessionsPerWeek, priorityOrder) {
  // Priority order: which workouts are most important
  const sorted = [...allWorkouts].sort((a, b) => {
    const aPriority = priorityOrder.indexOf(a.type) !== -1 ? priorityOrder.indexOf(a.type) : 999;
    const bPriority = priorityOrder.indexOf(b.type) !== -1 ? priorityOrder.indexOf(b.type) : 999;
    return aPriority - bPriority;
  });
  
  return sorted.slice(0, sessionsPerWeek);
}

// FASE 1: Week 1-4
function generatePhase1(sessionsPerWeek, includeStrength) {
  const allRunWorkouts = [
    { type: "Lange Duur", description: "45-50' run-walk in zone 2 (conversatietempo). Wissel 3' joggen / 1' wandelen.", day: "Zondag", priority: 1 },
    { type: "Run-Walk", description: "10×(1' joggen / 2' wandelen). Start met 5' wandelen als warm-up.", day: "Zaterdag", priority: 2 },
    { type: "Easy Run", description: "30' rustig joggen in zone 2. Tempo waarbij je nog kan praten.", day: "Dinsdag", priority: 3 },
    { type: "Run-Walk", description: "8×(2' joggen / 2' wandelen). Constant comfortabel tempo.", day: "Donderdag", priority: 4 },
    { type: "Strides", description: "25' rustig + 4×15\" strides. Accelereer tot 85% max snelheid.", day: "Vrijdag", priority: 5 },
    { type: "Tempo", description: "35' waarvan 15' iets vlotter (conversatietempo+). Niet hard!", day: "Woensdag", priority: 6 }
  ];
  
  const priorityOrder = ["Lange Duur", "Run-Walk", "Easy Run", "Strides", "Tempo"];
  const selectedRuns = selectWorkouts(allRunWorkouts, sessionsPerWeek, priorityOrder);
  
  const strengthWorkouts = includeStrength ? [
    { type: "Kracht", description: "30' - Core/stabiliteit: 3×12 squats, 3×10 lunges, 3×30\" plank, 3×15 glute bridges", day: "Maandag" },
    { type: "Kracht", description: "30' - Full body: 3×12 deadlifts, 3×10 step-ups, 3×15 rows, 3×20 bicycle crunches", day: "Woensdag" }
  ] : [];
  
  return {
    name: "Fase 1 - Basis Opbouw",
    weeks: [1, 2, 3, 4],
    description: "Run-walk en basisconditie opbouwen",
    weeklyMinutes: "120-180'",
    workouts: assignDaysAndSort([...selectedRuns, ...strengthWorkouts], sessionsPerWeek)
  };
}

// FASE 2: Week 5-12
function generatePhase2(sessionsPerWeek, includeStrength) {
  const allRunWorkouts = [
    { type: "Lange Duur", description: "75-90' in zone 2. Start rustig, oefen voeding/drinken.", day: "Zondag", priority: 1 },
    { type: "Easy Run", description: "45-60' easy run in zone 2. Tempo waarbij je nog kan praten.", day: "Zaterdag", priority: 2 },
    { type: "Z2 Duur", description: "50' comfortabel Z2 tempo. Laatste 10' mag iets vlotter.", day: "Dinsdag", priority: 3 },
    { type: "Tempo", description: "45' totaal: 10' warm-up, 20' tempo (comfortably hard), 15' cool-down", day: "Woensdag", priority: 4 },
    { type: "Strides", description: "40' easy + 6×20\" strides op 85-90% max snelheid.", day: "Donderdag", priority: 5 },
    { type: "Easy Run", description: "35' herstelrun. Bewust langzaam, moet makkelijk aanvoelen.", day: "Vrijdag", priority: 6 }
  ];
  
  const priorityOrder = ["Lange Duur", "Easy Run", "Z2 Duur", "Tempo", "Strides"];
  const selectedRuns = selectWorkouts(allRunWorkouts, sessionsPerWeek, priorityOrder);
  
  const strengthWorkouts = includeStrength ? [
    { type: "Kracht", description: "35' - Power: 3×15 squats, 3×12 deadlifts, 3×10 box jumps, 3×45\" planks", day: "Maandag" },
    { type: "Kracht", description: "35' - Stabiliteit: 3×12 single-leg RDL, 3×10 Bulgarian splits, 3×20 mountain climbers", day: "Woensdag" }
  ] : [];
  
  return {
    name: "Fase 2 - Volume Opbouwen",
    weeks: [5, 6, 7, 8, 9, 10, 11, 12],
    description: "Opbouwen naar 25-35 km/week",
    weeklyMinutes: "200-260'",
    workouts: assignDaysAndSort([...selectedRuns, ...strengthWorkouts], sessionsPerWeek)
  };
}

// FASE 3: Week 13-28
function generatePhase3(sessionsPerWeek, includeStrength) {
  const allRunWorkouts = [
    { type: "Lange Duur", description: "105-120' zone 2. Laatste 20-30' mag vlotter. Oefen race voeding vanaf 90'.", day: "Zondag", priority: 1 },
    { type: "Z2 Duur", description: "60-75' comfortabel Z2 tempo. Focus op constant ontspannen tempo.", day: "Zaterdag", priority: 2 },
    { type: "Tempo Run", description: "50' totaal: 10' warm-up, 4×5' tempo run (~80-85% max HR), 2' tussen intervallen, 10' cool-down", day: "Woensdag", priority: 3 },
    { type: "Easy Run", description: "45-60' herstelrun. Bewust langzaam! Voor herstel, niet training.", day: "Dinsdag", priority: 4 },
    { type: "Progression", description: "60' start Z2, laatste 15-20' geleidelijk naar tempo pace", day: "Donderdag", priority: 5 },
    { type: "Strides", description: "50' Z2 + 8×20\" strides. Houd Z2 comfortabel, strides scherp.", day: "Vrijdag", priority: 6 }
  ];
  
  const priorityOrder = ["Lange Duur", "Z2 Duur", "Tempo Run", "Easy Run", "Progression", "Strides"];
  const selectedRuns = selectWorkouts(allRunWorkouts, sessionsPerWeek, priorityOrder);
  
  const strengthWorkouts = includeStrength ? [
    { type: "Kracht", description: "35' - Heavy: 4×10 squats, 4×8 deadlifts, 3×10 lunges, 3×45\" plank, 3×20 hollow rocks", day: "Maandag" },
    { type: "Kracht", description: "35' - Core: 3×12 single-leg RDL, 3×60\" plank variations, 3×15 leg raises, 3×20 pallof press", day: "Donderdag" }
  ] : [];
  
  return {
    name: "Fase 3 - Uitbouwen",
    weeks: [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28],
    description: "Opbouwen naar 35-45 km/week met meer structuur",
    weeklyMinutes: "240-300'",
    workouts: assignDaysAndSort([...selectedRuns, ...strengthWorkouts], sessionsPerWeek)
  };
}

// FASE 4: Week 29-42
function generatePhase4(sessionsPerWeek, includeStrength) {
  const allRunWorkouts = [
    { type: "Lange Duur", description: "2u45-3u15 - Key workout! Eerste 2u in Z2, laatste 30-45' aan marathon pace. Oefen race strategie!", day: "Zondag", priority: 1 },
    { type: "Z2 Duur", description: "60-75' Z2, tweede helft mag progressive worden (start Z2, eindig vlotter maar niet MP)", day: "Zaterdag", priority: 2 },
    { type: "Marathon Pace", description: "60-75' totaal: 15' warm-up, 2-3×15-20' aan MP met 5' rustig ertussen, 10' cool-down", day: "Donderdag", priority: 3 },
    { type: "Tempo", description: "55' totaal: 10' warm-up, 3×10' tempo run, 3' tussen, 10' cool-down", day: "Woensdag", priority: 4 },
    { type: "Z2 + Strides", description: "45-60' Z2 + 6-8×20\" strides. Z2 comfortabel, strides scherp maar ontspannen.", day: "Vrijdag", priority: 5 },
    { type: "Easy Run", description: "30-40' herstelrun. Bewust langzaam, focus op techniek en ontspanning.", day: "Dinsdag", priority: 6 }
  ];
  
  const priorityOrder = ["Lange Duur", "Z2 Duur", "Marathon Pace", "Tempo", "Z2 + Strides", "Easy Run"];
  const selectedRuns = selectWorkouts(allRunWorkouts, sessionsPerWeek, priorityOrder);
  
  const strengthWorkouts = includeStrength ? [
    { type: "Kracht", description: "30' onderhoud - Lichte gewichten, mobiliteit: 3×12 goblet squats, 3×10 RDL, 3×15 calf raises, stretching", day: "Maandag" },
    { type: "Kracht", description: "25' core - 3×45\" planks, 3×20 bicycle crunches, 3×15 leg raises, 2×30\" side planks", day: "Woensdag" }
  ] : [];
  
  return {
    name: "Fase 4 - Marathon Specifiek",
    weeks: [29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42],
    description: "Marathon pace integreren, 45-60 km/week",
    weeklyMinutes: "280-340'",
    workouts: assignDaysAndSort([...selectedRuns, ...strengthWorkouts], sessionsPerWeek)
  };
}

// FASE 5: Week 43-45 (TAPER)
function generatePhase5(sessionsPerWeek, includeStrength) {
  const allRunWorkouts = [
    { type: "RACE DAY", description: "🏃‍♂️ LOCH NESS MARATHON! Eerste helft rustig (< MP), tweede helft op gevoel. Geniet!", day: "Zondag", priority: 1 },
    { type: "Easy Run", description: "30-40' ontspannen Z2. Veel lichter dan gewoonlijk. Je bouwt op energie!", day: "Dinsdag", priority: 2 },
    { type: "Marathon Pace", description: "40' totaal: 10' warm-up, 3×5' aan MP (voelt licht!), 2' tussen, 10' cool-down. Scherpte behouden.", day: "Donderdag", priority: 3 },
    { type: "Shakeout", description: "20-30' zeer licht joggen + 4-6×15\" strides. Laatste run voor marathon! Super makkelijk.", day: "Zaterdag", priority: 4 },
    { type: "Easy Run", description: "25' zeer licht joggen. Focus op ontspanning en loopgevoel.", day: "Woensdag", priority: 5 }
  ];
  
  // During taper, limit to max 5 sessions
  const taperSessions = Math.min(sessionsPerWeek, 5);
  const priorityOrder = ["RACE DAY", "Easy Run", "Marathon Pace", "Shakeout"];
  const selectedRuns = selectWorkouts(allRunWorkouts, taperSessions, priorityOrder);
  
  const strengthWorkouts = includeStrength ? [
    { type: "Kracht", description: "20' licht onderhoud - 2×10 squats, 2×10 lunges, 2×30\" planks, stretching. Geen zware gewichten!", day: "Maandag" }
  ] : [];
  
  return {
    name: "Fase 5 - Taper",
    weeks: [43, 44, 45],
    description: "Volume afbouwen, frisheid behouden",
    weeklyMinutes: "Aflopend naar race",
    workouts: assignDaysAndSort([...selectedRuns, ...strengthWorkouts], taperSessions)
  };
}

// HELPER: Assign days intelligently and sort
function assignDaysAndSort(workouts, sessionsPerWeek) {
  const dayOrder = ['Zaterdag', 'Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag'];
  const availableDays = [...dayOrder];
  const usedDays = new Set();
  
  // First pass: keep workouts that already have good days
  workouts.forEach(w => {
    if (w.day && availableDays.includes(w.day) && !usedDays.has(w.day)) {
      usedDays.add(w.day);
    }
  });
  
  // Second pass: assign days to workouts without days or conflicts
  workouts.forEach(w => {
    if (!w.day || usedDays.has(w.day)) {
      // Find next available day
      const nextDay = availableDays.find(d => !usedDays.has(d));
      if (nextDay) {
        w.day = nextDay;
        usedDays.add(nextDay);
      }
    }
  });
  
  // Add rest days if needed (max 2)
  const totalWorkouts = workouts.length;
  if (totalWorkouts < 7 && totalWorkouts < sessionsPerWeek + 2) {
    const restDaysNeeded = Math.min(2, 7 - totalWorkouts);
    for (let i = 0; i < restDaysNeeded; i++) {
      const restDay = availableDays.find(d => !usedDays.has(d));
      if (restDay) {
        workouts.push({ 
          type: "Rust", 
          description: "Volledige rustdag - essentieel voor herstel", 
          day: restDay 
        });
        usedDays.add(restDay);
      }
    }
  }
  
  // Sort by day order
  workouts.sort((a, b) => dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day));
  
  return workouts;
}

function getPersonalizedAdvice(userData) {
  const bmi = userData.weight && userData.height ? (userData.weight / Math.pow(userData.height / 100, 2)) : 0;
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

function validateAndEnhancePlan(planData, userData, sessionsPerWeek) {
  // Ensure all phases exist
  if (!planData.phases || planData.phases.length !== 5) {
    console.warn('Invalid plan structure, using fallback');
    return generateFallbackPlan(userData, sessionsPerWeek);
  }
  
  // Validate each phase has correct number of workouts
  planData.phases.forEach((phase, idx) => {
    if (!phase.workouts || phase.workouts.length === 0) {
      console.warn(`Phase ${idx + 1} has no workouts, regenerating`);
      // Regenerate this phase
      const phaseFunctions = [generatePhase1, generatePhase2, generatePhase3, generatePhase4, generatePhase5];
      const regenerated = phaseFunctions[idx](sessionsPerWeek, userData.strengthTraining);
      planData.phases[idx] = regenerated;
    }
  });
  
  // Ensure personalized advice exists
  if (!planData.personalizedAdvice) {
    planData.personalizedAdvice = getPersonalizedAdvice(userData);
  }
  
  return planData;
}

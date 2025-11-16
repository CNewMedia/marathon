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
    console.log('User:', userData.name, userData.age, userData.experience);
    
    const bmi = userData.weight && userData.height ? (userData.weight / Math.pow(userData.height / 100, 2)) : 0;
    
    const plan = {
      phases: [
        {
          name: "Fase 1 - Terug in beweging",
          weeks: [1, 2, 3, 4],
          description: "Run-walk, trap lopen zonder buiten adem, pezen laten wennen",
          weeklyMinutes: "150-180'",
          workouts: [
            { type: "Run-Walk", description: "10×(1' joggen / 2' wandelen). Start met 5' wandelen als warm-up, eindig met 5' wandelen als cool-down.", day: "Maandag" },
            { type: "Kracht", description: "30-40' - Heup/bil: 3×12 squats, 3×10 lunges per been, 3×15 glute bridges. Kuit: 3×15 calf raises. Core: 3×30\" plank, 3×15 dead bugs", day: "Dinsdag" },
            { type: "Alternatief", description: "35' stevig wandelen (geen lopen) of 30' fietsen op lage intensiteit. Dit is actief herstel.", day: "Woensdag" },
            { type: "Rust", description: "Volledige rustdag - essentieel voor herstel en aanpassing", day: "Donderdag" },
            { type: "Run-Walk", description: "8×(2' joggen / 2' wandelen). Probeer een constant, comfortabel tempo te houden tijdens de loopfases.", day: "Vrijdag" },
            { type: "Kracht", description: "30-40' - Focus op stabiliteit: 3×12 single-leg deadlifts, 3×10 step-ups per been, 3×12 bird dogs, 3×20 bicycle crunches, 2×30\" side plank per kant", day: "Zaterdag" },
            { type: "Lange Duur", description: "45-50' run-walk in zone 2 (conversatietempo). Wissel 3' joggen / 1' wandelen. Dit is je langste training van de week.", day: "Zondag" }
          ]
        },
        {
          name: "Fase 2 - Basis opbouwen",
          weeks: [5, 6, 7, 8, 9, 10, 11, 12],
          description: "Opbouwen naar 25-35 km/week",
          weeklyMinutes: "200-240'",
          workouts: [
            { type: "Z2 Duur", description: "45-60' easy run in zone 2. Tempo waarbij je nog kan praten. Bouw dit geleidelijk op van 45' in week 5 naar 60' in week 12.", day: "Maandag" },
            { type: "Kracht", description: "35-40' - Full body: 3×15 squats, 3×12 deadlifts (met gewicht indien mogelijk), 3×10 Bulgarian split squats, 3×12 push-ups, 3×15 rows, 3×45\" plank holds", day: "Dinsdag" },
            { type: "Strides", description: "40' easy + 6-8×15-20\" strides. Na 30' rustig lopen doe je 6-8 acceleraties van 15-20 seconden op 85-90% max snelheid. Loop 1-2' rustig tussen de strides.", day: "Woensdag" },
            { type: "Rust", description: "Volledige rustdag of zeer lichte activiteit (wandelen, yoga, stretching)", day: "Donderdag" },
            { type: "Z2 Duur", description: "50-70' comfortabel tempo in zone 2. Laatste 10' mag iets vlotter (maar niet hard!). Luister naar je lichaam.", day: "Vrijdag" },
            { type: "Kracht", description: "35-40' - Explosiviteit: 3×10 box jumps (of step-ups), 3×12 jump squats (of normale squats), 3×10 burpees, 3×30\" mountain climbers, 3×15 Russian twists", day: "Zaterdag" },
            { type: "Lange Duur", description: "75-90' in zone 2. Dit is je belangrijkste training! Start rustig, laatste derde mag iets vlotter aanvoelen maar blijf in Z2. Oefen voeding/drinken.", day: "Zondag" }
          ]
        },
        {
          name: "Fase 3 - Uitbouwen",
          weeks: [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28],
          description: "Opbouwen naar 35-45 km/week met meer structuur",
          weeklyMinutes: "240-280'",
          workouts: [
            { type: "Z2 Duur", description: "60-75' comfortabel Z2 tempo. Focus op een constant, ontspannen tempo waarbij je nog kan converseren.", day: "Maandag" },
            { type: "Kracht", description: "35-40' - Heavy: 4×10 squats, 4×8 deadlifts, 3×10 lunges, 3×12 step-ups, 3×45\" plank, 3×20 hollow rocks. Gebruik gewichten voor progressie.", day: "Dinsdag" },
            { type: "Tempo", description: "50' totaal: 10' warm-up, 4-6×5' aan tempo run (comfortably hard - ~80-85% max HR), 2' rustig tussen intervallen, 10' cool-down", day: "Woensdag" },
            { type: "Rust", description: "Volledige rust - je lichaam heeft dit nodig voor aanpassingen!", day: "Donderdag" },
            { type: "Z2 Easy", description: "45-60' herstelrun. Bewust langzaam! Dit is voor herstel, niet voor training. Moet makkelijk aanvoelen.", day: "Vrijdag" },
            { type: "Kracht", description: "35-40' - Stabiliteit & core: 3×12 single-leg RDL, 3×10 pistol squats (evt assisted), 3×60\" plank variations, 3×15 leg raises, 3×20 pallof press", day: "Zaterdag" },
            { type: "Lange Duur", description: "105-120' (geleidelijk opbouwend). Zone 2, laatste 20-30' mag vlotter (maar niet marathon pace!). Oefen race voeding vanaf 90'.", day: "Zondag" }
          ]
        },
        {
          name: "Fase 4 - Marathon specifiek",
          weeks: [29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42],
          description: "Marathon pace integreren, 45-60 km/week",
          weeklyMinutes: "280-320'",
          workouts: [
            { type: "Kracht", description: "30' onderhoud - Lichtere gewichten, meer focus op mobiliteit: 3×12 goblet squats, 3×10 RDL, 3×15 calf raises, 2×45\" planks, stretching", day: "Maandag" },
            { type: "Z2 + Strides", description: "45-60' Z2 + 6-8×20\" strides. Houd het Z2 gedeelte comfortabel, strides scherp maar ontspannen.", day: "Dinsdag" },
            { type: "Easy", description: "30-40' herstelrun. Bewust langzaam, focus op techniek en ontspanning. Deze run moet je energie geven, niet kosten.", day: "Woensdag" },
            { type: "Marathon Pace", description: "60-75' totaal: 15' warm-up Z2, 2-3×15-20' aan marathon pace (MP) met 5' rustig tussen blokken, 10' cool-down. MP = race tempo!", day: "Donderdag" },
            { type: "Rust", description: "Volledige rustdag voor de lange duur", day: "Vrijdag" },
            { type: "Z2 Duur", description: "60-75' Z2, tweede helft mag progressive worden (start Z2, eindig iets vlotter maar niet MP)", day: "Zaterdag" },
            { type: "Lange Duur", description: "2u45-3u15 - Dit is je key workout! Eerste 2u in Z2, laatste 30-45' kan aan marathon pace. Oefen race strategie, voeding (60g CHO/uur), hydratatie.", day: "Zondag" }
          ]
        },
        {
          name: "Fase 5 - Taper",
          weeks: [43, 44, 45],
          description: "Volume afbouwen, frisheid behouden",
          weeklyMinutes: "Aflopend naar race",
          workouts: [
            { type: "Kracht", description: "20' licht onderhoud - 2×10 squats, 2×10 lunges, 2×30\" planks, stretching. Geen zware gewichten meer!", day: "Maandag" },
            { type: "Easy", description: "30-40' ontspannen Z2. Veel lichter dan gewoonlijk. Je bouwt nu op energie, niet af!", day: "Dinsdag" },
            { type: "Rust", description: "Volledige rust, focus op slaap en voeding", day: "Woensdag" },
            { type: "Marathon Pace", description: "40' totaal: 10' warm-up, 3×5' aan MP (voelt licht!), 2' tussen blokken, 10' cool-down. Dit is om scherpte te behouden.", day: "Donderdag" },
            { type: "Rust", description: "Rust, hydratatie, koolhydraten laden starten", day: "Vrijdag" },
            { type: "Shakeout", description: "20-30' zeer licht joggen + 4-6×15\" strides. Laatste run voor de marathon! Moet super makkelijk voelen.", day: "Zaterdag" },
            { type: "RACE DAY", description: "🏃‍♂️ LOCH NESS MARATHON! Eerste helft rustig (< MP), tweede helft op gevoel. Geniet ervan! Je bent klaar!", day: "Zondag" }
          ]
        }
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
  
  if (advice.length === 0) {
    advice.push("Luister naar je lichaam, geniet van het proces en blijf consistent");
  }
  
  return `Voor ${userData.name}: ${advice.join('. ')}.`;
}

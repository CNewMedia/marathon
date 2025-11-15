# 🚀 QUICK START - Upload naar GitHub

## Je hebt nu een complete marathon trainer app! Hier is hoe je het naar GitHub krijgt:

### STAP 1: Download het project
Het complete project staat klaar in de `marathon-trainer` folder.

### STAP 2: Upload naar GitHub

#### Optie A: Via GitHub Website (Makkelijkst)

1. **Ga naar GitHub.com**
   - Log in op je account
   - Ga naar https://github.com/CNewMedia/marathon

2. **Upload Files**
   - Klik op "Add file" → "Upload files"
   - Sleep ALLE bestanden uit de `marathon-trainer` folder
   - Of klik "choose your files" en selecteer alles

3. **Commit**
   - Scroll naar beneden
   - Vul in: "Initial commit - Complete marathon trainer"
   - Klik "Commit changes"

#### Optie B: Via Git Command Line (Voor developers)

```bash
# Download de marathon-trainer folder naar je computer
# Open terminal/command prompt in die folder

# Initialize git
git init

# Add GitHub remote
git remote add origin https://github.com/CNewMedia/marathon.git

# Add alle files
git add .

# Commit
git commit -m "Initial commit - Complete marathon trainer application"

# Push naar GitHub
git branch -M main
git push -u origin main
```

### STAP 3: Volg de Deployment Guide

Na uploaden:
1. Open `DEPLOYMENT.md` in je GitHub repo
2. Volg de stappen voor Supabase setup
3. Volg de stappen voor Netlify deployment
4. In 30 minuten heb je een live app! 🎉

---

## 📁 Wat zit er in het project?

```
marathon-trainer/
├── 📄 README.md              ← Overzicht van de app
├── 📄 DEPLOYMENT.md          ← Stap-voor-stap deployment guide
├── 📄 setup.sh               ← Quick setup script
├── 📄 package.json           ← Dependencies
├── 📄 netlify.toml          ← Netlify configuratie
├── 📄 .env.example          ← Environment variables template
├── 📄 .gitignore            ← Git ignore rules
│
├── 📁 public/                ← Frontend (HTML/JS/CSS)
│   ├── index.html           ← Main app page
│   ├── config.js            ← Configuration
│   ├── app.js               ← Application logic
│   └── styles.css           ← Styling
│
├── 📁 api/                   ← Serverless functions
│   └── generate-plan.js     ← Claude AI integration
│
├── 📁 database/              ← Database schemas
│   └── schema.sql           ← Supabase tables
│
└── 📁 src/                   ← (Future: React components)
```

---

## ⚡ Features die je krijgt

### Voor Gebruikers:
- ✅ AI-gegenereerd gepersonaliseerd trainingsschema (45 weken)
- ✅ Onboarding flow met 5 stappen
- ✅ Progress tracking met afvinken van trainingen
- ✅ Real-time synchronisatie tussen apparaten
- ✅ Responsive design (desktop/tablet/mobile)
- ✅ Medische overwegingen (statines, aspirine, blessures)
- ✅ Flexibele training frequentie (3-6x per week)
- ✅ Automatische 10%-regel controle
- ✅ Deload weken planning

### Technisch:
- ✅ Multi-user support met Supabase authenticatie
- ✅ PostgreSQL database met Row Level Security
- ✅ Claude 4 Sonnet API integratie
- ✅ Serverless architecture (Netlify Functions)
- ✅ Zero-config deployment
- ✅ Environment variable management
- ✅ Cost-effective (~€1-3/maand)

---

## 🎯 Wat kun je hiermee?

### Nu Direct:
1. **Deploy de app** → Volg DEPLOYMENT.md
2. **Test met vrienden** → Deel je Netlify URL
3. **Verzamel feedback** → Verbeter het schema

### Later Toevoegen:
- 📊 Export naar PDF
- 📅 Google Calendar sync
- ⌚ Garmin/Strava integratie
- 📧 Email notificaties
- 📱 Mobile app (PWA)
- 👥 Social features (trainingsgroepen)
- 📈 Advanced analytics
- 🏃 Race day countdown
- 💬 AI training coach chat

---

## 💡 Hoe het werkt

### 1. Gebruiker Flow:
```
Welkom → Onboarding (5 stappen) → AI Generatie → Dashboard → Training!
```

### 2. Tech Flow:
```
Frontend (Vanilla JS)
    ↓
Netlify Function (generate-plan.js)
    ↓
Claude API (schema generatie)
    ↓
Supabase PostgreSQL (opslag)
    ↓
Real-time sync naar gebruiker
```

### 3. Data Flow:
```
User Input → Prompt Building → Claude Processing → JSON Schema → Database → UI Update
```

---

## 🔧 Belangrijke Files Uitgelegd

### `database/schema.sql`
- Maakt 4 tabellen aan in Supabase:
  - `user_profiles` - Gebruikersgegevens
  - `training_plans` - Gegenereerde schema's (JSONB)
  - `workout_progress` - Voltooide trainingen
  - `weekly_reflections` - Wekelijkse evaluaties
- Row Level Security policies
- Hulpfuncties voor statistieken

### `api/generate-plan.js`
- Netlify serverless function
- Roept Claude API aan
- Bouwt een uitgebreide prompt met alle gebruikersdata
- Vraagt Claude om een volledig 45-weken JSON schema
- Error handling & CORS support

### `public/app.js`
- Frontend applicatie logic
- Supabase authenticatie
- Onboarding flow management
- API calls naar generate-plan
- Progress tracking
- UI updates

### `netlify.toml`
- Netlify configuratie
- Publish folder: `public`
- Functions folder: `api`
- Redirects en headers
- Environment variable injection

---

## 💰 Kosten Breakdown

| Onderdeel | Gratis Tier | Verwacht Gebruik | Kosten |
|-----------|-------------|------------------|--------|
| **GitHub** | Unlimited | 1 repo, <100MB | €0 |
| **Supabase** | 500MB DB, 2GB/maand | ~50MB, 1GB | €0 |
| **Netlify** | 100GB bandwidth, 125k functions | 5GB, 1k calls | €0 |
| **Claude API** | Pay-per-token | ~50 schemas/maand @ 8k tokens | €1-2 |
| **Domain** (optioneel) | - | .nl domain | €10/jaar |
| **TOTAAL** | | **Per maand** | **€1-2** |

Met 100 actieve gebruikers: ~€5-10/maand
Met 1000 gebruikers: Upgrade naar betaalde tiers nodig

---

## ✅ Checklist Voor Live Gaan

- [ ] Repository op GitHub geüpload
- [ ] Supabase project aangemaakt
- [ ] Database schema uitgevoerd (`schema.sql`)
- [ ] Anthropic API key verkregen (+ €5 credit)
- [ ] Netlify account aangemaakt
- [ ] Site gedeployed op Netlify
- [ ] Environment variables ingesteld
- [ ] Test account aangemaakt
- [ ] Schema gegenereerd en getest
- [ ] Trainingen kunnen afvinken
- [ ] Alles werkt! 🎉

---

## 🆘 Hulp Nodig?

### Deployment Problemen?
→ Lees `DEPLOYMENT.md` zorgvuldig door
→ Check Netlify deploy logs
→ Verify environment variables

### Database Errors?
→ Kijk in Supabase Table Editor
→ Check of schema.sql succesvol was
→ Test RLS policies

### API Niet Werkend?
→ Verify Anthropic API key en credit
→ Check Netlify Functions logs
→ Test met browser developer tools (F12)

### Andere Vragen?
→ Open een Issue op GitHub
→ Check de comments in de code
→ Lees de inline documentation

---

## 🎉 Je bent klaar om te beginnen!

**Next Steps:**
1. Upload alles naar GitHub
2. Open DEPLOYMENT.md
3. Volg de stappen
4. In 30 minuten heb je een werkende app!

**Tips:**
- Test eerst lokaal met `netlify dev`
- Begin klein, voeg features toe stap voor stap
- Verzamel feedback van echte gebruikers
- Houd Supabase en Claude usage in de gaten

---

**Veel succes met je marathon app! 🏃‍♂️🎯**

Made with ❤️ for runners everywhere

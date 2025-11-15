# 🚀 Deployment Guide - Loch Ness Marathon Trainer

Volledige stap-voor-stap handleiding om de app live te krijgen op GitHub + Netlify.

## 📋 Wat je nodig hebt

- [ ] GitHub account
- [ ] Supabase account (gratis)
- [ ] Netlify account (gratis)
- [ ] Anthropic API key (Claude)
- [ ] 30 minuten tijd

---

## STAP 1: Supabase Setup (5 minuten)

### 1.1 Project Aanmaken

1. Ga naar [supabase.com](https://supabase.com)
2. Klik "Start your project"
3. Sign in met GitHub
4. Klik "New project"

### 1.2 Project Configureren

```
Organization: Maak nieuwe of kies bestaande
Project name: marathon-trainer
Database Password: [Genereer een sterk wachtwoord - BEWAAR DIT!]
Region: West EU (Ireland)
Pricing Plan: Free
```

5. Klik "Create new project" (duurt ~2 minuten)

### 1.3 Database Schema Installeren

1. In je Supabase dashboard, klik op **SQL Editor** (links in menu)
2. Klik "New query"
3. Open het bestand `database/schema.sql` van deze repo
4. Kopieer ALLE inhoud
5. Plak in de SQL Editor
6. Klik "Run" (rechtsonder)
7. Je zou moeten zien: "Success. No rows returned"

### 1.4 API Keys Ophalen

1. Ga naar **Project Settings** (tandwiel icoon linksonder)
2. Klik **API** in het menu
3. Kopieer deze twee waarden (bewaar ze veilig):
   - **Project URL**: `https://xxxx.supabase.co`
   - **anon public key**: `eyJhbGciOi....` (lange string)

✅ **Checkpoint**: Je hebt nu een werkende Supabase database met 4 tabellen!

---

## STAP 2: Anthropic API Key (3 minuten)

### 2.1 Account Aanmaken

1. Ga naar [console.anthropic.com](https://console.anthropic.com)
2. Sign up / Sign in
3. Ga naar **Settings** → **API Keys**

### 2.2 API Key Genereren

1. Klik "Create Key"
2. Naam: `marathon-trainer-production`
3. Kopieer de key (begint met `sk-ant-...`)
4. ⚠️ **BEWAAR DIT VEILIG** - je kunt het maar 1x zien!

### 2.3 Credit Toevoegen

1. Ga naar **Settings** → **Billing**
2. Klik "Add credit"
3. Voeg minimaal **$5** toe (is ruim genoeg voor maanden gebruik)

✅ **Checkpoint**: Je hebt een werkende Claude API key met credit!

---

## STAP 3: GitHub Repository Setup (5 minuten)

### 3.1 Fork/Clone deze Repository

Optie A - **Nieuwe repo maken**:
```bash
# In je terminal
cd /path/to/your/projects
git clone https://github.com/CNewMedia/marathon.git
cd marathon

# Verwijder oude git history
rm -rf .git

# Initialize nieuwe repo
git init
git add .
git commit -m "Initial commit"
```

Optie B - **Direct pushen naar jouw GitHub**:
```bash
# Create repo op GitHub.com eerst (zonder README)
# Dan:
git remote add origin https://github.com/JouwUsername/marathon.git
git branch -M main
git push -u origin main
```

### 3.2 Controleer Repository Structuur

```
marathon/
├── public/
│   ├── index.html
│   ├── config.js
│   ├── app.js
│   └── styles.css
├── api/
│   └── generate-plan.js
├── database/
│   └── schema.sql
├── .env.example
├── .gitignore
├── package.json
├── netlify.toml
└── README.md
```

✅ **Checkpoint**: Repository staat op GitHub!

---

## STAP 4: Netlify Deployment (10 minuten)

### 4.1 Netlify Inloggen

1. Ga naar [netlify.com](https://netlify.com)
2. Klik "Sign up" → **Continue with GitHub**
3. Authorize Netlify

### 4.2 Site Aanmaken

1. Click "Add new site" → "Import an existing project"
2. Kies **GitHub**
3. Authorize Netlify (als gevraagd)
4. Selecteer je `marathon` repository
5. **Build settings**:
   ```
   Branch to deploy: main
   Build command: (leeg laten)
   Publish directory: public
   Functions directory: api
   ```
6. Klik "Deploy site"

### 4.3 Environment Variables Instellen

1. Wacht tot eerste deploy klaar is
2. Ga naar **Site settings** → **Environment variables**
3. Klik "Add a variable"

Voeg deze 3 variables toe:

```
Variable 1:
Key: VITE_SUPABASE_URL
Value: [Plak je Supabase Project URL]

Variable 2:
Key: VITE_SUPABASE_ANON_KEY
Value: [Plak je Supabase anon key]

Variable 3:
Key: ANTHROPIC_API_KEY
Value: [Plak je Anthropic API key]
```

### 4.4 Redeploy Triggeren

1. Ga naar **Deploys**
2. Klik "Trigger deploy" → "Clear cache and deploy site"
3. Wacht ~1-2 minuten

### 4.5 Custom Domain (Optioneel)

1. Ga naar **Domain settings**
2. Klik "Add custom domain"
3. Of gebruik de gratis Netlify subdomain: `your-site-name.netlify.app`

✅ **Checkpoint**: Je app is LIVE! 🎉

---

## STAP 5: Testen (5 minuten)

### 5.1 Open Je Live Site

1. Ga naar je Netlify site URL (bijv. `marathon-trainer.netlify.app`)
2. Je zou de welkomstpagina moeten zien

### 5.2 Test Account Aanmaken

1. Vul je naam in
2. Klik "Start Jouw Training"
3. Doorloop de onboarding (5 stappen)
4. Bij laatste stap: klik "Genereer Mijn Schema"

### 5.3 Controleer of het werkt

1. Je zou een loading screen moeten zien (~15-30 seconden)
2. Dan een volledig gegenereerd 45-weken schema
3. Check in Supabase:
   - Ga naar je Supabase project
   - Klik **Table Editor**
   - Klik op `training_plans`
   - Je zou 1 rij moeten zien met je schema!

### 5.4 Troubleshooting

**❌ "Failed to generate plan"**
→ Check in Netlify: Functions → Logs voor errors
→ Verify je Anthropic API key heeft credit

**❌ "Network error"**
→ Check je Supabase keys in Netlify Environment Variables
→ Probeer cache te clearen en opnieuw deployen

**❌ "Database error"**
→ Check of je database/schema.sql succesvol is uitgevoerd
→ Kijk in Supabase Table Editor of tabellen bestaan

✅ **Checkpoint**: Alles werkt! Je hebt een live AI-powered marathon trainer! 🏃‍♂️

---

## STAP 6: Delen & Gebruik (optioneel)

### 6.1 Share Je App

Je live URL:
```
https://your-site-name.netlify.app
```

### 6.2 Updates Deployen

```bash
# Maak changes in je code
git add .
git commit -m "Update feature X"
git push origin main

# Netlify deployt automatisch!
```

### 6.3 Monitoring

**Supabase Dashboard**:
- Zie hoeveel users je hebt
- Check database usage
- Monitor API calls

**Netlify Dashboard**:
- Check deploy status
- Monitor bandwidth
- See function invocations

**Anthropic Console**:
- Monitor API usage
- Check costs
- See token consumption

---

## 📊 Kosten Overzicht

Met deze setup:

| Service | Gratis Tier | Jouw Gebruik | Kosten |
|---------|-------------|--------------|--------|
| **GitHub** | Unlimited public repos | 1 repo | €0 |
| **Supabase** | 500MB DB, 2GB bandwidth | ~10MB, <1GB | €0 |
| **Netlify** | 100GB bandwidth, 125k functions | ~5GB, ~1k calls/maand | €0 |
| **Anthropic** | Pay-as-you-go | ~50 schemas/maand | €1-3 |
| **TOTAAL** | | | **€1-3/maand** |

---

## 🎯 Je bent klaar!

Je hebt nu:
- ✅ Een live, werkende marathon training app
- ✅ AI-powered gepersonaliseerde schema's  
- ✅ Multi-user support met authenticatie
- ✅ Real-time database synchronisatie
- ✅ Professionele deployment pipeline
- ✅ Kosten van maar €1-3/maand

**Volgende stappen**:
1. Test uitgebreid met verschillende gebruikers
2. Verzamel feedback
3. Voeg features toe (export PDF, calendar sync, etc.)
4. Deel met runners! 🏃‍♀️

---

## 🆘 Hulp Nodig?

**Issues met deployment?**
- Check Netlify deploy logs
- Kijk in browser console (F12)
- Verify alle environment variables

**Database problemen?**
- Ga naar Supabase → Table Editor
- Check of tabellen bestaan
- Test RLS policies

**API errors?**
- Check Anthropic API key en credit
- Verify in Netlify Functions logs
- Test met kleinere requests eerst

---

**Success! 🎉 Je app is live op:**
→ [https://your-site.netlify.app](https://your-site.netlify.app)

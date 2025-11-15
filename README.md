# 🏃‍♂️ Loch Ness Marathon Trainer Pro

AI-Powered Marathon Training Platform met gepersonaliseerde trainingsschema's gegenereerd door Claude AI.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ Features

- 🤖 **AI-Powered Schema's**: Claude API genereert volledig gepersonaliseerde 45-weken trainingsplannen
- 👥 **Multi-User Support**: Veilige authenticatie en individuele data opslag via Supabase
- 📊 **Progress Tracking**: Real-time voortgang monitoring en statistieken
- 💪 **Smart Progressie**: Automatische 10%-regel controle en deload week planning
- 🏥 **Medische Overwegingen**: Rekening houdend met medicatie en blessures
- 📱 **Responsive Design**: Werkt op desktop, tablet en mobiel
- 💾 **Cloud Sync**: Data automatisch gesynchroniseerd tussen apparaten

## 🚀 Live Demo

**Demo**: [https://cnewmedia.github.io/marathon](https://cnewmedia.github.io/marathon)

## 📋 Vereisten

- **Supabase Account** (gratis tier is voldoende)
- **Anthropic API Key** (Claude API toegang)
- **GitHub Account** (voor hosting)

## 🛠️ Setup Instructies

### 1. Repository Klonen

```bash
git clone https://github.com/CNewMedia/marathon.git
cd marathon
```

### 2. Supabase Project Opzetten

1. Ga naar [supabase.com](https://supabase.com) en maak een gratis account
2. Klik op "New Project"
3. Vul in:
   - **Project naam**: `marathon-trainer`
   - **Database wachtwoord**: (bewaar dit veilig!)
   - **Region**: Kies dichtsbij (bijv. West EU (Ireland))
4. Klik "Create new project"

### 3. Database Schema Aanmaken

1. In je Supabase project dashboard, ga naar **SQL Editor**
2. Klik "New Query"
3. Kopieer en plak de inhoud van `database/schema.sql`
4. Klik "Run" om de tabellen aan te maken

### 4. Supabase API Keys Ophalen

1. Ga naar **Project Settings** (tandwiel icoon)
2. Klik op **API** in het menu
3. Kopieer:
   - **Project URL** (bijv. `https://xxxxx.supabase.co`)
   - **anon/public key** (lange string beginnend met `eyJ...`)

### 5. Anthropic API Key Verkrijgen

1. Ga naar [console.anthropic.com](https://console.anthropic.com)
2. Maak een account of log in
3. Ga naar **API Keys**
4. Klik "Create Key"
5. Kopieer je API key (begint met `sk-ant-...`)
6. Zet minimaal $5 credit op je account

### 6. Environment Variables Configureren

Maak een bestand `.env` in de root directory:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://jouw-project.supabase.co
VITE_SUPABASE_ANON_KEY=jouw-anon-key-hier

# Anthropic API (voor lokale development)
ANTHROPIC_API_KEY=sk-ant-jouw-api-key-hier
```

⚠️ **Belangrijk**: Voeg `.env` toe aan `.gitignore` (is al gedaan)

### 7. Voor Productie: GitHub Secrets

Voor deployment op GitHub Pages met backend functionaliteit:

1. Ga naar je GitHub repository
2. Klik **Settings** → **Secrets and variables** → **Actions**
3. Voeg toe:
   - `SUPABASE_URL`: Je Supabase project URL
   - `SUPABASE_ANON_KEY`: Je Supabase anon key
   - `ANTHROPIC_API_KEY`: Je Claude API key

### 8. Deployment

#### Optie A: Static (alleen frontend, geen AI generatie)
```bash
# Gewoon pushen naar GitHub
git add .
git commit -m "Initial commit"
git push origin main

# GitHub Pages activeren in repository settings
```

#### Optie B: Full Stack (met Netlify voor API calls)
```bash
# Installeer Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod
```

De app is nu live en volledig functioneel!

## 📁 Project Structuur

```
marathon-trainer/
├── public/              # Static assets
│   ├── index.html      # Main application
│   └── assets/         # Images, fonts, etc.
├── src/                # Source code (als je React wilt gebruiken)
│   ├── components/     # React components
│   ├── lib/           # Utilities (Supabase, Claude API)
│   └── styles/        # CSS modules
├── api/               # Serverless functions voor Claude API
│   └── generate-plan.js
├── database/          # Database schemas
│   ├── schema.sql     # Supabase tabellen
│   └── seed.sql       # Example data
├── .env.example       # Environment variabelen template
├── netlify.toml       # Netlify configuratie
└── README.md          # Deze file
```

## 🔧 Technologie Stack

- **Frontend**: Vanilla JavaScript / React (optioneel)
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **AI**: Claude 4 Sonnet via Anthropic API
- **Hosting**: GitHub Pages + Netlify Functions
- **Styling**: Custom CSS met moderne design

## 💡 Hoe het werkt

1. **Onboarding**: Gebruiker vult persoonlijke gegevens in (niveau, doelen, beschikbaarheid)
2. **AI Generatie**: Claude API ontvangt alle parameters en genereert een volledig gepersonaliseerd 45-weken schema
3. **Database Opslag**: Schema en gebruikersdata worden opgeslagen in Supabase
4. **Progress Tracking**: Gebruiker kan trainingen afvinken, voortgang wordt real-time gesynchroniseerd
5. **Smart Updates**: Schema past zich aan bij gemiste trainingen of wijzigingen

## 📊 Database Schema

### Users Tabel
- Authenticatie via Supabase Auth
- Profiel informatie (naam, niveau, doelen)
- Medische overwegingen

### Training Plans Tabel
- Volledig gegenereerd schema per gebruiker
- 45 weken met individuele trainingen
- Aangepaste intensiteit en volume

### Progress Tabel
- Voltooide trainingen
- Tijden en afstanden
- Notities en feedback

## 🔐 Beveiliging

- ✅ Row Level Security (RLS) enabled op alle Supabase tabellen
- ✅ API keys nooit in frontend code
- ✅ Serverless functions voor gevoelige API calls
- ✅ HTTPS voor alle communicatie

## 🐛 Troubleshooting

### "Failed to fetch" errors
- Controleer of je Supabase URL en keys correct zijn
- Controleer of CORS is ingeschakeld in Supabase

### Schema generatie werkt niet
- Controleer je Anthropic API key
- Zorg dat je credit hebt op je Anthropic account
- Check browser console voor foutmeldingen

### Data wordt niet opgeslagen
- Controleer of RLS policies correct zijn toegepast
- Kijk in Supabase Table Editor of data aankomt

## 📈 Kosten Overzicht

- **Supabase**: €0/maand (tot 500MB database, 2GB bandwidth)
- **Anthropic API**: ~€0.50-€2/maand (bij normaal gebruik)
- **GitHub Pages**: €0/maand
- **Netlify**: €0/maand (gratis tier, 100GB bandwidth)

**Totaal**: €0.50-€2/maand

## 🤝 Contributing

Contributions zijn welkom! Open een issue of pull request.

## 📝 License

MIT License - zie LICENSE file voor details

## 💬 Support

Voor vragen of problemen, open een issue op GitHub.

---

**Gemaakt met ❤️ voor Loch Ness Marathon 2026**

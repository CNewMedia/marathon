#!/bin/bash

# Loch Ness Marathon Trainer - Quick Setup Script
# Dit script helpt je om snel te starten met development

echo "🏃‍♂️ Loch Ness Marathon Trainer - Quick Setup"
echo "=============================================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "✅ .env file created!"
    echo ""
    echo "⚠️  BELANGRIJK: Open .env en vul je credentials in:"
    echo "   - VITE_SUPABASE_URL"
    echo "   - VITE_SUPABASE_ANON_KEY"
    echo "   - ANTHROPIC_API_KEY"
    echo ""
else
    echo "✅ .env file already exists"
    echo ""
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo "✅ Dependencies installed!"
    echo ""
else
    echo "✅ Dependencies already installed"
    echo ""
fi

echo "🎯 Next Steps:"
echo ""
echo "1. Setup Supabase:"
echo "   → Go to https://supabase.com"
echo "   → Create a new project"
echo "   → Run database/schema.sql in SQL Editor"
echo "   → Copy Project URL and anon key to .env"
echo ""
echo "2. Get Anthropic API Key:"
echo "   → Go to https://console.anthropic.com"
echo "   → Create API key"
echo "   → Add \$5 credit"
echo "   → Copy key to .env"
echo ""
echo "3. Start Development Server:"
echo "   → Run: npm run dev"
echo "   → Open: http://localhost:8888"
echo ""
echo "4. Deploy to Production:"
echo "   → Follow DEPLOYMENT.md guide"
echo "   → Push to GitHub"
echo "   → Deploy on Netlify"
echo ""
echo "📚 For detailed instructions, see:"
echo "   → README.md - Overview and features"
echo "   → DEPLOYMENT.md - Step-by-step deployment guide"
echo ""
echo "Good luck with your marathon training! 🎉"

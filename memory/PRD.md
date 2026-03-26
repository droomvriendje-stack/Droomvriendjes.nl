# Droomvriendjes - Product Requirements Document

## Latest Update: 26 Maart 2026

### Completed This Session (26 Maart):
- **CART PERSISTENCE BUG FIX** - Winkelwagen bleef niet behouden bij navigatie naar checkout
  - Root cause: Race condition in CartContext.jsx - save-effect overschreef localStorage met [] voordat load-effect klaar was
  - Fix: Lazy initialization in useState voor cart en coupon state
  - Getest en geverifieerd: Cart items overleven navigatie en page reloads
  
- **AI CAMPAGNE MAKER** - Volledig functionele AI marketing content generator
  - Backend: `/api/ai-campaigns/generate` - Genereert content via Emergent LLM Key (GPT-4o)
  - Backend: `/api/ai-campaigns/products` - Haalt producten uit Supabase
  - Backend: `/api/ai-campaigns/config-status` - Status check van integraties
  - Backend: `/api/ai-campaigns/history` - Eerdere campagnes ophalen
  - Frontend: `/admin/ai-campaigns` - Volledige UI met product selectie, platform keuze, toon/doel opties
  - Platforms: Facebook, Instagram, TikTok content generatie
  - Kopieerfunctie per platform voor directe social media posting
  - Gekoppeld in admin sidebar navigatie
  - TikTok credentials geconfigureerd in .env

### Previously Completed (Earlier Sessions):
- MongoDB -> Supabase (PostgreSQL) migratie
- Fixed Webpack "Invalid Host Header" & Supabase credentials
- Removed all Google AdSense components
- Reviews Tool Advanced: Management, `/droomvriendjes-reviews`, Homepage
- Advanced Product Editor: Image sorting, section toggling, alt-text SEO
- Product card normalization (1:1 ratio, line clamp) & mobile checkout
- Checkout totals & WELKOM10 coupon persistence
- Scarcity logic (unidirectional decrement with sessionStorage)
- Dashboard Funnel Analytics date-adjustable (day to year)
- Email Templates "Verzend Nu" button
- Dashboard Analytics linked to Supabase `total_amount`

## Tech Stack
- **Frontend:** React, Tailwind CSS, Shadcn/UI
- **Backend:** FastAPI (modulaire structuur), Pydantic
- **Database:** Supabase (PostgreSQL)
- **AI:** Emergent LLM Key (GPT-4o via emergentintegrations)
- **Integrations:** Mollie (Payments), Sendcloud (Shipping), SMTP (Email), TikTok API

## Code Architecture
```
/app/
├── backend/
│   ├── models/           # Pydantic schemas
│   ├── routes/           # API Endpoints
│   │   ├── ai_campaigns.py        # AI Marketing Generator
│   │   ├── dashboard_analytics.py # Supabase analytics
│   │   ├── products_supabase.py   # Product CRUD
│   │   ├── orders_supabase.py     # Order management
│   │   ├── reviews_supabase.py    # Reviews
│   │   └── email_templates.py     # Email management
│   ├── utils/supabase_db.py       # DB config
│   ├── server.py                  # FastAPI entrypoint
│   └── .env                       # Credentials
├── frontend/
│   ├── src/
│   │   ├── context/CartContext.jsx # Cart state (fixed)
│   │   ├── pages/AICampaignMakerPage.jsx
│   │   ├── pages/AdminCommandCenterNew.jsx
│   │   └── App.js
│   └── .env
```

## Key API Endpoints
- `GET /api/ai-campaigns/config-status` - Check AI/platform status
- `GET /api/ai-campaigns/products` - Products voor campagnes
- `POST /api/ai-campaigns/generate` - Generate AI content
- `GET /api/ai-campaigns/history` - Eerdere campagnes
- `GET /api/admin/dashboard` - Analytics dashboard
- `POST /api/orders` - Order aanmaken
- `POST /api/payments/create` - Mollie payment

## Credentials
- **Admin:** admin / Droomvriendjes2024!
- **Mollie:** Keys in /app/backend/.env
- **SMTP:** info@droomvriendjes.nl
- **TikTok:** Client key/secret in .env

## Upcoming Tasks (Prioriteit)
1. **P1:** TikTok OAuth flow implementeren voor automatisch posten
2. **P1:** Facebook/Instagram API keys aanvragen voor auto-posting
3. **P2:** Supabase `marketing_campaigns` tabel aanmaken voor geschiedenis
4. **P2:** Server.py refactoring (opschonen legacy MongoDB code)
5. **P2:** Admin panel thema update

## Notes
- Preview URL: https://ai-campaigns-4.preview.emergentagent.com
- Productie: www.droomvriendjes.nl (vereist deployment)
- Taal: Nederlands (alle UI en content)

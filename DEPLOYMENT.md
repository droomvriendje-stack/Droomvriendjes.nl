# Droomvriendjes Deployment Guide

## Architectuur Overzicht

| Component | Platform | Kosten |
|-----------|----------|--------|
| Domain | TransIP (nameservers → Cloudflare) | Bestaand |
| DNS + SSL | Cloudflare | Gratis |
| Frontend | Cloudflare Pages | Gratis |
| Backend | Railway.app | Gratis tier |
| Database | Supabase | Gratis |
| Bestanden | Supabase Storage | Gratis |

---

## 1. Cloudflare Setup (DNS + SSL)

### Stap 1: Cloudflare Account
1. Ga naar [cloudflare.com](https://cloudflare.com) en maak een account
2. Klik op "Add a Site" en voer `droomvriendjes.nl` in
3. Kies het **Free** plan

### Stap 2: Nameservers wijzigen bij TransIP
1. Cloudflare geeft je 2 nameservers (bijv. `xxx.ns.cloudflare.com`)
2. Log in bij TransIP → Domeinen → droomvriendjes.nl → Nameservers
3. Vervang de TransIP nameservers door de Cloudflare nameservers
4. Wacht 5-10 minuten tot propagatie

### Stap 3: SSL/TLS instellen
1. In Cloudflare: SSL/TLS → Overview → Kies "Full (strict)"
2. Edge Certificates → Always Use HTTPS: ON

---

## 2. Railway Backend Deployment

### Stap 1: Railway Account & Project
1. Ga naar [railway.app](https://railway.app)
2. Sign up met GitHub
3. Klik "New Project" → "Deploy from GitHub repo"
4. Selecteer je Droomvriendjes repository

### Stap 2: Environment Variables in Railway
Ga naar je project → Variables en voeg toe:

```
# Supabase (VERPLICHT)
SUPABASE_URL=https://qoykbhocordugtbvpvsl.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...[jouw key]
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...[jouw key]
USE_SUPABASE=true

# Mollie Payments
MOLLIE_API_KEY=live_fDjJtzMrQgaw9yEbBQTuGmrgNneqEx
MOLLIE_PROFILE_ID=pfl_eh9DPmmymw

# URLs (pas aan naar je domein)
FRONTEND_URL=https://droomvriendjes.nl
API_URL=https://api.droomvriendjes.nl
CORS_ORIGINS=https://droomvriendjes.nl,https://www.droomvriendjes.nl

# Email (Postmark)
POSTMARK_API_TOKEN=[jouw postmark token]
SMTP_FROM=info@droomvriendjes.nl

# Sendcloud Shipping
SENDCLOUD_PUBLIC_KEY=droomvriendjes-dash
SENDCLOUD_SECRET_KEY=15597aa8d236430da5e1f36a6a860b81

# Admin
ADMIN_USERNAME=admin
ADMIN_PASSWORD=[jouw wachtwoord]

# MongoDB (optioneel - fallback)
MONGO_URL=[je mongodb url]
DB_NAME=droomvriendjes
```

### Stap 3: Deploy
1. Railway detecteert automatisch de Dockerfile
2. Wacht tot de build klaar is (2-3 minuten)
3. Klik "Generate Domain" voor een tijdelijk railway.app domein

### Stap 4: Custom Domain
1. In Railway: Settings → Domains → Add Custom Domain
2. Voer in: `api.droomvriendjes.nl`
3. Kopieer de CNAME waarde die Railway geeft

### Stap 5: Cloudflare DNS voor Backend
1. Ga naar Cloudflare → DNS → Add record
2. Type: CNAME
3. Name: `api`
4. Target: [Railway CNAME waarde]
5. Proxy status: DNS only (grijs wolkje) - BELANGRIJK!

---

## 3. Cloudflare Pages Frontend Deployment

### Stap 1: Cloudflare Pages Project
1. Ga naar Cloudflare Dashboard → Pages
2. Klik "Create a project" → "Connect to Git"
3. Selecteer je GitHub repository

### Stap 2: Build Settings
```
Framework preset: Create React App
Build command: yarn build
Build output directory: build
Root directory: frontend
```

### Stap 3: Environment Variables
In Cloudflare Pages → Settings → Environment variables:

```
REACT_APP_BACKEND_URL=https://api.droomvriendjes.nl
REACT_APP_SUPABASE_URL=https://qoykbhocordugtbvpvsl.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...[jouw key]
```

### Stap 4: Deploy
1. Klik "Save and Deploy"
2. Wacht op de build (2-4 minuten)

### Stap 5: Custom Domain
1. In Cloudflare Pages → Custom domains
2. Voeg toe: `droomvriendjes.nl` en `www.droomvriendjes.nl`
3. Cloudflare configureert automatisch de DNS records

---

## 4. Supabase Setup

Je Supabase project is al geconfigureerd. Controleer:

1. **Tables**: products, orders, reviews, email_logs, etc.
2. **Storage**: Buckets voor product images
3. **API**: Anon key en Service key

### Supabase Storage voor Images
1. Ga naar Storage → Create bucket: `product-images`
2. Maak bucket PUBLIC voor productafbeeldingen
3. Update je backend om Supabase Storage te gebruiken voor uploads

---

## 5. DNS Overzicht (Cloudflare)

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| CNAME | @ | [Cloudflare Pages URL] | Proxied (oranje) |
| CNAME | www | [Cloudflare Pages URL] | Proxied (oranje) |
| CNAME | api | [Railway URL] | DNS only (grijs) |

---

## 6. Checklist voor Go-Live

- [ ] Cloudflare nameservers actief bij TransIP
- [ ] SSL/TLS op "Full (strict)" in Cloudflare
- [ ] Railway backend deployed en werkend
- [ ] Railway custom domain `api.droomvriendjes.nl` geconfigureerd
- [ ] Cloudflare Pages frontend deployed
- [ ] Custom domains `droomvriendjes.nl` en `www` werkend
- [ ] Alle environment variables correct ingesteld
- [ ] Mollie webhooks aangepast naar `https://api.droomvriendjes.nl/api/webhook/mollie`
- [ ] Test betaling gedaan
- [ ] Email verzending getest

---

## Troubleshooting

### Backend niet bereikbaar
1. Check Railway logs: `railway logs`
2. Controleer of PORT environment variable correct is
3. Test health endpoint: `curl https://api.droomvriendjes.nl/health`

### CORS errors
1. Controleer CORS_ORIGINS in Railway env vars
2. Moet exact matchen: `https://droomvriendjes.nl` (geen trailing slash)

### Database connectie mislukt
1. Check SUPABASE_URL en SUPABASE_SERVICE_KEY
2. Controleer Supabase dashboard voor errors

### Frontend build faalt
1. Check Cloudflare Pages build logs
2. Controleer of alle REACT_APP_ variabelen zijn ingesteld
3. Test lokaal met `yarn build`

---

## Kosten Overzicht (Geschat Maandelijks)

| Service | Gratis Limiet | Geschatte Kosten |
|---------|---------------|------------------|
| Cloudflare | Onbeperkt | €0 |
| Railway | 500 uur/maand | €0 (binnen limiet) |
| Supabase | 500MB DB, 1GB storage | €0 (binnen limiet) |
| **Totaal** | | **€0/maand** |

*Let op: Bij hoog verkeer kunnen kosten ontstaan. Monitor je usage.*

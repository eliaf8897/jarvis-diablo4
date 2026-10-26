# JARVIS — Diablo IV Companion

Progetto iniziale completo per una web app mobile-first in italiano, pensata per iPhone mentre giochi a Diablo IV su Xbox.

## Cosa contiene
- PWA installabile su iPhone (manifest, service worker, icone SVG).
- Frontend con ricerca, categorie, schede, build, boss/farming e stato fonti.
- Backend Express con API, database PostgreSQL opzionale, cache, validazione e registro fonti.
- Importatore Maxroll best-effort per guide e Planner pubblici.
- Dataset di esempio chiaramente marcati come demo.
- Test API di base.

## Importante: cosa NON è
Questo repository non contiene un database completo e verificato di tutti gli oggetti e le build del gioco. I dati di esempio sono marcati `demo: true`. Le fonti esterne possono cambiare formato o limitare l'accesso; l'importatore registra i dati recuperati e gli errori invece di inventare contenuti. Prima di dichiarare completa la copertura del gioco, occorre sincronizzare e verificare dataset reali compatibili con le licenze delle fonti.

## Requisiti
- Node.js 20 o superiore.
- PostgreSQL raccomandato per dati persistenti in produzione. Senza `DATABASE_URL`, il backend usa il dataset locale di esempio e la cache in memoria; i dati importati non sono persistenti dopo il riavvio.
- Account GitHub per il frontend statico.
- Hosting Node (es. Render) per il backend.
- Se usi PostgreSQL, crea un database e configura `DATABASE_URL`.

## Avvio locale
```bash
npm install
cp .env.example .env
npm start
```
Apri `http://localhost:3000`. Se `DATABASE_URL` è impostata, avvia le migrazioni:
```bash
npm run db:migrate
npm run db:seed
```

## Variabili d'ambiente
- `PORT`: porta HTTP (il provider la imposta normalmente).
- `DATABASE_URL`: connessione PostgreSQL (raccomandata).
- `FRONTEND_URL`: origine del frontend, es. `https://TUO-UTENTE.github.io`.
- `MAXROLL_ENABLED`: `true` per abilitare importazione Maxroll.
- `SYNC_TOKEN`: token facoltativo per proteggere l'endpoint di sincronizzazione.
- `NODE_ENV`: `production` in produzione.

## Pubblicazione prevista
1. Carica tutti i file del pacchetto nella root del repository GitHub nuovo/vuoto.
2. Pubblica il backend su Render come Web Service, build command `npm install`, start command `npm start`.
3. Per un uso persistente, crea PostgreSQL e configura `DATABASE_URL`, quindi esegui `npm run db:migrate` e `npm run db:seed`.
4. Configura `FRONTEND_URL` con l'origine GitHub Pages esatta e `MAXROLL_ENABLED=true`.
5. In `public/js/config.js`, sostituisci `API_BASE_URL` con l'URL del backend Render.
6. Abilita GitHub Pages dalla cartella `/public` usando GitHub Actions o pubblica il contenuto di `public` in un branch/cartella Pages. Per semplicità si può usare un workflow statico dedicato.
7. Verifica `/api/health`, `/api/catalog`, ricerca e importazione prima di usare il sito.

## Sicurezza e licenze
- Non inserire chiavi segrete nel frontend.
- Non bypassare login, paywall, CAPTCHA o protezioni anti-bot.
- Importa solo dati accessibili pubblicamente e nel rispetto dei termini/licenze. Usa immagini solo se autorizzate o provenienti da fonti che ne consentono il riuso.
- Le statistiche e le build possono cambiare con le patch. Il frontend mostra fonte e versione quando disponibili.

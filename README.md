# PRISMS — Agri-Command Center & Market Discovery Platform

PRISMS (Predictive Realization & Intelligence System for Mandi Supplies) is a digital command center and GIS market discovery platform designed for Indian farmers. It enables farmers to compare nearby APMC mandis, calculate true net profit realizations after logistics & APMC fees, view price forecasts, and receive live market decision support.

---

## 1. Architecture Overview

```
User (Browser / Mobile)
        ↓
Vercel Frontend (React 19 / Vite / TailwindCSS)
        ↓ HTTPS
Render Backend (Node.js / Express 5 / TypeScript)
        ↓
MongoDB Atlas (Price & Market Collections with Compound Indexes)
        ↓
Data.gov.in / AGMARKNET API (Live Government APMC Mandi Ingestion)
```

---

## 2. Technology Stack

- **Frontend**: React 19, TanStack Router, TanStack Query, Vite 8, TailwindCSS 4, Lucide & Material Symbols icons, Leaflet GIS Maps.
- **Backend**: Node.js, Express 5, TypeScript (`tsx watch` / `tsc`), Mongoose, Zod Validation, Helmet, Cors, Rate-Limiting.
- **Database**: MongoDB Atlas (Price & Market models).
- **Integrations**: Data.gov.in (AGMARKNET Government Mandi Ingestion API), Open-Meteo API (Weather Advisories).

---

## 3. Environment Variables

### Backend (`backend/.env`)
```ini
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/prisms?retryWrites=true&w=majority
JWT_ACCESS_SECRET=replace_with_64_character_hex_secret_access_token
JWT_REFRESH_SECRET=replace_with_64_character_hex_secret_refresh_token
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
CORS_ORIGINS=https://prisms.vercel.app,http://localhost:5173
FRONTEND_URL=https://prisms.vercel.app
DATA_GOV_API_KEY=<set_in_render_environment>
DATA_GOV_RESOURCE_ID=9ef84268-d588-465a-a308-a864a43d0070
```

### Frontend (`frontend/.env`)
```ini
VITE_API_URL=https://prisms-backend.onrender.com/api/v1
```

---

## 4. Mandi Data Validation Layer

PRISMS includes a strict verification layer (`validateAndNormalizeGovRecord`) before storing or displaying government mandi records:

1. **Price Hierarchy Rule**:
   $$\text{MIN PRICE} \le \text{MODAL PRICE} \le \text{MAX PRICE}$$
   If $\text{MODAL PRICE} > \text{MAX PRICE}$ or $\text{MIN PRICE} > \text{MODAL PRICE}$, `validationStatus` is set to `INVALID` with a detailed `validationReason` and filtered out from verified market queries.

2. **Unit Normalization**:
   Normalizes source prices per kilogram (`Rs/Kg`) into Quintal (`Rs/Qtl`) by multiplying by 100 while preserving original `sourcePrice` and `sourceUnit` fields.

3. **Data Provenance**:
   Tracks `sourceType` (`LIVE_GOVT_API` vs `SEEDED_HISTORICAL_BENCHMARK`), `sourceDate` (Government auction date), and `fetchedAt` (PRISMS ingestion timestamp).

---

## 5. Key API Endpoints

- `GET /health` — Simple health check returning `{ status: "ok", environment: "production" }`
- `GET /api/v1/news/feed` — Command Feed events sorted by priority & recency with `Cache-Control: no-cache, no-store`
- `GET /api/v1/prices` — Verified market price query endpoint with `validationStatus` filtering
- `POST /api/v1/prices/sync` — Protected administrative endpoint to ingest live APMC mandi data from Data.gov.in
- `POST /api/v1/advisor/chat` — AI Agri-Advisor decision support assistant

---

## 6. Local Setup Instructions

### 1. Backend Setup
```bash
cd backend
npm install
npm run dev
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

---

## 7. Deployment Instructions

### Vercel (Frontend)
1. Import repository into Vercel dashboard.
2. Set **Root Directory**: `frontend`.
3. Set **Build Command**: `npm run build`.
4. Set **Output Directory**: `dist`.
5. Add Environment Variable:
   - `VITE_API_URL` = `https://<YOUR_RENDER_BACKEND_URL>/api/v1`

### Render (Backend)
1. Create a new Web Service on Render from GitHub repository.
2. Set **Root Directory**: `backend`.
3. Set **Build Command**: `npm install && npx tsc`.
4. Set **Start Command**: `npm start`.
5. Add Environment Variables:
   - `NODE_ENV` = `production`
   - `MONGODB_URI` = `<YOUR_MONGODB_ATLAS_URI>`
   - `JWT_ACCESS_SECRET` = `<64_CHAR_HEX_SECRET>`
   - `JWT_REFRESH_SECRET` = `<64_CHAR_HEX_SECRET>`
   - `FRONTEND_URL` = `https://<YOUR_VERCEL_APP_NAME>.vercel.app`
   - `DATA_GOV_API_KEY` = `<set_in_render_environment>`

### MongoDB Atlas Setup
1. Create a Cluster in MongoDB Atlas.
2. Network Access: Add IP Address `0.0.0.0/0` (Allow access from anywhere for Render).
3. Database User: Create a user with Read/Write access.
4. Copy Connection String to `MONGODB_URI`.

---

## 8. Security & Production Best Practices

- **Zero Hardcoded Secrets**: Secrets and API keys are stored strictly in environment variables.
- **CORS Protection**: Access restricted to authorized production domains (`FRONTEND_URL` and `*.vercel.app`).
- **Protected Administrative Endpoints**: `/api/v1/prices/sync` requires JWT authentication and strict rate limiting (max 10 requests / 15 minutes).
- **Sanitized Error Responses**: Production error handler strips stack traces and internal database error messages.

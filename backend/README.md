# PRISMS Backend API & Developer Handover Guide

Welcome to the PRISMS Backend Repository. This document is the comprehensive source of truth for incoming frontend engineers, mobile developers, or new backend team members. It outlines how to run the project, the architecture, and detailed API specifications including edge cases and error handling.

---

## 1. Getting Started (Developer Setup)

### Prerequisites
- **Node.js** (v20+ recommended)
- **MongoDB** (Local instance or Atlas connection string)

### Installation & Running Locally
1. **Navigate to the backend folder:** `cd backend`
2. **Install dependencies:** `npm install`
3. **Environment Setup:** 
   - Copy `.env.example` to `.env`
   - Set `MONGODB_URI` to your database.
   - Ensure `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` are at least 32 characters long.
4. **Seed Mock Data (Optional but recommended for UI dev):**
   - Run `npx tsc ; node dist/scripts/seed.js`
   - *Note: If you encounter an `ECONNREFUSED` error on Windows/Corporate Wi-Fi, use a mobile hotspot or change your DNS to 8.8.8.8, as this is a known Node.js SRV resolution issue.*
5. **Start the server:** `npm run dev`

The server will start on `http://localhost:5000`.

---

## 2. Global API Conventions

### Base URL
All API routes are prefixed with: `/api/v1`

### Authentication (JWT)
The API uses secure, `httpOnly` cookies for authentication. 
- You do **not** need to manually attach an `Authorization: Bearer <token>` header in your frontend code for requests.
- When calling login/register, the backend automatically sets a `refreshToken` cookie in the browser.
- The `accessToken` is returned in the JSON body, which you should store in memory (not localStorage) and attach to future requests if needed, though our current implementation uses cookie-based sessions for simplicity.

### Standardized Error Responses
All endpoints use Zod for validation. If a request fails validation, it returns a `400 Bad Request` with this exact structure:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request payload",
    "details": [
      { "field": "email", "message": "Invalid email address" }
    ]
  }
}
```

---

## 3. API Endpoints

### 🔐 Auth Module

#### `POST /auth/register`
Creates a new farmer account.
- **Body:** `{ "name": "John", "email": "john@test.com", "password": "Password123!", "role": "farmer" }`
- **Scenarios & Status Codes:**
  - `201 Created`: User successfully registered. Returns user object and token.
  - `400 Bad Request`: Validation error (e.g., password too short).
  - `409 Conflict`: Email already exists.

#### `POST /auth/login`
Authenticates a user.
- **Body:** `{ "email": "john@test.com", "password": "Password123!" }`
- **Scenarios & Status Codes:**
  - `200 OK`: Login successful. Sets `refreshToken` cookie.
  - `401 Unauthorized`: Invalid email or password.
  - `400 Bad Request`: Missing email or password fields.

---

### 👤 User Module

#### `GET /users/me`
Retrieves the profile of the currently logged-in user.
- **Headers:** Requires valid Session Cookie.
- **Scenarios & Status Codes:**
  - `200 OK`: Returns the user profile data.
  - `401 Unauthorized`: Missing or expired token.

---

### 🏪 Markets Module

#### `GET /markets`
Retrieves a list of mandis. Supports geospatial `$near` queries to find the closest markets to a farmer.
- **Query Params (Optional):**
  - `lat` (number): Farmer's latitude.
  - `lng` (number): Farmer's longitude.
  - `radius` (number): Search radius in meters (default: 50000 / 50km).
  - `state` (string): Filter by state.
- **Scenarios & Status Codes:**
  - `200 OK`: Returns an array of Market objects. If `lat/lng` are provided, they are sorted by closest distance.
  - `400 Bad Request`: If `lat` is provided but `lng` is missing, or vice versa.

---

### 💰 Prices Module

#### `GET /prices`
Retrieves historical price time-series data for rendering charts.
- **Query Params:**
  - `marketId` (string, required): The MongoDB ID of the market.
  - `commodity` (string, required): The crop name (e.g., "Onion").
- **Scenarios & Status Codes:**
  - `200 OK`: Returns an array of Price objects (newest first).
  - `400 Bad Request`: Missing required query parameters.

---

### 🧠 Net Earning Calculator (Core AI Engine)

#### `POST /net-earning`
Calculates the actual take-home profit for a farmer by deducting transport, spoilage, and mandi fees, returning a ranked list of the best mandis to travel to.
- **Body:** 
  ```json
  {
    "commodity": "Onion",
    "quantityQuintals": 10,
    "farmerLat": 18.5204,
    "farmerLng": 73.8567,
    "transportRatePerKm": 20 // Optional. Defaults to 20.
  }
  ```
- **Scenarios & Status Codes:**
  - `200 OK`: Returns ranked markets with full mathematical breakdown:
    ```json
    {
      "success": true,
      "data": [
        {
          "market": { "name": "Pune APMC", "distanceKm": 12.5 },
          "breakdown": {
            "grossValue": 25000,
            "transportCost": 2500,
            "spoilageLoss": 1250,
            "mandiFee": 500,
            "netEarning": 20750
          }
        }
      ]
    }
    ```
  - `400 Bad Request`: Validation failure (e.g., negative quantity).
  - `404 Not Found`: No markets found within 100km that trade the requested commodity.

---

### 📈 Forecast Module

#### `GET /forecast`
Simulates a Machine Learning prediction model to advise the farmer whether to sell today or hold their crop based on 30-day historical trend lines.
- **Query Params:**
  - `marketId` (string, required): The MongoDB ID of the market.
  - `commodity` (string, required): The crop name (e.g., "Onion").
  - `days` (enum: '7' or '15'): How many days ahead to forecast. Defaults to '7'.
- **Scenarios & Status Codes:**
  - `200 OK`: Returns a recommendation ("SELL NOW" or "HOLD"), a confidence score, and the projected price array for UI charting.
  - `400 Bad Request` (Code: `INSUFFICIENT_DATA`): The database does not have at least 5 days of historical data for this crop/mandi combination to calculate a reliable trend.

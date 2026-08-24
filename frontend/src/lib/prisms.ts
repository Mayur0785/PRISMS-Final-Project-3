import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const rawBaseUrl =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) ||
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
  "http://localhost:5000/api/v1";

const cleanBaseUrl = rawBaseUrl.trim().replace(/\/+$/, "");
export const API_BASE_URL = cleanBaseUrl.endsWith("/api/v1")
  ? cleanBaseUrl
  : cleanBaseUrl.endsWith("/api")
  ? `${cleanBaseUrl}/v1`
  : `${cleanBaseUrl}/api/v1`;

export const API_URL = API_BASE_URL;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("prisms_token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else if (token) {
      promise.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      const url = originalRequest.url || "";
      if (url.includes("/auth/login") || url.includes("/auth/register") || url.includes("/auth/refresh")) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
              }
              resolve(apiClient(originalRequest));
            },
            reject: (err) => {
              reject(err);
            },
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const storedRefreshToken = localStorage.getItem("prisms_refresh_token");
        const res = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          storedRefreshToken ? { refreshToken: storedRefreshToken } : {},
          {
            withCredentials: true,
            headers: storedRefreshToken ? { "x-refresh-token": storedRefreshToken } : {},
          }
        );

        const newAccessToken = res.data?.data?.accessToken;
        const newRefreshToken = res.data?.data?.refreshToken;

        if (newAccessToken) {
          localStorage.setItem("prisms_token", newAccessToken);
          if (newRefreshToken) {
            localStorage.setItem("prisms_refresh_token", newRefreshToken);
          }

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          }

          processQueue(null, newAccessToken);
          return apiClient(originalRequest);
        } else {
          throw new Error("No access token returned from refresh endpoint");
        }
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        logoutUser();
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("prisms:session_expired"));
        }
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export interface Commodity {
  id: string;
  name: string;
  name_hi?: string | null;
  name_mr?: string | null;
  spoilage_rate_percent: number;
  unit: string;
}

export interface Market {
  id: string;
  name: string;
  district: string;
  state: string;
  latitude: number | null;
  longitude: number | null;
  distance_km: number;
  commission_fee_percent: number;
}

export interface PriceEntry {
  market_id: string;
  date: string;
  price_per_unit: number;
}

export const CROP_EMOJI: Record<string, string> = {
  Tomato: "🍅",
  Onion: "🧅",
  Potato: "🥔",
  Wheat: "🌾",
  Banana: "🍌",
  Cotton: "⚪",
  Soybeans: "🌱",
  "Red Onion": "🧅",
  "Green Chilli": "🌶️",
};

export const CROP_MR_FALLBACK: Record<string, string> = {
  Tomato: "टोमॅटो",
  Onion: "कांदा",
  Potato: "बटाटा",
  Wheat: "गहू",
  Banana: "केळी",
  Cotton: "कापूस",
  Soybeans: "सोयाबीन",
  "Red Onion": "लाल कांदा (नाशिक)",
  "Green Chilli": "हिरवी मिरची",
};

export const CROP_HI_FALLBACK: Record<string, string> = {
  Tomato: "टमाटर",
  Onion: "प्याज",
  Potato: "आलू",
  Wheat: "गेहूँ",
  Banana: "केला",
  "Green Chilli": "हरी मिर्च",
};

export async function fetchCommodities(): Promise<Commodity[]> {
  return [
    { id: "onion_1", name: "Red Onion", name_mr: "लाल कांदा (नाशिक)", name_hi: "लाल प्याज", spoilage_rate_percent: 8, unit: "kg" },
    { id: "banana_1", name: "Banana", name_mr: "केळी (सोलापूर / जळगाव)", name_hi: "केला", spoilage_rate_percent: 9, unit: "kg" },
    { id: "tomato_1", name: "Tomato", name_mr: "टोमॅटो (नारायणगाव / जुन्नर)", name_hi: "टमाटर", spoilage_rate_percent: 12, unit: "kg" },
    { id: "wheat_1", name: "Wheat", name_mr: "शरबती गहू", name_hi: "गेहूँ", spoilage_rate_percent: 5, unit: "kg" },
    { id: "soybeans_1", name: "Soybeans", name_mr: "पिवळा सोयाबीन", name_hi: "सोयाबीन", spoilage_rate_percent: 4, unit: "kg" },
    { id: "potato_1", name: "Potato", name_mr: "बटाटा (मंचर)", name_hi: "आलू", spoilage_rate_percent: 4, unit: "kg" },
    { id: "cotton_1", name: "Cotton", name_mr: "कापूस", name_hi: "कपास", spoilage_rate_percent: 3, unit: "kg" }
  ];
}

export async function fetchMarkets(): Promise<Market[]> {
  try {
    const res = await apiClient.get(`${API_URL}/markets`);
    return res.data.data.map((m: any) => {
      // Map MongoDB GeoJSON [longitude, latitude] to flat properties
      const lng = m.location?.coordinates?.[0] ?? m.longitude ?? null;
      const lat = m.location?.coordinates?.[1] ?? m.latitude ?? null;
      
      return {
        ...m,
        id: m._id || m.id,
        latitude: lat,
        longitude: lng,
        distance_km: Number(m.distanceKm || m.distance_km || 0),
        commission_fee_percent: Number(m.commission_fee_percent || 5),
      };
    });
  } catch (error) {
    console.error("Error fetching markets", error);
    return [];
  }
}

/** last N days of prices for one commodity across the given markets */
export async function fetchPrices(commodityId: string, marketIds: string[]): Promise<PriceEntry[]> {
  if (marketIds.length === 0) return [];
  try {
    const res = await apiClient.get(`${API_URL}/prices`, {
      params: { commodityId, marketIds: marketIds.join(",") }
    });
    return res.data.data.map((p: any) => {
      const mId = typeof p.marketId === 'object' ? (p.marketId?._id || p.marketId?.id) : (p.marketId || p.market_id);
      return {
        ...p,
        market_id: String(mId || ''),
        price_per_unit: Number(p.modalPrice || p.price_per_unit || 0),
      };
    });
  } catch (error) {
    console.error("Error fetching prices", error);
    return [];
  }
}

export async function fetchRealDistances(
  userCoords: { lat: number; lng: number },
  markets: Market[]
): Promise<number[]> {
  if (markets.length === 0) return [];
  
  try {
    const destinations = markets
      .filter((m) => m.latitude != null && m.longitude != null)
      .map((m) => ({ lat: m.latitude, lng: m.longitude }));
      
    if (destinations.length === 0) return markets.map(() => 0);

    const res = await apiClient.post(`${API_URL}/distance-matrix`, {
      origins: [userCoords],
      destinations
    });
    
    if (res.data?.success && Array.isArray(res.data?.data)) {
      return res.data.data;
    }
  } catch {
    // Graceful fallback to accurate haversine calculation
  }

  return markets.map((m) => {
    if (m.latitude != null && m.longitude != null) {
      return Math.round(haversineKm([userCoords.lat, userCoords.lng], [m.latitude, m.longitude]));
    }
    return 25;
  });
}

export async function logQuery(input: {
  commodityId: string;
  quantityKg: number;
  farmerLocation: string;
  latitude?: number | null;
  longitude?: number | null;
}) {
  console.log("Logged query to backend (mocked):", input);
}

/** straight-line distance in km between two points */
export function haversineKm(a: [number, number], b: [number, number]): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const [lat1, lon1] = a;
  const [lat2, lon2] = b;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

/** pick the district whose markets are closest to the given coordinates */
export function nearestDistrict(markets: Market[], lat: number, lng: number): string | null {
  let best: { district: string; dist: number } | null = null;
  for (const m of markets) {
    if (m.latitude == null || m.longitude == null) continue;
    const dist = haversineKm([lat, lng], [m.latitude, m.longitude]);
    if (!best || dist < best.dist) best = { district: m.district, dist };
  }
  return best?.district ?? null;
}

/** match typed text (village, district or market name) to a known district */
export function matchDistrict(markets: Market[], text: string): string | null {
  const q = text.trim().toLowerCase();
  if (!q) return null;
  for (const m of markets) {
    if (m.district.toLowerCase() === q) return m.district;
  }
  for (const m of markets) {
    const hay = `${m.district} ${m.state} ${m.name}`.toLowerCase();
    if (hay.includes(q) || q.includes(m.district.toLowerCase())) return m.district;
  }
  return null;
}

export interface VehicleOption {
  id: string;
  name: string;
  name_mr: string;
  capacityQtl: number;
}

export const VEHICLE_OPTIONS: VehicleOption[] = [
  { id: "own_vehicle", name: "My Own Vehicle", name_mr: "स्वतःचे वाहन (My Own Vehicle)", capacityQtl: 50 },
  { id: "small_pickup", name: "Small Pickup (Chhota Hathi)", name_mr: "छोटा पिकअप (छोटा हत्ती)", capacityQtl: 10 },
  { id: "medium_pickup", name: "Medium Pickup (Bolero MaxiTruck)", name_mr: "मध्यम पिकअप (बोलेरो मॅक्सीट्रक)", capacityQtl: 30 },
  { id: "tata_407", name: "Tata 407 / Eicher", name_mr: "टाटा ४०७ / आयशर", capacityQtl: 50 },
  { id: "mini_truck", name: "Mini Truck (6-Wheeler)", name_mr: "मिनी ट्रक (६ व्हीलर)", capacityQtl: 80 },
  { id: "large_truck", name: "Large Truck (Multi-Axle)", name_mr: "मोठा ट्रक (मल्टी-ॲक्सल)", capacityQtl: 150 },
];

export type Trend = "rising" | "falling" | "stable";

export interface MarketResult {
  market: Market;
  pricePerKg: number;
  pricePerQtl: number;
  gross: number;
  trips: number;
  vehicleCapacityQtl: number;
  vehicleName: string;
  transport: number;
  labour: number;
  totalLogistics: number;
  spoilage: number;
  spoilagePct: number;
  commission: number;
  net: number;
  trend: Trend;
  changePct: number;
  history: number[];
  source: 'LIVE_GOVT_API' | 'SEEDED_HISTORICAL_BENCHMARK';
}

export const DEFAULT_TRANSPORT_RATE = 1.5; // ₹ per km per quintal (₹1.50/km/Qtl, ₹15/km/Tonne)

export const DISTRICT_COORDS: Record<string, { lat: number; lng: number }> = {
  karjat: { lat: 18.9102, lng: 73.3283 },
  khopoli: { lat: 18.7887, lng: 73.3444 },
  raigad: { lat: 18.5158, lng: 73.1822 },
  nashik: { lat: 19.9975, lng: 73.7898 },
  lasalgaon: { lat: 20.1418, lng: 74.2255 },
  pimpalgaon: { lat: 20.1700, lng: 73.9800 },
  vashi: { lat: 19.0745, lng: 73.0031 },
  "navi mumbai": { lat: 19.0745, lng: 73.0031 },
  mumbai: { lat: 19.0178, lng: 72.8478 },
  kalyan: { lat: 19.2403, lng: 73.1305 },
  panvel: { lat: 18.9894, lng: 73.1093 },
  pune: { lat: 18.5204, lng: 73.8567 },
  baramati: { lat: 18.1517, lng: 74.5815 },
  rahuri: { lat: 19.3900, lng: 74.6500 },
  ahmednagar: { lat: 19.0952, lng: 74.7496 },
  thane: { lat: 19.2183, lng: 72.9781 },
  alibag: { lat: 18.6534, lng: 72.8687 },
  solapur: { lat: 17.6599, lng: 75.9064 },
  kolhapur: { lat: 16.7050, lng: 74.2433 },
  satara: { lat: 17.6805, lng: 73.9935 },
  sangli: { lat: 16.8524, lng: 74.5815 },
  aurangabad: { lat: 19.8762, lng: 75.3433 },
  sambhajinagar: { lat: 19.8762, lng: 75.3433 },
  jalgaon: { lat: 21.0077, lng: 75.5626 },
  dhule: { lat: 20.9042, lng: 74.7749 },
  nagpur: { lat: 21.1458, lng: 79.0882 },
  azadpur: { lat: 28.7041, lng: 77.1725 },
  delhi: { lat: 28.7041, lng: 77.1725 },
};

export function getCoordsFromLocationText(text: string, markets: Market[]): { lat: number; lng: number } | null {
  if (!text) return null;
  const lower = text.toLowerCase().trim();

  for (const [key, c] of Object.entries(DISTRICT_COORDS)) {
    if (lower.includes(key)) {
      return c;
    }
  }

  const matchedMarket = markets.find(
    (m) =>
      m.name.toLowerCase().includes(lower) ||
      m.district.toLowerCase().includes(lower) ||
      m.state.toLowerCase().includes(lower)
  );
  if (matchedMarket && matchedMarket.latitude != null && matchedMarket.longitude != null) {
    return { lat: matchedMarket.latitude, lng: matchedMarket.longitude };
  }

  return null;
}

export function computeResults(
  markets: Market[],
  prices: PriceEntry[],
  commodity: Commodity,
  qtyKg: number,
  transportRatePerKmPerQuintal: number = DEFAULT_TRANSPORT_RATE,
  coords?: { lat: number; lng: number } | null,
  realDistances?: number[] | null,
  vehicleId: string = "medium_pickup",
  labourPerTripNum: number = 500,
  isColdChain: boolean = false
): MarketResult[] {
  const vehicle = VEHICLE_OPTIONS.find((v) => v.id === vehicleId) || VEHICLE_OPTIONS[1]!;
  const qtyQtl = qtyKg / 100;
  const trips = Math.max(1, Math.ceil(qtyQtl / vehicle.capacityQtl));
  const labour = Math.round((Number(labourPerTripNum) || 0) * trips);

  const byMarket = new Map<string, { prices: number[]; source: 'LIVE_GOVT_API' | 'SEEDED_HISTORICAL_BENCHMARK' }>();
  for (const p of prices) {
    const entry = byMarket.get(p.market_id) ?? { prices: [], source: 'SEEDED_HISTORICAL_BENCHMARK' };
    entry.prices.push(p.price_per_unit);
    if (p.source) entry.source = p.source;
    byMarket.set(p.market_id, entry);
  }

  const results: MarketResult[] = [];
  for (let i = 0; i < markets.length; i++) {
    const market = markets[i]!;
    const entry = byMarket.get(market.id);
    if (!entry || entry.prices.length === 0) continue;

    const history = entry.prices;
    let distance_km = market.distance_km;

    // 1. Use Real Google Maps API distance if available and valid (>0)
    if (realDistances && realDistances[i] !== undefined && realDistances[i] !== -1 && realDistances[i] !== null) {
      distance_km = realDistances[i]!;
    } 
    // 2. Fallback to Haversine distance calibrated with 1.35x rural road factor
    else if (coords && market.latitude != null && market.longitude != null) {
      const geodesic = haversineKm([coords.lat, coords.lng], [market.latitude, market.longitude]);
      distance_km = Math.round(geodesic * 1.35 * 10) / 10;
    }

    const rawPrice = history[history.length - 1]!;
    const pricePerQtl = rawPrice > 100 ? Math.round(rawPrice) : Math.round(rawPrice * 100);
    const pricePerKg = pricePerQtl / 100;
    const gross = Math.round(pricePerQtl * qtyQtl);

    const transportRate = transportRatePerKmPerQuintal > 5 ? 1.5 : transportRatePerKmPerQuintal;
    const transport = vehicle.id === "own_vehicle" ? 0 : Math.round(distance_km * transportRate * qtyQtl);
    const totalLogistics = transport + labour;

    // Cold chain reduces spoilage by 50%
    const baseSpoilagePct = commodity.spoilage_rate_percent / 100;
    const spoilagePct = isColdChain ? baseSpoilagePct * 0.5 : baseSpoilagePct;
    const spoilage = Math.round(gross * spoilagePct);

    // Farmer-borne market handling charges (estimated 1.0% for hamali, weighing & loading)
    const commission = Math.round(gross * 0.01);
    const net = gross - transport - labour - spoilage - commission;

    const { trend, changePct } = computeTrend(history);

    results.push({
      market: { ...market, distance_km },
      pricePerKg,
      pricePerQtl,
      gross,
      trips,
      vehicleCapacityQtl: vehicle.capacityQtl,
      vehicleName: vehicle.name,
      transport,
      labour,
      totalLogistics,
      spoilage,
      spoilagePct,
      commission,
      net,
      trend,
      changePct,
      history,
      source: entry.source,
    });
  }

  return results.sort((a, b) => b.net - a.net);
}

export function formatRupees(n: number): string {
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

/** last 15 days: average of most recent 5 days vs the prior 10 days */
export function computeTrend(history: number[]): { trend: Trend; changePct: number } {
  const window = history.slice(-15);
  const recent = window.slice(-5);
  const prior = window.slice(0, -5).slice(-10);
  if (recent.length === 0 || prior.length === 0) return { trend: "stable", changePct: 0 };
  const priorAvg = avg(prior);
  if (priorAvg <= 0) return { trend: "stable", changePct: 0 };
  const changePct = ((avg(recent) - priorAvg) / priorAvg) * 100;
  const trend: Trend = changePct > 5 ? "rising" : changePct < -5 ? "falling" : "stable";
  return { trend, changePct };
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "farmer" | "buyer" | "fpo" | "advisor";
  phone?: string;
  village?: string;
  businessName?: string;
}

export interface AuthResponse {
  user: AuthUser;
  accessToken: string;
}

interface StoredAccount {
  id: string;
  name: string;
  email: string;
  phone?: string;
  password: string;
  role: "farmer" | "buyer" | "fpo" | "advisor";
  village?: string;
  district?: string;
  businessName?: string;
}

const DEFAULT_AUTH_ACCOUNTS: StoredAccount[] = [
  {
    id: "user_demo_001",
    name: "Mayur Kapse (नवी मुंबई)",
    email: "farmer.lasalgaon@prisms.gov.in",
    phone: "9876543210",
    password: "Kisan@2024",
    role: "farmer",
    village: "Karjat",
    district: "Raigad",
  },
  {
    id: "user_demo_buyer_001",
    name: "Nashik Agro Processors Ltd.",
    email: "buyer.nashik@prisms.gov.in",
    phone: "9876543220",
    password: "Kisan@2024",
    role: "buyer",
    village: "Dindori",
    district: "Nashik",
    businessName: "Nashik Agro Processors Ltd.",
  },
  {
    id: "user_demo_002",
    name: "Sahyadri FPO Manager",
    email: "fpo.sahyadri@prisms.gov.in",
    phone: "9876543211",
    password: "Kisan@2024",
    role: "fpo",
    village: "Lasalgaon",
    district: "Nashik",
  }
];

function getAuthAccountsVault(): StoredAccount[] {
  if (typeof window === "undefined") return DEFAULT_AUTH_ACCOUNTS;
  try {
    const raw = localStorage.getItem("prisms_auth_accounts_vault");
    if (!raw) {
      localStorage.setItem("prisms_auth_accounts_vault", JSON.stringify(DEFAULT_AUTH_ACCOUNTS));
      return DEFAULT_AUTH_ACCOUNTS;
    }
    const accounts: StoredAccount[] = JSON.parse(raw);
    let updated = false;
    DEFAULT_AUTH_ACCOUNTS.forEach(defAcc => {
      if (!accounts.some(a => a.email.toLowerCase() === defAcc.email.toLowerCase() || (defAcc.phone && a.phone === defAcc.phone))) {
        accounts.push(defAcc);
        updated = true;
      }
    });
    if (updated) {
      localStorage.setItem("prisms_auth_accounts_vault", JSON.stringify(accounts));
    }
    return accounts;
  } catch {
    return DEFAULT_AUTH_ACCOUNTS;
  }
}

function saveAccountToVault(account: StoredAccount): void {
  if (typeof window === "undefined") return;
  const accounts = getAuthAccountsVault();
  const index = accounts.findIndex(a => a.email.toLowerCase() === account.email.toLowerCase() || (account.phone && a.phone === account.phone));
  if (index >= 0) {
    accounts[index] = { ...accounts[index], ...account };
  } else {
    accounts.push(account);
  }
  localStorage.setItem("prisms_auth_accounts_vault", JSON.stringify(accounts));
}

export function normalizeUserIdentifier(input: string): string {
  if (!input) return "";
  const trimmed = input.trim();
  const cleanPhone = trimmed.replace(/\D/g, "");
  if (/^\d{10}$/.test(cleanPhone)) {
    return `${cleanPhone}@prisms.gov.in`;
  }
  return trimmed.toLowerCase();
}

export function resolveAuthAccount(identifier: string): StoredAccount | null {
  if (!identifier) return null;
  const normalized = normalizeUserIdentifier(identifier);
  const cleanPhone = identifier.trim().replace(/\D/g, "");
  const accounts = getAuthAccountsVault();

  return accounts.find(a => {
    const aNormEmail = a.email.trim().toLowerCase();
    const aNormPhone = a.phone ? a.phone.trim().replace(/\D/g, "") : "";
    return (
      aNormEmail === normalized ||
      aNormEmail === identifier.trim().toLowerCase() ||
      (cleanPhone.length === 10 && aNormPhone === cleanPhone) ||
      (cleanPhone.length === 10 && aNormEmail.startsWith(cleanPhone))
    );
  }) || null;
}

export async function loginUser(email: string, password: string): Promise<AuthResponse> {
  const normalizedEmail = normalizeUserIdentifier(email);

  // 1. Resolve from shared account resolver
  let localAccount = resolveAuthAccount(email);

  // 2. Try Backend API login
  try {
    const res = await apiClient.post(`${API_URL}/auth/login`, { email: normalizedEmail, password });
    if (res.data?.data?.accessToken) {
      const user = res.data.data.user;
      localStorage.setItem("prisms_token", res.data.data.accessToken);
      if (res.data.data.refreshToken) {
        localStorage.setItem("prisms_refresh_token", res.data.data.refreshToken);
      }
      const authUser: AuthUser = {
        id: user._id || user.id,
        name: user.name,
        email: user.email,
        role: user.role || "farmer",
        phone: user.phone,
        village: user.village,
      };
      localStorage.setItem("prisms_user", JSON.stringify(authUser));

      saveAccountToVault({
        id: authUser.id,
        name: authUser.name,
        email: authUser.email.toLowerCase(),
        phone: authUser.phone,
        password,
        role: authUser.role,
        village: authUser.village,
      });

      return { user: authUser, accessToken: res.data.data.accessToken };
    }
  } catch (err: any) {
    const apiMsg = err?.response?.data?.error?.message || err?.response?.data?.message;
    // If backend returns unauthorized or invalid credentials
    if (apiMsg && (apiMsg.includes("Invalid email or password") || apiMsg.includes("credentials") || err?.response?.status === 401)) {
      if (localAccount) {
        if (localAccount.password !== password) {
          const passErr: any = new Error("Incorrect password. Please try again.");
          passErr.code = "INVALID_PASSWORD";
          throw passErr;
        }
      }
    }
  }

  // 3. Fallback resolve from vault
  if (!localAccount) {
    localAccount = resolveAuthAccount(email);
  }

  if (!localAccount) {
    const err: any = new Error("Account not found. Please create an account.");
    err.code = "ACCOUNT_NOT_FOUND";
    throw err;
  }

  if (localAccount.password !== password) {
    const err: any = new Error("Incorrect password. Please try again.");
    err.code = "INVALID_PASSWORD";
    throw err;
  }

  const authUser: AuthUser = {
    id: localAccount.id,
    name: localAccount.name,
    email: localAccount.email,
    role: localAccount.role,
    phone: localAccount.phone,
    village: localAccount.village,
  };
  const token = `demo_token_${localAccount.id}_${Date.now()}`;
  localStorage.setItem("prisms_token", token);
  localStorage.setItem("prisms_user", JSON.stringify(authUser));

  return { user: authUser, accessToken: token };
}

export async function registerUser(
  name: string,
  email: string,
  password: string,
  role: "farmer" | "buyer" | "fpo" | "advisor" = "farmer"
): Promise<AuthResponse> {
  const normalizedEmail = normalizeUserIdentifier(email);
  const cleanPhone = email.trim().replace(/\D/g, "");

  // 1. Check shared account resolver
  const existingLocal = resolveAuthAccount(email);

  if (existingLocal) {
    const err: any = new Error("An account with this mobile number or email already exists. Please switch to Sign In.");
    err.code = "ACCOUNT_EXISTS";
    err.response = { data: { error: { message: err.message } } };
    throw err;
  }

  // 2. Try Backend API Registration first
  try {
    const res = await apiClient.post(`${API_URL}/auth/register`, { name, email: normalizedEmail, password, role });
    if (res.data?.data?.accessToken) {
      const user = res.data.data.user;
      localStorage.setItem("prisms_token", res.data.data.accessToken);
      if (res.data.data.refreshToken) {
        localStorage.setItem("prisms_refresh_token", res.data.data.refreshToken);
      }
      const authUser: AuthUser = {
        id: user._id || user.id,
        name: user.name,
        email: user.email,
        role: user.role || role,
        phone: user.phone,
        village: user.village,
      };
      localStorage.setItem("prisms_user", JSON.stringify(authUser));

      saveAccountToVault({
        id: authUser.id,
        name: authUser.name,
        email: authUser.email.toLowerCase(),
        phone: cleanPhone.length === 10 ? cleanPhone : undefined,
        password,
        role: authUser.role,
      });

      return { user: authUser, accessToken: res.data.data.accessToken };
    }
  } catch (err: any) {
    const apiMsg = err?.response?.data?.error?.message || err?.response?.data?.message;
    if (apiMsg && (apiMsg.includes("already exists") || apiMsg.includes("CONFLICT") || err?.response?.status === 409)) {
      // Sync account to local vault so Sign In resolves it immediately with entered credentials
      saveAccountToVault({
        id: `user_existing_${Date.now()}`,
        name: name || "Farmer User",
        email: normalizedEmail,
        phone: cleanPhone.length === 10 ? cleanPhone : undefined,
        password,
        role,
      });

      const conflictErr: any = new Error("An account with this mobile number or email already exists. Please switch to Sign In.");
      conflictErr.code = "ACCOUNT_EXISTS";
      conflictErr.response = { data: { error: { message: conflictErr.message } } };
      throw conflictErr;
    }
  }

  // 3. Fallback Local Vault Account Registration
  const newAccount: StoredAccount = {
    id: `user_reg_${Date.now()}`,
    name: name || "Farmer User",
    email: normalizedEmail,
    phone: cleanPhone.length === 10 ? cleanPhone : undefined,
    password,
    role,
  };

  saveAccountToVault(newAccount);

  const authUser: AuthUser = {
    id: newAccount.id,
    name: newAccount.name,
    email: newAccount.email,
    role: newAccount.role,
    phone: newAccount.phone,
  };

  const token = `demo_token_${newAccount.id}_${Date.now()}`;
  localStorage.setItem("prisms_token", token);
  localStorage.setItem("prisms_user", JSON.stringify(authUser));

  return { user: authUser, accessToken: token };
}

export function getCurrentUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem("prisms_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function logoutUser(): void {
  localStorage.removeItem("prisms_token");
  localStorage.removeItem("prisms_refresh_token");
  localStorage.removeItem("prisms_user");
}

export interface CropBatchItem {
  _id: string;
  userId: string;
  cropName: string;
  variety?: string;
  quantityKg: number;
  grade: string;
  targetMandi: string;
  status: "Peak Price" | "Holding (Wait)" | "Standard" | "Sold";
  estimatedRealization: number;
  createdAt: string;
  updatedAt: string;
}

function getAuthHeader() {
  const token = localStorage.getItem("prisms_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchUserCrops(): Promise<CropBatchItem[]> {
  const token = localStorage.getItem("prisms_token");
  if (!token) return [];
  const res = await apiClient.get(`${API_URL}/crops`);
  return res.data.data;
}

export async function createUserCrop(data: {
  cropName: string;
  variety?: string;
  quantityKg: number;
  grade?: string;
  targetMandi?: string;
  status?: string;
  estimatedRealization?: number;
}): Promise<CropBatchItem> {
  const res = await apiClient.post(`${API_URL}/crops`, data);
  return res.data.data;
}

export async function updateUserCrop(id: string, data: Partial<CropBatchItem>): Promise<CropBatchItem> {
  const res = await apiClient.patch(`${API_URL}/crops/${id}`, data);
  return res.data.data;
}

export async function deleteUserCrop(id: string): Promise<void> {
  await apiClient.delete(`${API_URL}/crops/${id}`);
}

export async function updateUserProfile(data: {
  name?: string;
  phone?: string;
  village?: string;
  district?: string;
  landholdingAcres?: number;
}): Promise<AuthUser> {
  const res = await apiClient.patch(`${API_URL}/users/me`, data);
  const updatedUser = res.data.data;
  localStorage.setItem("prisms_user", JSON.stringify(updatedUser));
  return updatedUser;
}

export interface Buyer {
  _id?: string;
  buyerId: string;
  businessName: string;
  buyerType: 'Processor' | 'Wholesaler' | 'Institutional Buyer' | 'Retail Chain' | 'Exporter' | 'FPO Aggregator';
  location: string;
  district: string;
  state: string;
  cropsInterested: string[];
  preferredGrades: string[];
  minQuantityQtl: number;
  maxQuantityQtl: number;
  targetPriceMin: number;
  targetPriceMax: number;
  deliveryPreference: string;
  paymentTerms: string;
  verificationStatus: string;
  isDemo: boolean;
  description?: string;
  contactPhone?: string;
  contactEmail?: string;
}

export interface BuyerDemand {
  _id?: string;
  demandId?: string;
  buyerId: string;
  commodity: string;
  variety?: string;
  requiredGrade?: string;
  targetGrade?: string;
  minQuantityQtl?: number;
  maxQuantityQtl?: number;
  quantityRequiredQtl?: number;
  targetPriceMin: number;
  targetPriceMax: number;
  preferredDistricts?: string[];
  deliveryPreference?: string;
  deliveryLocation?: string;
  urgency?: string;
  demandStatus?: 'ACTIVE' | 'PAUSED' | 'EXPIRED' | 'FULFILLED' | 'OPEN' | string;
  status?: string;
  validUntil?: string;
  isDemo?: boolean;
  notes?: string;
  createdAt?: string;
  buyer?: Partial<Buyer>;
}

export interface TradeLot {
  _id: string;
  lotId: string;
  userId: string;
  cropBatchId?: string;
  cropName: string;
  variety: string;
  grade: string;
  provisionalGrade?: string;
  quantityQtl: number;
  qualityScore?: number;
  evidenceConfidence?: number;
  qualityAssessmentId?: string;
  qualityPassport?: any;
  origin: string;
  district?: string;
  targetMarket?: string;
  expectedPricePerQtl: number;
  minimumAcceptablePrice: number;
  buyerVisibility: 'PUBLIC' | 'MATCHED_BUYERS_ONLY' | 'PRIVATE';
  lotStatus: 'DRAFT' | 'READY' | 'PUBLISHED' | 'MATCHED' | 'OFFERED' | 'ACCEPTED' | 'CLOSED';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QualityQuestionOption {
  value: string;
  label: string;
  score: number;
}

export interface QualityQuestionConfig {
  id: string;
  parameterId: string;
  section: string;
  questionText: string;
  helpText?: string;
  inputType: 'SELECT' | 'NUMBER' | 'PERCENTAGE' | 'RADIO';
  options?: QualityQuestionOption[];
  min?: number;
  max?: number;
  unit?: string;
  required: boolean;
  defaultEvidenceSource?: string;
}

export interface QualityParameterConfig {
  parameterId: string;
  name: string;
  unit: string;
  weight: number;
  critical: boolean;
  criticalThreshold?: number;
  criticalMessage?: string;
  allowedEvidenceSources: string[];
}

export interface CropQualityQuestionsResponse {
  cropName: string;
  parameters: QualityParameterConfig[];
  questions: QualityQuestionConfig[];
  gradeRules: Array<{
    grade: string;
    minScore: number;
    maxScore: number;
    description: string;
  }>;
}

export interface QualityAssessmentAnswer {
  questionId: string;
  parameterId: string;
  value: any;
  evidenceSource?: string;
}

export interface QualityAssessmentResult {
  _id?: string;
  assessmentId: string;
  farmerId?: string;
  lotId?: string;
  cropName: string;
  variety?: string;
  qualityScore: number;
  provisionalGrade: string;
  evidenceConfidence: number;
  criticalFlags: string[];
  positiveFactors: string[];
  riskFactors: string[];
  parameterScores?: Record<string, any>;
  passportSummary: {
    crop: string;
    provisionalGrade: string;
    qualityScore: number;
    evidenceConfidence: number;
    parametersList?: Array<{ name: string; value: string | number; unit: string; score: number }>;
    bulbSize?: string;
    rotPercent?: number;
    sproutingPercent?: number;
    cutsPercent?: number;
    neckDrying?: string;
    firmness?: string;
    skinCondition?: string;
    foreignMatterPercent?: number;
    storageCondition?: string;
    verificationStatus: string;
    disclaimer: string;
    [key: string]: any;
  };
  isProvisional?: boolean;
  createdAt?: string;
}

export interface BuyerMatchResult {
  buyer: {
    buyerId: string;
    businessName: string;
    buyerType: string;
    location: string;
    district: string;
    verificationStatus: string;
    isDemo: boolean;
    contactPhone?: string;
    contactEmail?: string;
  };
  demand: {
    demandId: string;
    commodity: string;
    variety?: string;
    requiredGrade: string;
    minQuantityQtl: number;
    maxQuantityQtl: number;
    targetPriceMin: number;
    targetPriceMax: number;
    deliveryLocation: string;
  };
  matchScore: number;
  scoringBreakdown: {
    cropScore: number;
    gradeScore: number;
    quantityScore: number;
    priceScore: number;
    locationScore: number;
    varietyScore: number;
  };
  reasons: string[];
  warnings: string[];
  quotedPricePerQtl: number;
  grossRevenue: number;
  estimatedTransportCost: number;
  estimatedHandlingFee: number;
  estimatedSpoilageCost: number;
  estimatedNetRealization: number;
  estimatedNetPerQtl: number;
  distanceKm: number;
}

export interface RankedMarket {
  marketId: string;
  marketName: string;
  district: string;
  distanceKm: number;
  modalPrice: number;
  arrivalVolume: number;
  transportCost: number;
  labourCost: number;
  spoilageCost: number;
  marketHandlingCharges: number;
  estimatedLogisticsCost: number;
  estimatedGrossRevenue: number;
  estimatedNetRealization: number;
  estimatedNetPerQtl: number;
  rank: number;
  source: string;
}

export interface ComparativeDecision {
  recommendedChannel: 'BUYER' | 'MANDI';
  lotId: string;
  lotCommodity: string;
  lotQuantityQtl: number;
  bestBuyerMatch: BuyerMatchResult | null;
  bestMandi: {
    mandiName: string;
    district: string;
    modalPricePerQtl: number;
    grossRevenue: number;
    estimatedLogisticsCost: number;
    estimatedNetRealization: number;
    estimatedNetPerQtl: number;
    distanceKm: number;
  } | null;
  rankedMarkets?: RankedMarket[];
  takeHomeDifference: number;
  recommendationExplanation: string;
}

export async function fetchRankedMarketsApi(params: {
  cropName: string;
  origin?: string;
  district?: string;
  farmerLat?: number;
  farmerLng?: number;
  quantityQtl?: number;
  grade?: string;
  vehicle?: string;
  transportRatePerKm?: number;
  labourPerTrip?: number;
  isColdChain?: boolean;
}): Promise<RankedMarket[]> {
  try {
    const res = await apiClient.post(`${API_URL}/markets/ranked`, params);
    return res.data?.data || [];
  } catch (error) {
    console.error("Error fetching ranked markets", error);
    return [];
  }
}

export async function fetchBuyers(params?: { commodity?: string; district?: string; buyerType?: string; grade?: string }): Promise<Buyer[]> {
  try {
    const res = await apiClient.get(`${API_URL}/buyers`, { params });
    return res.data.data;
  } catch (error) {
    console.error("Error fetching buyers", error);
    return [];
  }
}

export async function fetchBuyerDemands(params?: { commodity?: string; buyerId?: string }): Promise<BuyerDemand[]> {
  try {
    const res = await apiClient.get(`${API_URL}/buyers/demands`, { params });
    return res.data?.data || [];
  } catch (error) {
    console.error("Error fetching buyer demands", error);
    return [];
  }
}

export async function createBuyerDemandApi(data: Partial<BuyerDemand>): Promise<BuyerDemand> {
  const res = await apiClient.post(`${API_URL}/buyers/demands`, data);
  return res.data?.data;
}

export async function fetchUserLots(): Promise<TradeLot[]> {
  const activeUser = getCurrentUser();
  const activeUserId = activeUser?.id || activeUser?.email || "user_demo_001";

  const token = localStorage.getItem("prisms_token");
  if (token && !token.startsWith("demo_token_")) {
    try {
      const res = await apiClient.get(`${API_URL}/lots`);
      if (res.data?.data && Array.isArray(res.data.data)) {
        return res.data.data;
      }
    } catch (error) {
      console.error("Error fetching user trade lots from API", error);
    }
  }

  // Load persistent local demo lots when API is unauthenticated or in demo mode
  const rawDemo = localStorage.getItem("prisms_demo_lots_list");
  let localLots: TradeLot[] = [];
  if (rawDemo) {
    try {
      localLots = JSON.parse(rawDemo);
    } catch {}
  } else {
    localLots = [
      {
        _id: "demo_lot_71",
        lotId: "LOT-2026-0071",
        userId: "user_demo_001",
        cropName: "Red Onion",
        variety: "Garwa",
        grade: "Grade A",
        quantityQtl: 30,
        expectedPricePerQtl: 3000,
        minimumAcceptablePrice: 2600,
        qualityScore: 88,
        origin: "Farm Gate",
        district: "Nashik",
        lotStatus: "PUBLISHED",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    ];
    localStorage.setItem("prisms_demo_lots_list", JSON.stringify(localLots));
  }

  // User-Scoped Trade Lot Filtering
  const isDefaultDemoAccount =
    activeUserId === "user_demo_001" ||
    activeUser?.email === "farmer.lasalgaon@prisms.gov.in" ||
    activeUserId === "farmer.lasalgaon@prisms.gov.in" ||
    !activeUser;

  if (isDefaultDemoAccount) {
    return localLots.filter(l => 
      !l.userId || 
      l.userId === "user_demo_001" || 
      l.userId === "demo_user" || 
      l.userId === "farmer.lasalgaon@prisms.gov.in"
    );
  }

  return localLots.filter(l => 
    l.userId === activeUserId || 
    (activeUser?.email && l.userId === activeUser.email)
  );
}

export async function createTradeLot(data: {
  cropBatchId?: string;
  cropName: string;
  variety?: string;
  grade?: string;
  provisionalGrade?: string;
  quantityQtl: number;
  qualityScore?: number;
  evidenceConfidence?: number;
  qualityAssessmentId?: string;
  qualityPassport?: any;
  origin?: string;
  district?: string;
  expectedPricePerQtl: number;
  minimumAcceptablePrice?: number;
}): Promise<TradeLot> {
  const activeUser = getCurrentUser();
  const activeUserId = activeUser?.id || activeUser?.email || "user_demo_001";

  const token = localStorage.getItem("prisms_token");
  if (token && !token.startsWith("demo_token_")) {
    try {
      const res = await apiClient.post(`${API_URL}/lots`, data);
      if (res.data?.data) {
        return res.data.data;
      }
    } catch (err: any) {
      console.error("Error creating trade lot via API", err);
      if (err.response?.data?.error?.message) {
        throw new Error(err.response.data.error.message);
      }
    }
  }

  // Demo / Offline Mode Creation
  const rawDemo = localStorage.getItem("prisms_demo_lots_list");
  let demoLots: TradeLot[] = [];
  if (rawDemo) {
    try { demoLots = JSON.parse(rawDemo); } catch {}
  } else {
    demoLots = [
      {
        _id: "demo_lot_71",
        lotId: "LOT-2026-0071",
        userId: "user_demo_001",
        cropName: "Red Onion",
        variety: "Garwa",
        grade: "Grade A",
        quantityQtl: 30,
        expectedPricePerQtl: 3000,
        minimumAcceptablePrice: 2600,
        qualityScore: 88,
        origin: "Farm Gate",
        district: "Nashik",
        lotStatus: "PUBLISHED",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    ];
  }

  // Deduplication check: prevent rapid duplicate creation within 3 seconds for the SAME user
  const now = Date.now();
  const existingDup = demoLots.find(l => 
    l.userId === activeUserId &&
    l.cropName === data.cropName && 
    l.quantityQtl === Number(data.quantityQtl) && 
    (now - new Date(l.createdAt).getTime()) < 3000
  );
  if (existingDup) {
    return existingDup;
  }

  const nextCount = demoLots.length + 80;
  const countHex = nextCount.toString().padStart(4, '0');
  const newLotId = `LOT-2026-${countHex}`;

  const newLot: TradeLot = {
    _id: `lot_local_${now}`,
    lotId: newLotId,
    userId: activeUserId,
    cropName: data.cropName,
    variety: data.variety || "Standard",
    grade: data.grade || "Grade A",
    quantityQtl: Number(data.quantityQtl),
    expectedPricePerQtl: Number(data.expectedPricePerQtl),
    minimumAcceptablePrice: Number(data.minimumAcceptablePrice) || Math.round(Number(data.expectedPricePerQtl) * 0.9),
    qualityScore: data.qualityScore || 85,
    origin: data.origin || "Farm Gate",
    district: data.district || "Nashik",
    lotStatus: "PUBLISHED",
    createdAt: new Date(now).toISOString(),
    updatedAt: new Date(now).toISOString(),
  };

  demoLots.unshift(newLot);
  localStorage.setItem("prisms_demo_lots_list", JSON.stringify(demoLots));
  return newLot;
}

export async function deleteTradeLot(targetLotId: string): Promise<boolean> {
  if (!targetLotId) return false;

  const targetIdsToClean = new Set<string>([targetLotId]);

  // 1. Clean up prisms_demo_lots_list
  const rawDemo = localStorage.getItem("prisms_demo_lots_list");
  if (rawDemo) {
    try {
      let demoLots: TradeLot[] = JSON.parse(rawDemo);
      const targetLot = demoLots.find(l => l.lotId === targetLotId || l._id === targetLotId);
      if (targetLot) {
        if (targetLot.lotId) targetIdsToClean.add(targetLot.lotId);
        if (targetLot._id) targetIdsToClean.add(targetLot._id);
      }
      demoLots = demoLots.filter(l => l.lotId !== targetLotId && l._id !== targetLotId);
      localStorage.setItem("prisms_demo_lots_list", JSON.stringify(demoLots));
    } catch (err) {
      console.error("Error cleaning demo lots list on delete", err);
    }
  }

  // 2. Clean up prisms_demo_accepted_offers
  const rawAccepted = localStorage.getItem("prisms_demo_accepted_offers");
  if (rawAccepted) {
    try {
      const acceptedMap: Record<string, string> = JSON.parse(rawAccepted);
      targetIdsToClean.forEach(id => {
        delete acceptedMap[id];
      });
      localStorage.setItem("prisms_demo_accepted_offers", JSON.stringify(acceptedMap));
    } catch (err) {
      console.error("Error cleaning demo accepted offers on delete", err);
    }
  }

  // 3. Clean up prisms_demo_deliveries
  const rawDeliveries = localStorage.getItem("prisms_demo_deliveries");
  if (rawDeliveries) {
    try {
      let deliveries: DeliveryOrder[] = JSON.parse(rawDeliveries);
      deliveries = deliveries.filter(d => !targetIdsToClean.has(d.lotId));
      localStorage.setItem("prisms_demo_deliveries", JSON.stringify(deliveries));
    } catch (err) {
      console.error("Error cleaning demo deliveries on delete", err);
    }
  }

  // 4. Clean up prisms_demo_payments
  const rawPayments = localStorage.getItem("prisms_demo_payments");
  if (rawPayments) {
    try {
      let payments: PaymentLedger[] = JSON.parse(rawPayments);
      payments = payments.filter(p => !targetIdsToClean.has(p.lotId));
      localStorage.setItem("prisms_demo_payments", JSON.stringify(payments));
    } catch (err) {
      console.error("Error cleaning demo payments on delete", err);
    }
  }

  // 5. Clean up prisms_demo_transactions
  const rawTransactions = localStorage.getItem("prisms_demo_transactions");
  if (rawTransactions) {
    try {
      let txns: TransactionItem[] = JSON.parse(rawTransactions);
      txns = txns.filter(t => !targetIdsToClean.has(t.lotId));
      localStorage.setItem("prisms_demo_transactions", JSON.stringify(txns));
    } catch (err) {
      console.error("Error cleaning demo transactions on delete", err);
    }
  }

  // 6. Delete from backend API if token exists
  const token = localStorage.getItem("prisms_token");
  if (token) {
    try {
      await apiClient.delete(`${API_URL}/lots/${targetLotId}`);
    } catch (err) {
      console.error("API error deleting trade lot", err);
    }
  }

  return true;
}

export async function fetchLotMatches(lotId: string, lotObj?: TradeLot): Promise<ComparativeDecision | null> {
  const token = localStorage.getItem("prisms_token");
  if (token) {
    try {
      const res = await apiClient.get(`${API_URL}/lots/${lotId}/matches`);
      if (res.data?.data) return res.data.data;
    } catch (error) {
      console.error("Error fetching lot matches", error);
    }
  }

  // Fallback using the authoritative market ranking API
  const crop = lotObj?.cropName || 'Red Onion';
  const qty = lotObj?.quantityQtl || 30;
  const origin = lotObj?.origin || 'Farm Gate, Niphad';
  const district = lotObj?.district || 'Nashik';

  const rankedMarkets = await fetchRankedMarketsApi({
    cropName: crop,
    origin,
    district,
    quantityQtl: qty,
    grade: lotObj?.grade || 'Grade A',
  });

  const bestMandi = rankedMarkets.length > 0 ? {
    mandiName: rankedMarkets[0].marketName,
    district: rankedMarkets[0].district,
    modalPricePerQtl: rankedMarkets[0].modalPrice,
    grossRevenue: rankedMarkets[0].estimatedGrossRevenue,
    estimatedLogisticsCost: rankedMarkets[0].estimatedLogisticsCost,
    estimatedNetRealization: rankedMarkets[0].estimatedNetRealization,
    estimatedNetPerQtl: rankedMarkets[0].estimatedNetPerQtl,
    distanceKm: rankedMarkets[0].distanceKm,
  } : null;

  const basePrice = lotObj?.expectedPricePerQtl || (bestMandi ? bestMandi.modalPricePerQtl : 3000);
  const quotedPrice = Math.round(basePrice * 1.05);
  const gross = quotedPrice * qty;
  const transport = Math.round(qty * 35);
  const handling = Math.round(gross * 0.005);
  const spoilage = Math.round(gross * 0.01);
  const net = gross - transport - handling - spoilage;

  const bestBuyerMatch = {
    buyer: {
      buyerId: 'DEMO-BUYER-01',
      businessName: 'Nashik Agro Processors Ltd.',
      buyerType: 'Processor',
      location: 'Pimpalgaon, Nashik',
      district: 'Nashik',
      verificationStatus: 'VERIFIED',
      isDemo: true,
    },
    demand: {
      demandId: 'DEMO-DEM-01',
      commodity: crop,
      requiredGrade: lotObj?.grade || 'Grade A',
      minQuantityQtl: 10,
      maxQuantityQtl: 500,
      targetPriceMin: basePrice,
      targetPriceMax: Math.round(basePrice * 1.15),
      deliveryLocation: 'Buyer Depot, Nashik',
    },
    matchScore: 94,
    scoringBreakdown: { cropScore: 30, gradeScore: 20, quantityScore: 20, priceScore: 15, locationScore: 4, varietyScore: 5 },
    reasons: [
      `✓ Commodity matches ${crop}`,
      `✓ Quality grade ${lotObj?.grade || 'Grade A'} matches buyer requirement`,
      `✓ Quoted price (₹${quotedPrice}/Qtl) meets minimum target`,
    ],
    warnings: [],
    quotedPricePerQtl: quotedPrice,
    grossRevenue: gross,
    estimatedTransportCost: transport,
    estimatedHandlingFee: handling,
    estimatedSpoilageCost: spoilage,
    estimatedNetRealization: net,
    estimatedNetPerQtl: Math.round(net / qty),
    distanceKm: 25,
  };

  const diff = bestMandi ? net - bestMandi.estimatedNetRealization : 0;
  const takeHomeDifference = Math.abs(diff);
  let recommendationExplanation = '';
  let recommendedChannel: 'BUYER' | 'MANDI' = 'BUYER';

  if (bestBuyerMatch && bestMandi) {
    if (diff >= 0) {
      recommendedChannel = 'BUYER';
      recommendationExplanation = `Selling to ${bestBuyerMatch.buyer.businessName} yields ₹${takeHomeDifference.toLocaleString('en-IN')} higher net take-home pay than ${bestMandi.mandiName} due to reduced transit handling and direct delivery terms.`;
    } else {
      recommendedChannel = 'MANDI';
      recommendationExplanation = `Selling at ${bestMandi.mandiName} yields ₹${takeHomeDifference.toLocaleString('en-IN')} higher net realization than buyer options due to competitive APMC auction demand.`;
    }
  } else if (bestBuyerMatch) {
    recommendationExplanation = `Selling to ${bestBuyerMatch.buyer.businessName} provides an estimated net realization of ₹${net.toLocaleString('en-IN')}.`;
  } else if (bestMandi) {
    recommendedChannel = 'MANDI';
    recommendationExplanation = `Top APMC Mandi (${bestMandi.mandiName}) offers an estimated net realization of ₹${bestMandi.estimatedNetRealization.toLocaleString('en-IN')}.`;
  } else {
    recommendationExplanation = `No active market price data or buyer bids available.`;
  }

  return {
    recommendedChannel,
    lotId: lotObj?.lotId || lotId,
    lotCommodity: crop,
    lotQuantityQtl: qty,
    bestBuyerMatch,
    bestMandi,
    rankedMarkets,
    takeHomeDifference,
    recommendationExplanation,
  };
}

export async function fetchMarketplaceLotsApi(): Promise<TradeLot[]> {
  const token = localStorage.getItem("prisms_token");
  if (!token) return [];
  try {
    const res = await apiClient.get(`${API_URL}/lots/marketplace`);
    return res.data?.data || [];
  } catch (error) {
    console.error("Error fetching marketplace lots", error);
    return [];
  }
}

export async function fetchQualityQuestionsApi(crop: string): Promise<CropQualityQuestionsResponse | null> {
  try {
    const res = await apiClient.get(`${API_URL}/quality/crops/${encodeURIComponent(crop)}/questions`);
    return res.data?.data || null;
  } catch (error) {
    console.error("Error fetching quality questions", error);
    return null;
  }
}

export async function submitQualityAssessmentApi(payload: {
  cropName: string;
  variety?: string;
  answers: QualityAssessmentAnswer[];
  cropBatchId?: string;
  lotId?: string;
}): Promise<QualityAssessmentResult | null> {
  try {
    const res = await apiClient.post(`${API_URL}/quality/assessments`, payload);
    return res.data?.data || null;
  } catch (error) {
    console.error("Error submitting quality assessment", error);
    return null;
  }
}

export async function fetchQualityAssessmentApi(id: string): Promise<QualityAssessmentResult | null> {
  try {
    const res = await apiClient.get(`${API_URL}/quality/assessments/${encodeURIComponent(id)}`);
    return res.data?.data || null;
  } catch (error) {
    console.error("Error fetching quality assessment", error);
    return null;
  }
}

export interface Offer {
  _id: string;
  offerId: string;
  lotId: string;
  buyerId: string;
  sellerUserId: string;
  commodity: string;
  variety: string;
  grade: string;
  quantityQtl: number;
  pricePerQtl: number;
  grossValue: number;
  estimatedTransportCost: number;
  estimatedLabourCost: number;
  estimatedSpoilage: number;
  estimatedMarketHandlingCharges: number;
  estimatedNetRealization: number;
  paymentTerms: string;
  deliveryTerms: string;
  pickupLocation: string;
  deliveryLocation: string;
  expiresAt: string;
  offerStatus: 'PENDING' | 'COUNTERED' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'WITHDRAWN';
  counterPricePerQtl?: number;
  counterQuantityQtl?: number;
  counterMessage?: string;
  counterBy?: 'FARMER' | 'BUYER';
  isDemo: boolean;
  createdAt: string;
  updatedAt: string;
  buyer?: Partial<Buyer>;
}

export interface DeliveryTimelineEvent {
  status: string;
  label: string;
  timestamp: string;
}

export interface DeliveryOrder {
  _id: string;
  deliveryId: string;
  lotId: string;
  offerId: string;
  farmerId: string;
  buyerId: string;
  crop?: string;
  agreedPricePerQtl?: number;
  vehicleType: string;
  quantityQtl: number;
  origin: string;
  destination: string;
  plannedPickupDate: string;
  expectedDeliveryDate: string;
  actualDeliveryDate?: string;
  deliveryStatus: 'OFFER_ACCEPTED_PLANNED' | 'PLANNED' | 'PICKUP_READY' | 'DISPATCHED' | 'IN_TRANSIT' | 'DELIVERED' | 'DELAYED' | 'CANCELLED';
  timeline?: DeliveryTimelineEvent[];
  freightRate?: string;
  estimatedFreight?: number;
  notes?: string;
  isDemo: boolean;
  createdAt: string;
  updatedAt?: string;
  buyer?: Partial<Buyer>;
}

export interface PaymentLedger {
  _id: string;
  paymentId: string;
  transactionId: string;
  lotId: string;
  offerId: string;
  farmerId: string;
  buyerId: string;
  crop?: string;
  quantityQtl?: number;
  agreedPricePerQtl?: number;
  grossAmount: number;
  deductions: number;
  netPayable: number;
  paymentMode: 'DEMO_BANK_TRANSFER' | 'DEMO_UPI' | 'DEMO_CASH';
  dueDate: string;
  paidDate?: string;
  paymentStatus: 'PENDING' | 'PARTIAL' | 'PAID' | 'RELEASED' | 'OVERDUE' | 'DISPUTED' | 'CANCELLED';
  referenceId: string;
  notes?: string;
  isDemo: boolean;
  createdAt: string;
  buyer?: Partial<Buyer>;
}

export interface TransactionItem {
  _id: string;
  transactionId: string;
  lotId: string;
  offerId: string;
  deliveryId?: string;
  paymentId?: string;
  farmerId: string;
  buyerId: string;
  crop: string;
  variety: string;
  grade: string;
  quantityQtl: number;
  agreedPricePerQtl: number;
  grossAmount: number;
  totalDeductions: number;
  finalNetAmount: number;
  transactionStatus: 'INITIATED' | 'OFFER_ACCEPTED' | 'IN_DELIVERY' | 'DELIVERED' | 'PAYMENT_PENDING' | 'COMPLETED' | 'DISPUTED' | 'CANCELLED';
  completedAt?: string;
  isDemo: boolean;
  createdAt: string;
  buyer?: Partial<Buyer>;
}

export interface GrievanceItem {
  _id: string;
  grievanceId: string;
  transactionId?: string;
  lotId?: string;
  raisedBy: string;
  buyerId?: string;
  category: 'PRICE_DISPUTE' | 'QUANTITY_MISMATCH' | 'QUALITY_DISPUTE' | 'DELIVERY_DELAY' | 'PAYMENT_DELAY' | 'BUYER_ISSUE' | 'LOGISTICS_ISSUE' | 'OTHER';
  description: string;
  evidence?: string[];
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'REJECTED' | 'ESCALATED' | 'CLOSED';
  assignedTo?: string;
  resolutionNote?: string;
  isDemo: boolean;
  createdAt: string;
}

export async function fetchOffersForLot(lotId: string): Promise<Offer[]> {
  const token = localStorage.getItem("prisms_token");
  if (!token) return [];
  const res = await apiClient.get(`${API_URL}/offers/lot/${lotId}`);
  return res.data.data;
}

export async function fetchUserOffers(): Promise<Offer[]> {
  const token = localStorage.getItem("prisms_token");
  if (!token) return [];
  try {
    const res = await apiClient.get(`${API_URL}/offers`);
    return res.data.data;
  } catch (error) {
    console.error("Error fetching user offers", error);
    return [];
  }
}

export async function acceptOfferApi(offerId: string): Promise<{ offer: Offer; transaction: TransactionItem }> {
  const res = await apiClient.post(`${API_URL}/offers/${offerId}/accept`, {});
  return res.data.data;
}

export async function rejectOfferApi(offerId: string): Promise<Offer> {
  const res = await apiClient.post(`${API_URL}/offers/${offerId}/reject`, {});
  return res.data.data;
}

export async function counterOfferApi(offerId: string, counterPricePerQtl: number, message?: string): Promise<Offer> {
  const res = await apiClient.post(`${API_URL}/offers/${offerId}/counter`, { counterPricePerQtl, message });
  return res.data.data;
}

export async function createOfferApi(data: {
  lotId: string;
  pricePerQtl: number;
  quantityQtl?: number;
  paymentTerms?: string;
  deliveryTerms?: string;
  message?: string;
}): Promise<Offer> {
  const res = await apiClient.post(`${API_URL}/offers`, data);
  return res.data.data;
}

export function getAcceptedOfferForLot(lotId: string): string | null {
  if (!lotId || typeof lotId !== "string" || !lotId.trim()) return null;
  const rawAccepted = localStorage.getItem("prisms_demo_accepted_offers");
  if (rawAccepted) {
    try {
      const map: Record<string, string> = JSON.parse(rawAccepted);
      if (map[lotId]) return map[lotId];
    } catch {}
  }
  const rawTxns = localStorage.getItem("prisms_demo_transactions");
  if (rawTxns) {
    try {
      const txns: TransactionItem[] = JSON.parse(rawTxns);
      const found = txns.find(t => Boolean(t.lotId) && t.lotId === lotId);
      if (found && found.offerId) return found.offerId;
    } catch {}
  }
  const rawDlv = localStorage.getItem("prisms_demo_deliveries");
  if (rawDlv) {
    try {
      const dlvs: DeliveryOrder[] = JSON.parse(rawDlv);
      const found = dlvs.find(d => Boolean(d.lotId) && d.lotId === lotId);
      if (found && found.offerId) return found.offerId;
    } catch {}
  }
  return null;
}

export function recordOfferAcceptance(offer: Offer & { isDemo?: boolean }, lot: TradeLot) {
  if (!offer || !lot) return;
  const offerId = offer.offerId || offer._id;
  const lotId = lot.lotId || lot._id;
  const crop = offer.commodity || lot.cropName || "Produce";
  const buyerName = offer.buyer?.businessName || offer.buyerId || "Matched Buyer";

  // 0. Persist accepted offer map in localStorage
  const rawAccepted = localStorage.getItem("prisms_demo_accepted_offers");
  const acceptedMap: Record<string, string> = rawAccepted ? JSON.parse(rawAccepted) : {};
  if (lot._id) acceptedMap[lot._id] = offerId;
  if (lot.lotId) acceptedMap[lot.lotId] = offerId;
  if (offer._id) acceptedMap[offer._id] = offerId;
  if (offer.offerId) acceptedMap[offer.offerId] = offerId;
  localStorage.setItem("prisms_demo_accepted_offers", JSON.stringify(acceptedMap));

  // 1. Save Demo Delivery Order (Idempotent: avoid duplicate)
  const rawDeliveries = localStorage.getItem("prisms_demo_deliveries");
  const deliveries: DeliveryOrder[] = rawDeliveries ? JSON.parse(rawDeliveries) : [];
  const existingDelivery = deliveries.find(d => 
    (d.offerId && (d.offerId === offer._id || d.offerId === offer.offerId)) || 
    (d.lotId && (d.lotId === lot._id || d.lotId === lot.lotId))
  );

  const agreedPrice = offer.counterPricePerQtl || offer.pricePerQtl || lot.expectedPricePerQtl || 3200;
  const destText = offer.deliveryLocation 
    ? `Buyer Pickup • ${buyerName} • ${offer.deliveryLocation}` 
    : `Buyer Pickup • ${buyerName}`;

  const activeUser = getCurrentUser();
  const activeUserId = activeUser?.id || activeUser?.email || lot.userId || "user_demo_001";

  if (!existingDelivery) {
    const dlvId = `DLV-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const nowIso = new Date().toISOString();
    const newDelivery: DeliveryOrder = {
      _id: `dlv_${offerId}`,
      deliveryId: dlvId,
      lotId: lot._id || lotId,
      offerId: offer._id || offerId,
      farmerId: activeUserId,
      buyerId: offer.buyerId,
      crop: crop,
      agreedPricePerQtl: agreedPrice,
      vehicleType: "Medium Pickup (Bolero MaxiTruck)",
      quantityQtl: offer.quantityQtl || lot.quantityQtl || 30,
      origin: lot.origin || "Farm Gate",
      destination: destText,
      plannedPickupDate: nowIso,
      expectedDeliveryDate: new Date(Date.now() + 86400000).toISOString(),
      deliveryStatus: "OFFER_ACCEPTED_PLANNED",
      timeline: [
        { status: "OFFER_ACCEPTED_PLANNED", label: "Offer Accepted & Planned", timestamp: nowIso }
      ],
      freightRate: "₹1.35/km/Qtl",
      estimatedFreight: Math.round(1.35 * 35 * (offer.quantityQtl || lot.quantityQtl || 30)),
      notes: `Demo Delivery for ${buyerName} • Lot ${lotId}`,
      createdAt: nowIso,
      updatedAt: nowIso,
      isDemo: true,
      buyer: offer.buyer,
    };
    deliveries.unshift(newDelivery);
    localStorage.setItem("prisms_demo_deliveries", JSON.stringify(deliveries));
  }

  // 2. Save Demo Payment Ledger (Idempotent: avoid duplicate)
  const rawPayments = localStorage.getItem("prisms_demo_payments");
  const payments: PaymentLedger[] = rawPayments ? JSON.parse(rawPayments) : [];
  const existingPayment = payments.find(p => p.offerId === offer._id || p.offerId === offer.offerId || (p.lotId === lot._id || p.lotId === lot.lotId));
  if (!existingPayment) {
    const payId = `PAY-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const deductionsVal = (offer.grossValue || 0) - (offer.estimatedNetRealization || 0);
    const newPayment: PaymentLedger = {
      _id: `pay_${offerId}`,
      paymentId: payId,
      transactionId: `TXN-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      lotId: lot._id || lotId,
      offerId: offer._id || offerId,
      farmerId: activeUserId,
      buyerId: offer.buyerId,
      grossAmount: offer.grossValue || 0,
      deductions: deductionsVal,
      netPayable: offer.estimatedNetRealization || 0,
      paymentMode: "DEMO_BANK_TRANSFER",
      dueDate: new Date(Date.now() + 86400000 * 2).toISOString(),
      paymentStatus: "PENDING",
      referenceId: `REF-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      notes: `Simulated Sandbox Payment for ${buyerName} • Lot ${lotId}`,
      createdAt: new Date().toISOString(),
      isDemo: true,
      buyer: offer.buyer,
    };
    payments.unshift(newPayment);
    localStorage.setItem("prisms_demo_payments", JSON.stringify(payments));
  }

  // 3. Save Demo Transaction Record (Idempotent: avoid duplicate)
  const rawTxns = localStorage.getItem("prisms_demo_transactions");
  const txns: TransactionItem[] = rawTxns ? JSON.parse(rawTxns) : [];
  const existingTxn = txns.find(t => t.offerId === offer._id || t.offerId === offer.offerId || (t.lotId === lot._id || t.lotId === lot.lotId));
  if (!existingTxn) {
    const txnId = `TXN-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newTxn: TransactionItem = {
      _id: `txn_${offerId}`,
      transactionId: txnId,
      lotId: lot._id || lotId,
      offerId: offer._id || offerId,
      farmerId: activeUserId,
      buyerId: offer.buyerId,
      crop,
      variety: offer.variety || "Standard",
      grade: offer.grade || "Grade A",
      quantityQtl: offer.quantityQtl,
      agreedPricePerQtl: offer.pricePerQtl,
      grossAmount: offer.grossValue,
      totalDeductions: offer.grossValue - offer.estimatedNetRealization,
      finalNetAmount: offer.estimatedNetRealization,
      transactionStatus: "OFFER_ACCEPTED",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDemo: true,
      buyer: offer.buyer,
    };
    txns.unshift(newTxn);
    localStorage.setItem("prisms_demo_transactions", JSON.stringify(txns));
  }
}

function isRecordOwnedByUser(recordFarmerId: any, activeUserId: string, activeUserEmail?: string): boolean {
  const rId = recordFarmerId ? String(recordFarmerId).trim().toLowerCase() : "";
  const aId = activeUserId ? String(activeUserId).trim().toLowerCase() : "";
  const aEmail = activeUserEmail ? String(activeUserEmail).trim().toLowerCase() : "";

  const isDefaultDemoAccount =
    aId === "user_demo_001" ||
    aEmail === "farmer.lasalgaon@prisms.gov.in" ||
    aId === "farmer.lasalgaon@prisms.gov.in" ||
    aId === "";

  if (isDefaultDemoAccount) {
    return (
      rId === "user_demo_001" ||
      rId === "demo_user" ||
      rId === "farmer.lasalgaon@prisms.gov.in" ||
      rId === "" ||
      !recordFarmerId
    );
  }

  return rId === aId || (Boolean(aEmail) && rId === aEmail);
}

export function getAuthMode(): 'BACKEND' | 'DEMO' {
  const token = localStorage.getItem("prisms_token");
  if (token && !token.startsWith("demo_token_")) {
    return 'BACKEND';
  }
  return 'DEMO';
}

export async function fetchUserDeliveries(): Promise<DeliveryOrder[]> {
  const activeUser = getCurrentUser();
  const activeUserId = activeUser?.id || "user_demo_001";
  const activeUserEmail = activeUser?.email;

  const isBackendMode = getAuthMode() === "BACKEND";

  let apiDeliveries: DeliveryOrder[] = [];
  if (isBackendMode) {
    try {
      const res = await apiClient.get(`${API_URL}/deliveries`);
      apiDeliveries = res.data?.data || [];
    } catch (error) {
      console.error("Error fetching deliveries from API", error);
    }
  }

  const rawLocal = localStorage.getItem("prisms_demo_deliveries");
  const localDeliveries: DeliveryOrder[] = rawLocal ? JSON.parse(rawLocal) : [];

  const STATUS_ORDER = ['OFFER_ACCEPTED_PLANNED', 'PLANNED', 'PICKUP_READY', 'DISPATCHED', 'IN_TRANSIT', 'DELIVERED'];
  const getStatusRank = (s?: string) => Math.max(0, STATUS_ORDER.indexOf(s || ''));

  const apiMap = new Map<string, DeliveryOrder>();

  // 1. Process authenticated API records WITHOUT isRecordOwnedByUser()
  apiDeliveries.forEach(d => {
    const key = d.deliveryId || d._id;
    if (!key) return;
    apiMap.set(key, {
      ...d,
      crop: d.crop && d.crop !== "Produce" ? d.crop : "Red Onion (Nashik)",
      agreedPricePerQtl: d.agreedPricePerQtl || 3200,
      vehicleType: d.vehicleType || "Medium Pickup (Bolero MaxiTruck)",
      freightRate: d.freightRate || "₹1.35/km/Qtl",
      estimatedFreight: d.estimatedFreight || Math.round(1.35 * 35 * (d.quantityQtl || 30)),
    });
  });

  // 2. Process local demo records WITH isRecordOwnedByUser() only in DEMO mode
  if (!isBackendMode) {
    localDeliveries.forEach(d => {
      if (!isRecordOwnedByUser(d.farmerId, activeUserId, activeUserEmail)) {
        return;
      }

      const key = d.deliveryId || d._id;
      if (!key) return;

      if (!apiMap.has(key)) {
        apiMap.set(key, {
          ...d,
          crop: d.crop && d.crop !== "Produce" ? d.crop : "Red Onion (Nashik)",
          agreedPricePerQtl: d.agreedPricePerQtl || 3200,
          vehicleType: d.vehicleType || "Medium Pickup (Bolero MaxiTruck)",
          freightRate: d.freightRate || "₹1.35/km/Qtl",
          estimatedFreight: d.estimatedFreight || Math.round(1.35 * 35 * (d.quantityQtl || 30)),
        });
      } else {
        const existing = apiMap.get(key)!;
        const rankExisting = getStatusRank(existing.deliveryStatus);
        const rankNew = getStatusRank(d.deliveryStatus);
        const winner = rankNew >= rankExisting ? d : existing;
        const mergedTimeline = (existing.timeline && existing.timeline.length >= (d.timeline?.length || 0))
          ? existing.timeline
          : (d.timeline || existing.timeline);

        apiMap.set(key, {
          ...existing,
          ...winner,
          deliveryStatus: winner.deliveryStatus as any,
          actualDeliveryDate: winner.actualDeliveryDate || existing.actualDeliveryDate,
          timeline: mergedTimeline,
          crop: (winner.crop && winner.crop !== "Produce") ? winner.crop : existing.crop,
          agreedPricePerQtl: winner.agreedPricePerQtl || existing.agreedPricePerQtl,
          vehicleType: winner.vehicleType || existing.vehicleType,
          freightRate: winner.freightRate || existing.freightRate,
          estimatedFreight: winner.estimatedFreight || existing.estimatedFreight,
        });
      }
    });
  }

  return Array.from(apiMap.values());
}

export async function createDeliveryOrderApi(offerId: string, vehicleType?: string, plannedPickupDate?: string): Promise<DeliveryOrder> {
  const res = await apiClient.post(`${API_URL}/deliveries`, { offerId, vehicleType, plannedPickupDate });
  return res.data.data;
}

export async function updateDeliveryStatusApi(deliveryId: string, status: string, notes?: string): Promise<DeliveryOrder> {
  const res = await apiClient.patch(`${API_URL}/deliveries/${deliveryId}/status`, { status, notes });
  return res.data.data;
}

export async function advanceDemoDeliveryApi(deliveryId: string): Promise<DeliveryOrder> {
  const res = await apiClient.post(`${API_URL}/deliveries/${deliveryId}/advance-demo`);
  return res.data.data;
}

export async function fetchUserPayments(): Promise<PaymentLedger[]> {
  const activeUser = getCurrentUser();
  const activeUserId = activeUser?.id || "user_demo_001";
  const activeUserEmail = activeUser?.email;

  const isBackendMode = getAuthMode() === "BACKEND";

  let apiPayments: PaymentLedger[] = [];
  if (isBackendMode) {
    try {
      const res = await apiClient.get(`${API_URL}/payments`);
      apiPayments = res.data?.data || [];
    } catch (error) {
      console.error("Error fetching payments from API", error);
    }
  }

  const rawLocal = localStorage.getItem("prisms_demo_payments");
  const localPayments: PaymentLedger[] = rawLocal ? JSON.parse(rawLocal) : [];

  const apiMap = new Map<string, PaymentLedger>();

  // 1. Process authenticated API records WITHOUT isRecordOwnedByUser()
  apiPayments.forEach(p => {
    const key = p.paymentId || p._id;
    if (!key) return;
    apiMap.set(key, p);
  });

  // 2. Process local demo records WITH isRecordOwnedByUser() only in DEMO mode
  if (!isBackendMode) {
    localPayments.forEach(p => {
      if (!isRecordOwnedByUser(p.farmerId, activeUserId, activeUserEmail)) {
        return;
      }

      const key = p.paymentId || p._id;
      if (!key) return;

      if (!apiMap.has(key)) {
        apiMap.set(key, p);
      } else {
        const existing = apiMap.get(key)!;
        const isPaidNew = p.paymentStatus === 'PAID' || p.paymentStatus === 'RELEASED' || Boolean(p.paidDate);
        const winner = isPaidNew ? p : existing;
        apiMap.set(key, { ...existing, ...winner });
      }
    });
  }

  return Array.from(apiMap.values());
}

export async function updatePaymentStatusApi(paymentId: string, status: string, paymentMode?: string): Promise<PaymentLedger> {
  const res = await apiClient.patch(`${API_URL}/payments/${paymentId}/status`, { status, paymentMode });
  return res.data.data;
}

export async function fetchUserTransactions(): Promise<TransactionItem[]> {
  const activeUser = getCurrentUser();
  const activeUserId = activeUser?.id || "user_demo_001";
  const activeUserEmail = activeUser?.email;

  const isBackendMode = getAuthMode() === "BACKEND";

  let apiTxns: TransactionItem[] = [];
  if (isBackendMode) {
    try {
      const res = await apiClient.get(`${API_URL}/transactions`);
      apiTxns = res.data?.data || [];
    } catch (error) {
      console.error("Error fetching transactions from API", error);
    }
  }

  const rawLocal = localStorage.getItem("prisms_demo_transactions");
  const localTxns: TransactionItem[] = rawLocal ? JSON.parse(rawLocal) : [];

  const apiMap = new Map<string, TransactionItem>();

  // 1. Process authenticated API records WITHOUT isRecordOwnedByUser()
  apiTxns.forEach(t => {
    const key = t.transactionId || t._id;
    if (key && !apiMap.has(key)) {
      apiMap.set(key, t);
    }
  });

  // 2. Process local demo records WITH isRecordOwnedByUser() only in DEMO mode
  if (!isBackendMode) {
    localTxns.forEach(t => {
      if (!isRecordOwnedByUser(t.farmerId, activeUserId, activeUserEmail)) {
        return;
      }

      const key = t.transactionId || t._id;
      if (key && !apiMap.has(key)) {
        apiMap.set(key, t);
      }
    });
  }

  return Array.from(apiMap.values());
}

export async function fetchTransactionSummaryApi(transactionId: string): Promise<any> {
  const token = localStorage.getItem("prisms_token");
  if (!token) return null;
  try {
    const res = await apiClient.get(`${API_URL}/transactions/${transactionId}/summary`);
    return res.data.data;
  } catch (error) {
    console.error("Error fetching transaction summary", error);
    return null;
  }
}

export async function fetchUserGrievances(): Promise<GrievanceItem[]> {
  const token = localStorage.getItem("prisms_token");
  if (!token) return [];
  try {
    const res = await apiClient.get(`${API_URL}/grievances`);
    return res.data.data;
  } catch (error) {
    console.error("Error fetching grievances", error);
    return [];
  }
}

export async function createGrievanceApi(data: {
  transactionId?: string;
  lotId?: string;
  buyerId?: string;
  category: string;
  description: string;
  priority?: string;
}): Promise<GrievanceItem> {
  const res = await apiClient.post(`${API_URL}/grievances`, data);
  return res.data.data;
}

export async function updateGrievanceStatusApi(grievanceId: string, status: string, resolutionNote?: string): Promise<GrievanceItem> {
  const res = await apiClient.patch(`${API_URL}/grievances/${grievanceId}/status`, { status, resolutionNote });
  return res.data.data;
}

export interface FPOItem {
  _id: string;
  fpoId: string;
  name: string;
  registrationNumber: string;
  district: string;
  state: string;
  village: string;
  cropsSupported: string[];
  memberCount: number;
  description: string;
  isDemo: boolean;
}

export interface FpoMembershipItem {
  _id: string;
  fpoId: string;
  farmerId: any;
  memberRole: 'MEMBER' | 'MANAGER' | 'COORDINATOR';
  joinedAt: string;
  status: string;
}

export interface FarmerContributionItem {
  farmerId: string;
  farmerName?: string;
  quantityQtl: number;
  lotId?: string;
  contributionPercent: number;
  joinedAt: string;
}

export interface GroupHarvestPoolItem {
  _id: string;
  poolId: string;
  fpoId: string;
  crop: string;
  variety: string;
  grade: string;
  totalQuantityQtl: number;
  targetMarket: string;
  farmerContributions: FarmerContributionItem[];
  poolingStatus: 'DRAFT' | 'OPEN' | 'READY_FOR_SALE' | 'MATCHED' | 'DISPATCHED' | 'COMPLETED' | 'CANCELLED';
  isDemo: boolean;
  createdAt: string;
}

export interface TransportOptimizationData {
  poolId: string;
  crop: string;
  totalQuantityQtl: number;
  distanceKm: number;
  individualCombinedCost: number;
  collective: {
    recommendedVehicle: string;
    vehicleKey: string;
    capacityQtl: number;
    tripsRequired: number;
    collectiveFreight: number;
    collectiveLabour: number;
    totalCollectiveCost: number;
  };
  totalGroupSavings: number;
  savingsPercent: number;
  farmerAllocations: Array<{
    farmerId: string;
    farmerName: string;
    quantityQtl: number;
    sharePercent: number;
    individualVehicle: string;
    individualTotalCost: number;
    allocatedCollectiveCost: number;
    savings: number;
    savingsPercent: number;
  }>;
}

export async function fetchFpos(): Promise<FPOItem[]> {
  try {
    const res = await apiClient.get(`${API_URL}/fpos`);
    return res.data.data;
  } catch (error) {
    console.error("Error fetching FPOs", error);
    return [];
  }
}

export async function joinFpoApi(fpoId: string): Promise<any> {
  const res = await apiClient.post(`${API_URL}/fpos/${fpoId}/join`, {});
  return res.data.data;
}

export async function fetchPools(fpoId?: string): Promise<GroupHarvestPoolItem[]> {
  try {
    const res = await apiClient.get(`${API_URL}/pools`, { params: { fpoId } });
    return res.data.data;
  } catch (error) {
    console.error("Error fetching harvest pools", error);
    return [];
  }
}

export async function createPoolApi(data: {
  fpoId?: string;
  crop: string;
  variety?: string;
  grade?: string;
  targetMarket?: string;
}): Promise<GroupHarvestPoolItem> {
  const res = await apiClient.post(`${API_URL}/pools`, data);
  return res.data.data;
}

export async function contributeToPoolApi(poolId: string, lotId: string, quantityQtl: number): Promise<GroupHarvestPoolItem> {
  const res = await apiClient.post(`${API_URL}/pools/${poolId}/contribute`, { lotId, quantityQtl });
  return res.data.data;
}

export async function fetchPoolTransportOptimization(poolId: string, distKm?: number): Promise<TransportOptimizationData | null> {
  try {
    const res = await apiClient.get(`${API_URL}/pools/${poolId}/transport-optimization`, { params: { distKm } });
    return res.data.data;
  } catch (error) {
    console.error("Error fetching pool transport optimization", error);
    return null;
  }
}

export async function fetchPoolMarketRecommendations(poolId: string): Promise<any> {
  try {
    const res = await apiClient.get(`${API_URL}/pools/${poolId}/market-recommendations`);
    return res.data.data;
  } catch (error) {
    console.error("Error fetching pool market recommendations", error);
    return null;
  }
}

export interface QualityAssessmentItem {
  _id: string;
  assessmentId: string;
  cropName: string;
  variety?: string;
  overallScore: number;
  estimatedGrade: 'A+' | 'A' | 'B' | 'C' | 'D';
  qualityNotes: string;
  assessmentMethod: string;
  createdAt: string;
}

export interface NotificationItem {
  _id: string;
  notificationId: string;
  userId?: string;
  recipientUserId?: string;
  type: string;
  title: string;
  message: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  relatedCrop?: string;
  relatedMarket?: string;
  relatedLotId?: string;
  relatedOfferId?: string;
  lotId?: string;
  offerId?: string;
  counterPrice?: number;
  isRead: boolean;
  read?: boolean;
  createdAt: string;
}

export async function createQualityAssessmentApi(data: {
  cropName: string;
  variety?: string;
  sizeScore?: number;
  colorScore?: number;
  firmnessScore?: number;
  moisturePercent?: number;
  visibleDamagePercent?: number;
  decayPercent?: number;
  cleanlinessScore?: number;
}): Promise<QualityAssessmentItem> {
  const res = await apiClient.post(`${API_URL}/quality`, data);
  return res.data.data;
}

export async function fetchUserAssessments(): Promise<QualityAssessmentItem[]> {
  const token = localStorage.getItem("prisms_token");
  if (!token) return [];
  try {
    const res = await apiClient.get(`${API_URL}/quality`);
    return res.data.data;
  } catch (error) {
    console.error("Error fetching quality assessments", error);
    return [];
  }
}

export async function fetchStorageRecommendation(params: {
  cropName?: string;
  quantityQtl?: number;
  holdingDays?: number;
}): Promise<any> {
  try {
    const res = await apiClient.get(`${API_URL}/intelligence/storage-recommendation`, { params });
    return res.data.data;
  } catch (error) {
    console.error("Error fetching storage recommendation", error);
    return null;
  }
}

export async function fetchSaleWindowRecommendation(params: {
  cropName?: string;
  currentPrice?: number;
  targetPrice?: number;
}): Promise<any> {
  try {
    const res = await apiClient.get(`${API_URL}/intelligence/sale-window`, { params });
    return res.data.data;
  } catch (error) {
    console.error("Error fetching sale window recommendation", error);
    return null;
  }
}

export async function fetchRiskScore(params: {
  cropName?: string;
  transitDistanceKm?: number;
  spoilagePercent?: number;
}): Promise<any> {
  try {
    const res = await apiClient.get(`${API_URL}/intelligence/risk-score`, { params });
    return res.data.data;
  } catch (error) {
    console.error("Error fetching risk score", error);
    return null;
  }
}

export async function fetchRecommendationExplanation(params: {
  recommendationType: string;
  marketName?: string;
  buyerName?: string;
  netRealization?: number;
  pricePerQtl?: number;
  distanceKm?: number;
}): Promise<any> {
  try {
    const res = await apiClient.get(`${API_URL}/intelligence/explanation`, { params });
    return res.data.data;
  } catch (error) {
    console.error("Error fetching recommendation explanation", error);
    return null;
  }
}

export async function fetchNotifications(): Promise<{ unreadCount: number; data: NotificationItem[] }> {
  const token = localStorage.getItem("prisms_token");
  if (!token) return { unreadCount: 0, data: [] };
  try {
    const res = await apiClient.get(`${API_URL}/notifications`);
    return { unreadCount: res.data.unreadCount || 0, data: res.data.data || [] };
  } catch (error) {
    console.error("Error fetching notifications", error);
    return { unreadCount: 0, data: [] };
  }
}

export async function markNotificationReadApi(id: string): Promise<any> {
  const res = await apiClient.patch(`${API_URL}/notifications/${id}/read`, {});
  return res.data.data;
}

export interface PriceAlertItem {
  _id: string;
  alertId: string;
  commodity: string;
  marketId?: string;
  marketName?: string;
  targetPrice: number;
  condition: 'PRICE_AT_OR_ABOVE' | 'PRICE_AT_OR_BELOW';
  isEnabled: boolean;
  lastTriggeredAt?: string;
  createdAt: string;
}

export async function fetchPriceAlerts(): Promise<PriceAlertItem[]> {
  const token = localStorage.getItem("prisms_token");
  if (!token) return [];
  try {
    const res = await apiClient.get(`${API_URL}/price-alerts`);
    return res.data.data;
  } catch (error) {
    console.error("Error fetching price alerts", error);
    return [];
  }
}

export async function createPriceAlertApi(data: {
  commodity: string;
  marketName?: string;
  targetPrice: number;
  condition?: string;
}): Promise<PriceAlertItem> {
  const res = await apiClient.post(`${API_URL}/price-alerts`, data);
  return res.data.data;
}

export async function updatePriceAlertApi(id: string, updates: { isEnabled?: boolean; targetPrice?: number }): Promise<PriceAlertItem> {
  const res = await apiClient.patch(`${API_URL}/price-alerts/${id}`, updates);
  return res.data.data;
}

export async function deletePriceAlertApi(id: string): Promise<any> {
  const res = await apiClient.delete(`${API_URL}/price-alerts/${id}`);
  return res.data.data;
}

/**
 * Safely resets all demo / simulated localStorage data to the initial seed state.
 * Idempotent, safe, and does not alter backend or user account data.
 */
export function resetDemoDataApi(): void {
  if (typeof window === "undefined") return;

  // Clear demo storage keys
  localStorage.removeItem("prisms_demo_lots_list");
  localStorage.removeItem("prisms_demo_accepted_offers");
  localStorage.removeItem("prisms_demo_deliveries");
  localStorage.removeItem("prisms_demo_payments");
  localStorage.removeItem("prisms_demo_transactions");
  localStorage.removeItem("prisms_demo_counter_offers");
  localStorage.removeItem("prisms_demo_pools");

  // Re-seed initial demo trade lots
  const initialLots: TradeLot[] = [
    {
      _id: "demo_lot_72",
      lotId: "LOT-2026-0072",
      userId: "demo_user",
      cropName: "Sharbati Wheat",
      variety: "MP Sharbati",
      grade: "Grade A",
      quantityQtl: 80,
      expectedPricePerQtl: 2800,
      minimumAcceptablePrice: 2700,
      qualityScore: 92,
      origin: "Farm Gate",
      district: "Nashik",
      location: "Nashik, Maharashtra",
      lotStatus: "OFFERED",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      _id: "demo_lot_5938",
      lotId: "LOT-2026-5938",
      userId: "demo_user",
      cropName: "Red Onion (Nashik)",
      variety: "Garwa Premium",
      grade: "Grade A",
      quantityQtl: 30,
      expectedPricePerQtl: 3200,
      minimumAcceptablePrice: 3000,
      qualityScore: 88,
      origin: "Farm Gate",
      district: "Nashik",
      location: "Karjat, Raigad",
      lotStatus: "OFFERED",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  ];

  localStorage.setItem("prisms_demo_lots_list", JSON.stringify(initialLots));

  // Dispatch custom window event so active components update
  window.dispatchEvent(new CustomEvent("prisms:reset_demo_data"));
}








import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CROP_EMOJI,
  CROP_MR_FALLBACK,
  CROP_HI_FALLBACK,
  DEFAULT_TRANSPORT_RATE,
  VEHICLE_OPTIONS,
  computeResults,
  fetchCommodities,
  fetchMarkets,
  fetchPrices,
  logQuery,
  matchDistrict,
  nearestDistrict,
  fetchUserCrops,
  fetchUserLots,
  fetchUserOffers,
  createTradeLot,
  createUserCrop,
  deleteUserCrop,
  updateUserProfile,
  getCoordsFromLocationText,
  API_BASE_URL,
  type CropBatchItem,
} from "@/lib/prisms";
import { t, type Lang } from "@/lib/i18n";
import { MandiCard } from "@/components/MandiCard";
import { SimpleGraph, type DataPoint } from "@/components/SimpleGraph";
import { SpotlightCard } from "@/components/SpotlightCard";
import { BorderBeam } from "@/components/BorderBeam";
import { CountUp } from "@/components/CountUp";
import { BlurText } from "@/components/BlurText";
import { AuthModal } from "@/components/AuthModal";
import { AiAgriAdvisor } from "@/components/AiAgriAdvisor";
import { RealGisMap } from "@/components/RealGisMap";
import { BuyerDiscovery } from "@/components/BuyerDiscovery";
import { TradeLotsManager } from "@/components/TradeLotsManager";
import { DeliveryTracker } from "@/components/DeliveryTracker";
import { PaymentTracker } from "@/components/PaymentTracker";
import { TransactionHistory } from "@/components/TransactionHistory";
import { GrievanceManager } from "@/components/GrievanceManager";
import { FpoGroupManager } from "@/components/FpoGroupManager";
import { IntelligenceSuite } from "@/components/IntelligenceSuite";
import { DigitalOffersManager } from "@/components/DigitalOffersManager";
import { LandingPage } from "@/components/LandingPage";
import { BuyerDashboard } from "@/components/BuyerDashboard";
import { getCurrentUser, logoutUser, resetDemoDataApi, type AuthUser } from "@/lib/prisms";
import {
  Layers,
  Search,
  Package,
  Store,
  Tag,
  DollarSign,
  Truck,
  CreditCard,
  Clock,
  Users,
  Sparkles,
  LogOut,
  Bell,
  Settings,
  User as UserIcon,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  MapPin,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "KrishiSetu — Digital Agricultural Command Center" },
      {
        name: "description",
        content:
          "Digital command center and GIS market discovery for Indian farmers: compare nearby mandis, calculate true net profit, and view price analytics.",
      },
      { property: "og:title", content: "KrishiSetu — Digital Agricultural Command Center" },
    ],
  }),
  component: Index,
});

export function Index() {
  const [lang, setLang] = useState<Lang>("en");
  const [activeTab, setActiveTab] = useState<
    | "dashboard"
    | "search"
    | "analytics"
    | "crops"
    | "buyers"
    | "resources"
    | "delivery"
    | "payments"
    | "transactions"
    | "grievances"
    | "fpo"
    | "intelligence"
    | "alerts"
    | "offers"
    | "transport"
  >("dashboard");
  const [opsOpen, setOpsOpen] = useState(false);
  
  // Settings Modal State
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [prefUnit, setPrefUnit] = useState<"kg" | "qtl" | "ton">("kg");
  const [notifLogistics, setNotifLogistics] = useState(true);
  const [notifPrice, setNotifPrice] = useState(true);
  const [notifWeather, setNotifWeather] = useState(true);
  const [prefDistrict, setPrefDistrict] = useState("Nashik");
  const [savedToast, setSavedToast] = useState(false);
  const [savedToastMsg, setSavedToastMsg] = useState("");
  const [resetConfirmModalOpen, setResetConfirmModalOpen] = useState(false);
  const [resetSuccessToast, setResetSuccessToast] = useState(false);

  // Auth & Profile State
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalRole, setAuthModalRole] = useState<"farmer" | "buyer">("farmer");
  const [authModalMode, setAuthModalMode] = useState<"login" | "signup">("login");
  const [viewLanding, setViewLanding] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => getCurrentUser());
  const [profileOpen, setProfileOpen] = useState(false);
  const [farmerName, setFarmerName] = useState(() => currentUser?.name || "");
  const [farmerPhone, setFarmerPhone] = useState(() => currentUser?.email || currentUser?.phone || "");
  const [farmerVillage, setFarmerVillage] = useState(() => currentUser?.village || "");
  const [farmerAcres, setFarmerAcres] = useState("");

  // Sync profile fields whenever authenticated user state changes
  useEffect(() => {
    if (currentUser) {
      if (currentUser.name) setFarmerName(currentUser.name);
      if (currentUser.email || currentUser.phone) setFarmerPhone(currentUser.email || currentUser.phone || "");
      if (currentUser.village) setFarmerVillage(currentUser.village);
    }
  }, [currentUser]);

  // Live Date & Time Clock for real-time responsiveness
  const [currentDateTime, setCurrentDateTime] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentDateTime(new Date()), 10000);
    return () => clearInterval(timer);
  }, []);

  const formattedLiveDate = useMemo(() => {
    return currentDateTime.toLocaleDateString(lang === "mr" ? "mr-IN" : "en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }, [currentDateTime, lang]);

  const formattedLiveTime = useMemo(() => {
    return currentDateTime.toLocaleTimeString(lang === "mr" ? "mr-IN" : "en-IN", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }, [currentDateTime, lang]);

  // Dynamic Time-of-Day Greeting (Morning, Afternoon, Evening, Night)
  const greeting = useMemo(() => {
    const hour = currentDateTime.getHours();
    const firstName = currentUser?.name ? currentUser.name.split(" ")[0] : null;
    const nameStrEn = firstName ? `, ${firstName}` : ", Farmer";
    const nameStrMr = firstName ? `, ${firstName}` : ", शेतकरी बांधवांनो";

    if (hour >= 4 && hour < 12) {
      return {
        en: `Good Morning${nameStrEn}.`,
        mr: `शुभ सकाळ${nameStrMr}.`,
        subtitle_en: "Morning APMC arrivals and verified auction rates are updated for today.",
        subtitle_mr: "सकाळचे बाजार समिती आवक व लिलाव दर अद्यतनित झाले आहेत.",
        icon: "wb_sunny",
        badge_en: "Morning Trading Session",
        badge_mr: "सकाळचे लिलाव सत्र",
      };
    } else if (hour >= 12 && hour < 17) {
      return {
        en: `Good Afternoon${nameStrEn}.`,
        mr: `शुभ दुपार${nameStrMr}.`,
        subtitle_en: "Mid-day market volume and modal price realization are updated.",
        subtitle_mr: "दुपारचे बाजारपेठ आवक व सरासरी दर अद्यतनित झाले आहेत.",
        icon: "sunny",
        badge_en: "Midday Market Session",
        badge_mr: "दुपारचे बाजार सत्र",
      };
    } else if (hour >= 17 && hour < 22) {
      return {
        en: `Good Evening${nameStrEn}.`,
        mr: `शुभ संध्याकाळ${nameStrMr}.`,
        subtitle_en: "Evening APMC closing quotes & price realizations are ready.",
        subtitle_mr: "संध्याकाळचे अंतिम बाजार भाव व नफा अंदाज तयार आहेत.",
        icon: "wb_twilight",
        badge_en: "Evening Closing Session",
        badge_mr: "संध्याकाळचे अंतिम सत्र",
      };
    } else {
      return {
        en: `Good Night${nameStrEn}.`,
        mr: `शुभ रात्री${nameStrMr}.`,
        subtitle_en: "Night-time transit dispatch & tomorrow's mandi forecast are ready.",
        subtitle_mr: "रात्रीचे वाहतूक नियोजन आणि उद्याचा संभाव्य भाव अंदाज तयार आहे.",
        icon: "bedtime",
        badge_en: "Night Logistics & Planning",
        badge_mr: "रात्रीचे नियोजन सत्र",
      };
    }
  }, [currentDateTime, currentUser]);

  // Dashboard & Calculator State
  const [cropId, setCropId] = useState<string>("");
  const [qty, setQty] = useState("30");
  const [qtyUnit, setQtyUnit] = useState<"Qtl" | "Kg">("Qtl");
  const [selectedVehicle, setSelectedVehicle] = useState<string>("medium_pickup");
  const [labourPerTrip, setLabourPerTrip] = useState<string>("500");
  const [isColdChain, setIsColdChain] = useState<boolean>(false);
  const [grade, setGrade] = useState("Grade 1");
  const [locationText, setLocationText] = useState("Pimple Gurav, Pune");
  const [district, setDistrict] = useState<string>("Pune");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>({ lat: 18.5912, lng: 73.8188 });
  const [locating, setLocating] = useState(false);
  const [locationSource, setLocationSource] = useState<"GPS" | "PROFILE" | "MANUAL">("GPS");
  const [locationStatus, setLocationStatus] = useState<"idle" | "locating" | "success" | "denied" | "unavailable">("idle");
  const [locationNoticeMsg, setLocationNoticeMsg] = useState<string>("");
  const [formError, setFormError] = useState<string>("");
  const [submitted, setSubmitted] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [transportRate, setTransportRate] = useState(String(DEFAULT_TRANSPORT_RATE));
  const [forecastRange, setForecastRange] = useState<"30D" | "90D" | "1Y">("30D");
  const [analyticsRange, setAnalyticsRange] = useState<"30D" | "60D" | "90D">("60D");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);
  const [mandiSearchQuery, setMandiSearchQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("Maharashtra Region");
  const [alertSet, setAlertSet] = useState(false);

  // Market Search / Discovery State
  const [searchScope, setSearchScope] = useState<"nearby" | "maharashtra">("nearby");
  const [searchRadius, setSearchRadius] = useState<number>(50);
  const [discoveryCrop, setDiscoveryCrop] = useState("Wheat (HD-2967)");
  const [mandiType, setMandiType] = useState("APMC Regulated");
  const [minNetEarning, setMinNetEarning] = useState("2150");
  const [mapZoom, setMapZoom] = useState(12);
  const [selectedMandiPin, setSelectedMandiPin] = useState<string | null>("azadpur");
  const [comparedMandis, setComparedMandis] = useState<Record<string, boolean>>({});

  // Resources Tab State
  const [loanYieldValue, setLoanYieldValue] = useState("500000");
  const [loanEligibilityResult, setLoanEligibilityResult] = useState<number | null>(null);
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [agentModalOpen, setAgentModalOpen] = useState(false);
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);

  const handleExportCsv = () => {
    const headers = [
      "Mandi Name",
      "Distance (km)",
      "Price (Rs/Qtl)",
      "Gross Value (Rs)",
      "Logistics Freight (Rs)",
      "Labour Cost (Rs)",
      "Spoilage Loss (Rs)",
      "Handling Fee 1% (Rs)",
      "Est Net Realization (Rs)"
    ];
    const rows = (results || []).map((r) => [
      `"${r.market.name}"`,
      r.market.distance_km,
      Math.round(r.pricePerKg * 100),
      r.gross,
      r.transport,
      r.labour,
      r.spoilage,
      r.commission,
      r.net
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `PRISMS_Mandi_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleTopSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    setMandiSearchQuery(q);
    setActiveTab("search");
    setSearchDropdownOpen(false);
  };

  const queryClient = useQueryClient();

  // Feature Visibility Flags (set to true to re-enable in UI)
  const SHOW_INTELLIGENCE_IN_SIDEBAR = false;
  const SHOW_ALERTS_IN_SIDEBAR = false;
  const SHOW_SUPPORT_TOOLS_IN_SIDEBAR = false;
  const SHOW_COLLECTIVE_TRANSPORT_IN_SIDEBAR = false;
  const SHOW_MANDI_PASS_CARD = false;

  const handleNavigateToPayment = (paymentId?: string, lotId?: string) => {
    setActiveTab("payments");
    if (paymentId || lotId) {
      setTimeout(() => {
        const targetId = paymentId ? `payment-${paymentId}` : `lot-payment-${lotId}`;
        const el = document.getElementById(targetId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  };

  // Listen for custom navigation events across tabs (e.g. from offer acceptance to delivery/payments/transactions)
  useEffect(() => {
    const handleNavigateTab = (e: Event) => {
      const customEv = e as CustomEvent<string>;
      if (customEv.detail) {
        let tabTarget = customEv.detail;
        if (tabTarget === "calculator" || tabTarget === "ranking") {
          tabTarget = "dashboard";
        }
        setActiveTab(tabTarget as any);
      }
    };
    window.addEventListener("prisms:navigate_tab", handleNavigateTab);
    return () => {
      window.removeEventListener("prisms:navigate_tab", handleNavigateTab);
    };
  }, []);

  // Auto-expand Operations & Advanced section if activeTab is an operations route
  useEffect(() => {
    const opsTabs = ["offers", "delivery", "payments", "transactions", "fpo", "transport", "grievances", "analytics", "resources"];
    if (opsTabs.includes(activeTab)) {
      setOpsOpen(true);
    }
  }, [activeTab]);

  // My Crops State & Real Database Ownership
  const [newBatchModalOpen, setNewBatchModalOpen] = useState(false);
  const [newCropName, setNewCropName] = useState("Red Onion (Nashik)");
  const [newCropQty, setNewCropQty] = useState("4000");
  const [demoMode, setDemoMode] = useState(false);

  // Authenticated User Trade Lots Query from MongoDB API
  const userLotsQ = useQuery({
    queryKey: ["userLots", currentUser?.id || currentUser?.email],
    queryFn: fetchUserLots,
    enabled: Boolean(currentUser),
  });

  const activeLots: TradeLot[] = useMemo(() => {
    return userLotsQ.data ?? [];
  }, [userLotsQ.data]);

  const SAMPLE_DEMO_BATCHES: CropBatchItem[] = useMemo(
    () => [
      {
        _id: "demo-1",
        userId: "demo",
        cropName: "Red Onion (Nashik)",
        quantityKg: 5000,
        grade: "Grade 1",
        targetMandi: "Vashi APMC",
        status: "Peak Price",
        estimatedRealization: 106900,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        _id: "demo-2",
        userId: "demo",
        cropName: "Sharbati Wheat",
        quantityKg: 8000,
        grade: "Grade 1",
        targetMandi: "Vashi APMC",
        status: "Holding (Wait)",
        estimatedRealization: 224000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        _id: "demo-3",
        userId: "demo",
        cropName: "Yellow Soybeans",
        quantityKg: 2500,
        grade: "Grade 1",
        targetMandi: "Vashi APMC",
        status: "Standard",
        estimatedRealization: 121250,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    []
  );

  const activeBatches: CropBatchItem[] = useMemo(() => {
    if (demoMode) return SAMPLE_DEMO_BATCHES;
    return [];
  }, [demoMode, SAMPLE_DEMO_BATCHES]);

  useEffect(() => {
    const saved = localStorage.getItem("prisms-lang");
    if (saved === "mr" || saved === "en") setLang(saved as Lang);
  }, []);

  useEffect(() => {
    localStorage.setItem("prisms-lang", lang);
    document.documentElement.lang = lang;
  }, [lang]);

  const commoditiesQ = useQuery({ queryKey: ["commodities"], queryFn: fetchCommodities });
  const marketsQ = useQuery({ queryKey: ["markets"], queryFn: fetchMarkets });

  useEffect(() => {
    let handled = false;
    if (typeof window !== "undefined" && navigator.geolocation) {
      setLocationStatus("locating");
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          handled = true;
          const { latitude, longitude } = pos.coords;
          setCoords({ lat: latitude, lng: longitude });

          let detected = "";
          try {
            const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
            if (geoRes.ok) {
              const geoData = await geoRes.json();
              const addr = geoData.address || {};
              const place = addr.suburb || addr.town || addr.village || addr.city_district || addr.city || addr.county || addr.district;
              const state = addr.state || "Maharashtra";
              if (place) detected = `${place}, ${state}`;
            }
          } catch (e) {}

          if (!detected) {
            const near = nearestDistrict(marketsQ.data ?? [], latitude, longitude);
            detected = near || "Pimple Gurav, Pune";
          }

          setLocationText(detected);
          setDistrict(detected.split(",")[0] || "Pune");
          setLocationSource("GPS");
          setLocationStatus("success");
          setLocationNoticeMsg("");
          localStorage.setItem("prisms-user-location-text", detected);
        },
        (err) => {
          console.warn("Initial GPS auto-detection failed/denied:", err);
          // Priority 2: Check saved profile farm location
          const savedLoc = localStorage.getItem("prisms-user-location-text") || currentUser?.village;
          if (savedLoc) {
            setLocationText(savedLoc);
            const matched = getCoordsFromLocationText(savedLoc, marketsQ.data ?? []);
            if (matched) setCoords(matched);
            setLocationSource("PROFILE");
          } else {
            // Priority 3: Manual / Default location fallback (Pimple Gurav, Pune)
            setLocationText("Pimple Gurav, Pune");
            setCoords({ lat: 18.5912, lng: 73.8188 });
            setLocationSource("MANUAL");
          }

          if (err.code === 1) { // PERMISSION_DENIED
            setLocationStatus("denied");
            setLocationNoticeMsg(lang === "mr" ? "स्थान प्रवेश अक्षम केला आहे." : "Location access is disabled.");
          } else { // POSITION_UNAVAILABLE or TIMEOUT
            setLocationStatus("unavailable");
            setLocationNoticeMsg(lang === "mr" ? "आपले स्थान आपोआप शोधण्यात अयशस्वी." : "Unable to detect your location automatically.");
          }
        },
        { timeout: 8000, enableHighAccuracy: true }
      );
    }

    if (!handled && typeof window !== "undefined") {
      const savedLoc = localStorage.getItem("prisms-user-location-text") || currentUser?.village;
      if (savedLoc) {
        setLocationText(savedLoc);
        const matched = getCoordsFromLocationText(savedLoc, marketsQ.data ?? []);
        if (matched) setCoords(matched);
        setLocationSource("PROFILE");
      }
    }
  }, [marketsQ.data, currentUser]);

  useEffect(() => {
    const matched = getCoordsFromLocationText(locationText, marketsQ.data ?? []);
    if (matched) {
      setCoords(matched);
      localStorage.setItem("prisms-user-location-text", locationText);
    }
  }, [locationText, marketsQ.data]);

  useEffect(() => {
    const q = mandiSearchQuery.trim().toLowerCase();
    if (q) {
      const match = [
        { id: "pune", name: "pune apmc gultekdi", name_mr: "पुणे apmc" },
        { id: "vashi", name: "vashi apmc navi mumbai", name_mr: "वाशी apmc" },
        { id: "panvel", name: "panvel apmc", name_mr: "पनवेल apmc" },
        { id: "kalyan", name: "kalyan apmc", name_mr: "कल्याण apmc" },
        { id: "baramati", name: "baramati apmc", name_mr: "बारामती apmc" },
        { id: "lasalgaon", name: "lasalgaon mandi", name_mr: "लासलगाव बाजार समिती" },
        { id: "pimpalgaon", name: "pimpalgaon baswant apmc", name_mr: "पिंपळगाव apmc" },
        { id: "nashik", name: "nashik main apmc", name_mr: "नाशिक मुख्य बाजार" },
        { id: "rahuri", name: "rahuri apmc", name_mr: "राहुरी apmc" },
      ].find(
        (m) =>
          m.id === q ||
          m.name.includes(q) ||
          m.name_mr.includes(q)
      );

      if (match) {
        setSelectedMandiPin(match.id);
      }
    } else {
      setSelectedMandiPin("vashi");
    }
  }, [mandiSearchQuery]);


  const newsFeedQ = useQuery({
    queryKey: ["newsFeed", lang],
    queryFn: async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/news/feed?lang=${lang}`, {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache" },
        });
        if (res.ok) {
          const json = await res.json();
          return json.data;
        }
      } catch (e) {
        console.warn("News feed fetch error:", e);
      }
      return null;
    },
    refetchInterval: 30000,
    staleTime: 10000,
    refetchOnWindowFocus: true,
  });

  const commodities = commoditiesQ.data ?? [];
  const markets = marketsQ.data ?? [];

  // Listen for custom navigation event from Buyer Match modal to redirect directly to Ranked Markets section
  useEffect(() => {
    const handleNavigateToRanking = (e: Event) => {
      const customEv = e as CustomEvent<{ cropName?: string; quantityQtl?: number; origin?: string }>;
      const detail = customEv.detail || {};

      setActiveTab("dashboard");

      if (detail.cropName && Array.isArray(commodities) && commodities.length > 0) {
        const raw = String(detail.cropName).toLowerCase().trim();
        const clean = raw
          .replace(/_\d+$/, '')
          .replace(/\s*\([^)]*\)/g, '')
          .replace(/^(red|yellow|white|sharbati|hard|green|fresh|hybrid)\s+/i, '')
          .trim();

        const match = commodities.find(c => {
          const cName = c.name.toLowerCase();
          return cName.includes(clean) || clean.includes(cName) || cName.includes(raw) || raw.includes(cName);
        });

        if (match) {
          setCropId(match.id);
        }
      }

      if (detail.quantityQtl && Number(detail.quantityQtl) > 0) {
        setQty(String(detail.quantityQtl));
        setQtyUnit("Qtl");
      }

      setSubmitted(true);

      setTimeout(() => {
        const el = document.getElementById("market-ranking") || document.getElementById("markets-near-you");
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 200);
    };

    window.addEventListener("prisms:navigate_to_ranking", handleNavigateToRanking);
    return () => {
      window.removeEventListener("prisms:navigate_to_ranking", handleNavigateToRanking);
    };
  }, [commodities]);

  const districts = useMemo(() => {
    const seen = new Map<string, string>();
    for (const m of markets) if (!seen.has(m.district)) seen.set(m.district, m.state);
    return [...seen.entries()].map(([d, state]) => ({ district: d, state }));
  }, [markets]);

  useEffect(() => {
    if (!cropId && commodities[0]) {
      setCropId(commodities[0].id);
    }
  }, [commodities, cropId]);

  const marketIds = useMemo(() => markets.map((m) => m.id), [markets]);

  const pricesQ = useQuery({
    queryKey: ["prices", cropId, marketIds.length],
    queryFn: () => fetchPrices(cropId, marketIds),
    enabled: Boolean(cropId) && marketIds.length > 0,
  });

  const distancesQ = useQuery({
    queryKey: ["distances", coords, marketIds.length],
    queryFn: () => {
      return import("@/lib/prisms").then((m) => m.fetchRealDistances(coords!, markets));
    },
    enabled: Boolean(coords && markets.length > 0),
    staleTime: 1000 * 60 * 60,
  });

  const qtyNum = Number(qty) || 0;
  const qtyKg = useMemo(() => {
    return qtyUnit === "Qtl" ? qtyNum * 100 : qtyNum;
  }, [qtyNum, qtyUnit]);

  const rateNum = Number(transportRate) || 0;
  const commodity = commodities.find((c) => c.id === cropId);

  // Auto update unit when crop changes
  useEffect(() => {
    if (commodity) {
      const name = commodity.name.toLowerCase();
      if (name.includes("onion") || name.includes("wheat") || name.includes("soy")) {
        setQtyUnit("Qtl");
      } else if (name.includes("tomato") || name.includes("banana")) {
        setQtyUnit("Kg");
      }
    }
  }, [cropId, commodity]);

  const results = useMemo(() => {
    if (!commodity || !pricesQ.data || qtyKg <= 0) return [];
    return computeResults(
      markets,
      pricesQ.data,
      commodity,
      qtyKg,
      rateNum,
      coords,
      distancesQ.data,
      selectedVehicle,
      Number(labourPerTrip) || 0,
      isColdChain
    );
  }, [commodity, pricesQ.data, markets, qtyKg, rateNum, coords, distancesQ.data, selectedVehicle, labourPerTrip, isColdChain]);

  const highestListedId = useMemo(
    () => [...results].sort((a, b) => b.pricePerKg - a.pricePerKg)[0]?.market.id,
    [results],
  );

  const bestResult = results[0];

  const nearestMarket = useMemo(() => {
    if (results.length === 0) return null;
    return [...results].sort((a, b) => a.market.distance_km - b.market.distance_km)[0];
  }, [results]);

  const searchTabMandis = useMemo(() => {
    if (!results || results.length === 0) {
      return [];
    }

    return results.map((r, idx) => ({
      id: r.market.id,
      name: r.market.name,
      name_mr: r.market.name_mr || r.market.name,
      dist: Math.round(r.market.distance_km * 10) / 10,
      tag: idx === 0 ? "Highest Take-Home Profit" : "APMC Regulated Market",
      tag_mr: idx === 0 ? "सर्वोच्च निव्वळ नफा" : "कृषी उत्पन्न बाजार समिती",
      gross: r.pricePerQtl,
      logistics: r.transport,
      labour: r.labour,
      handling: r.commission,
      net: r.net,
      type: r.market.type || "APMC Regulated",
      state: r.market.state || "Maharashtra",
      indicatorColor: idx === 0 ? "bg-success-sage" : "bg-primary",
      tagColor: idx === 0 ? "text-success-sage" : "text-primary",
    }));
  }, [results]);

  const filteredMandis = useMemo(() => {
    if (!searchTabMandis || searchTabMandis.length === 0) return [];
    const q = mandiSearchQuery.trim().toLowerCase();

    return searchTabMandis.filter((m) => {
      const matchesSearch = !q ||
        m.name.toLowerCase().includes(q) ||
        (m.name_mr && m.name_mr.toLowerCase().includes(q)) ||
        m.id.toLowerCase().includes(q) ||
        ((m as any).district && (m as any).district.toLowerCase().includes(q)) ||
        ((m as any).city && (m as any).city.toLowerCase().includes(q)) ||
        (m.tag && m.tag.toLowerCase().includes(q)) ||
        (m.tag_mr && m.tag_mr.toLowerCase().includes(q));

      const matchesRadius = m.dist <= searchRadius;
      return matchesSearch && matchesRadius;
    });
  }, [searchTabMandis, mandiSearchQuery, searchRadius]);



  const marketOutlook = useMemo(() => {
    if (results.length === 0) {
      return {
        status: "Stable",
        status_mr: "स्थिर कल",
        text: "Recent benchmark prices are relatively stable.",
        text_mr: "अलीकडील बाजारभाव स्थिर पातळीवर आहेत.",
        color: "text-on-surface"
      };
    }

    let rising = 0;
    let falling = 0;
    for (const r of results) {
      if (r.trend === "rising") rising++;
      else if (r.trend === "falling") falling++;
    }

    if (rising > falling) {
      return {
        status: "Rising",
        status_mr: "तेजीचा कल",
        text: "Recent benchmark prices are trending upward.",
        text_mr: "अलीकडील बाजारभाव वाढीच्या दिशेने आहेत.",
        color: "text-success-sage"
      };
    } else if (falling > rising) {
      return {
        status: "Falling",
        status_mr: "घसरणीचा कल",
        text: "Recent benchmark prices are trending downward.",
        text_mr: "अलीकडील बाजारभाव घसरणीच्या दिशेने आहेत.",
        color: "text-alert-terracotta"
      };
    } else {
      return {
        status: "Stable",
        status_mr: "स्थिर कल",
        text: "Recent benchmark prices are relatively stable.",
        text_mr: "अलीकडील बाजारभाव स्थिर पातळीवर आहेत.",
        color: "text-on-surface"
      };
    }
  }, [results]);

  // Dynamic base price in ₹ / Qtl from backend API or commodity defaults
  const commodityBasePrice = useMemo(() => {
    if (bestResult?.pricePerKg) {
      return Math.round(bestResult.pricePerKg * 100);
    }
    if (commodity?.id?.includes("onion")) return 2350;
    if (commodity?.id?.includes("wheat")) return 2275;
    if (commodity?.id?.includes("tomato")) return 3100;
    if (commodity?.id?.includes("potato")) return 1950;
    if (commodity?.id?.includes("soybean")) return 4800;
    if (commodity?.id?.includes("cotton")) return 6900;
    return 2400;
  }, [bestResult, commodity]);

  // Total Portfolio Value from active farm batches in ₹
  const totalPortfolioValue = useMemo(() => {
    return activeBatches.reduce((acc, b) => acc + (b.estimatedRealization || 0), 0);
  }, [activeBatches]);

  // Forecast Data for Dashboard SimpleGraph calibrated to real data (Forward Forecast)
  const forecastData: DataPoint[] = useMemo(() => {
    const bp = commodityBasePrice;
    const formatRel = (days: number) => {
      const d = new Date(currentDateTime);
      d.setDate(d.getDate() + days);
      return d.toLocaleDateString(lang === "mr" ? "mr-IN" : "en-IN", { month: "short", day: "numeric" });
    };

    if (forecastRange === "30D") {
      return [
        { date: lang === "mr" ? "आज" : "Today", price: bp, minPrice: Math.round(bp * 0.95), maxPrice: Math.round(bp * 1.05) },
        { date: formatRel(5), price: Math.round(bp * 1.02), minPrice: Math.round(bp * 0.96), maxPrice: Math.round(bp * 1.07) },
        { date: formatRel(10), price: Math.round(bp * 1.04), minPrice: Math.round(bp * 0.98), maxPrice: Math.round(bp * 1.10) },
        { date: formatRel(15), price: Math.round(bp * 1.03), minPrice: Math.round(bp * 0.97), maxPrice: Math.round(bp * 1.09) },
        {
          date: formatRel(20),
          price: Math.round(bp * 1.08),
          minPrice: Math.round(bp * 1.01),
          maxPrice: Math.round(bp * 1.14),
          event: {
            title: "Peak Festive Demand",
            title_mr: "सणांमुळे वाढलेली मागणी",
            description: "High volume buying expected in major APMCs",
            description_mr: "प्रमुख बाजारात मोठ्या प्रमाणावर खरेदी अपेक्षित",
            type: "success",
          },
        },
        { date: formatRel(25), price: Math.round(bp * 1.10), minPrice: Math.round(bp * 1.02), maxPrice: Math.round(bp * 1.16) },
        { date: formatRel(30), price: Math.round(bp * 1.07), minPrice: Math.round(bp * 0.99), maxPrice: Math.round(bp * 1.13) },
      ];
    } else if (forecastRange === "90D") {
      return [
        { date: lang === "mr" ? "आज" : "Today", price: bp, minPrice: Math.round(bp * 0.93), maxPrice: Math.round(bp * 1.06) },
        { date: formatRel(15), price: Math.round(bp * 1.05), minPrice: Math.round(bp * 0.97), maxPrice: Math.round(bp * 1.12) },
        { date: formatRel(30), price: Math.round(bp * 1.09), minPrice: Math.round(bp * 1.00), maxPrice: Math.round(bp * 1.18) },
        { date: formatRel(60), price: Math.round(bp * 1.13), minPrice: Math.round(bp * 1.04), maxPrice: Math.round(bp * 1.22) },
        { date: formatRel(90), price: Math.round(bp * 1.10), minPrice: Math.round(bp * 1.01), maxPrice: Math.round(bp * 1.19) },
      ];
    } else {
      return [
        { date: "+3M", price: Math.round(bp * 0.98), minPrice: Math.round(bp * 0.90), maxPrice: Math.round(bp * 1.06) },
        { date: "+6M", price: Math.round(bp * 1.06), minPrice: Math.round(bp * 0.96), maxPrice: Math.round(bp * 1.15) },
        { date: "+9M", price: Math.round(bp * 1.14), minPrice: Math.round(bp * 1.03), maxPrice: Math.round(bp * 1.25) },
        { date: "+1Y", price: Math.round(bp * 1.09), minPrice: Math.round(bp * 0.98), maxPrice: Math.round(bp * 1.20) },
      ];
    }
  }, [commodityBasePrice, currentDateTime, forecastRange, lang]);

  // Analytics Data for Tab 3 SimpleGraph calibrated to real data (Past Trend to Today)
  const analyticsData: DataPoint[] = useMemo(() => {
    const bp = commodityBasePrice;
    const formatPast = (daysAgo: number) => {
      const d = new Date(currentDateTime);
      d.setDate(d.getDate() - daysAgo);
      return d.toLocaleDateString(lang === "mr" ? "mr-IN" : "en-IN", { month: "short", day: "numeric" });
    };

    if (analyticsRange === "30D") {
      return [
        { date: formatPast(25), price: Math.round(bp * 0.88), minPrice: Math.round(bp * 0.82), maxPrice: Math.round(bp * 0.94) },
        { date: formatPast(20), price: Math.round(bp * 0.92), minPrice: Math.round(bp * 0.86), maxPrice: Math.round(bp * 0.97) },
        {
          date: formatPast(15),
          price: Math.round(bp * 0.96),
          minPrice: Math.round(bp * 0.90),
          maxPrice: Math.round(bp * 1.02),
          event: {
            title: "Unseasonal Rain Alert",
            title_mr: "अवेळी पाऊस इशारा",
            description: "Temporary supply shortage",
            description_mr: "अल्पकालीन आवक घट संभवते",
            type: "warning",
          },
        },
        { date: formatPast(10), price: Math.round(bp * 0.99), minPrice: Math.round(bp * 0.93), maxPrice: Math.round(bp * 1.05) },
        {
          date: formatPast(5),
          price: Math.round(bp * 1.04),
          minPrice: Math.round(bp * 0.98),
          maxPrice: Math.round(bp * 1.10),
          event: {
            title: "Festival Demand Surge",
            title_mr: "सणांमुळे वाढलेली मागणी",
            description: "High price peak achieved",
            description_mr: "सर्वोच्च दर पातळी गाठली",
            type: "success",
          },
        },
        { date: lang === "mr" ? "आज" : "Today", price: bp, minPrice: Math.round(bp * 0.94), maxPrice: Math.round(bp * 1.06) },
      ];
    } else if (analyticsRange === "60D") {
      return [
        { date: formatPast(50), price: Math.round(bp * 0.82), minPrice: Math.round(bp * 0.76), maxPrice: Math.round(bp * 0.88) },
        { date: formatPast(40), price: Math.round(bp * 0.86), minPrice: Math.round(bp * 0.80), maxPrice: Math.round(bp * 0.92) },
        { date: formatPast(30), price: Math.round(bp * 0.90), minPrice: Math.round(bp * 0.84), maxPrice: Math.round(bp * 0.96) },
        {
          date: formatPast(20),
          price: Math.round(bp * 0.97),
          minPrice: Math.round(bp * 0.91),
          maxPrice: Math.round(bp * 1.03),
          event: {
            title: "Unseasonal Rain Alert",
            title_mr: "अवेळी पाऊस इशारा",
            description: "Short term supply pinch",
            description_mr: "अल्पकालीन आवक घट",
            type: "warning",
          },
        },
        {
          date: formatPast(10),
          price: Math.round(bp * 1.04),
          minPrice: Math.round(bp * 0.98),
          maxPrice: Math.round(bp * 1.10),
          event: {
            title: "Festival Demand Peak",
            title_mr: "सणांमुळे वाढलेली मागणी",
            description: "Sustained high volume expected",
            description_mr: "पुढील काही दिवस उच्च दर कायम राहतील",
            type: "success",
          },
        },
        { date: lang === "mr" ? "आज" : "Today", price: bp, minPrice: Math.round(bp * 0.94), maxPrice: Math.round(bp * 1.06) },
      ];
    } else {
      return [
        { date: "Nov 01", price: Math.round(bp * 1.01), minPrice: Math.round(bp * 0.95), maxPrice: Math.round(bp * 1.07) },
        { date: lang === "mr" ? "आज" : "Today", price: bp, minPrice: Math.round(bp * 0.94), maxPrice: Math.round(bp * 1.06) },
      ];
    }
  }, [commodityBasePrice, analyticsRange, lang]);

  const grossValue = useMemo(() => {
    if (bestResult) {
      return bestResult.gross;
    }
    return Math.round(qtyNum * 24.5);
  }, [bestResult, qtyNum]);

  const logisticsCost = useMemo(() => {
    if (selectedVehicle === "own_vehicle") return 0;
    if (bestResult) {
      return bestResult.transport;
    }
    return Math.round(15 * 1.5 * (qtyKg / 100));
  }, [bestResult, qtyKg, selectedVehicle]);

  const totalLabourCost = useMemo(() => {
    if (bestResult) {
      return bestResult.labour;
    }
    const trips = Math.max(1, Math.ceil((qtyKg / 100) / 30));
    return Math.round((Number(labourPerTrip) || 0) * trips);
  }, [bestResult, qtyKg, labourPerTrip]);

  const totalLogisticsCost = useMemo(() => {
    if (bestResult) {
      return bestResult.totalLogistics || (bestResult.transport + bestResult.labour);
    }
    return logisticsCost + totalLabourCost;
  }, [bestResult, logisticsCost, totalLabourCost]);

  const spoilageLoss = useMemo(() => {
    if (bestResult) {
      return bestResult.spoilage;
    }
    const rate = commodity?.spoilage_rate_percent || 8;
    return Math.round(grossValue * (rate / 100));
  }, [bestResult, grossValue, commodity]);

  const marketHandlingCharges = useMemo(() => {
    if (bestResult) {
      return bestResult.commission;
    }
    return Math.round(grossValue * 0.01);
  }, [bestResult, grossValue]);

  const estimatedNetProfit = useMemo(() => {
    if (bestResult) {
      return bestResult.net;
    }
    return Math.max(0, grossValue - totalLogisticsCost - spoilageLoss - marketHandlingCharges);
  }, [bestResult, grossValue, totalLogisticsCost, spoilageLoss, marketHandlingCharges]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "/" && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        const searchInput = document.querySelector('input[placeholder*="Search"], input[placeholder*="शोधा"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
          setSearchDropdownOpen(true);
        }
      } else if (e.key === "Escape") {
        setSearchDropdownOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  function handleUseMyLocation() {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setCoords({ lat: 19.0330, lng: 73.0297 });
      setLocationText("Navi Mumbai (Vashi Hub)");
      setDistrict("Navi Mumbai");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setLocating(false);
        const { latitude, longitude } = pos.coords;
        setCoords({ lat: latitude, lng: longitude });

        let detectedName = "";
        try {
          const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          if (geoRes.ok) {
            const geoData = await geoRes.json();
            const addr = geoData.address || {};
            const place = addr.suburb || addr.town || addr.village || addr.city_district || addr.city || addr.county || addr.district;
            const state = addr.state || "Maharashtra";
            if (place) {
              detectedName = `${place}, ${state}`;
            }
          }
        } catch (err) {
          console.warn("Reverse geocoding error:", err);
        }

        if (!detectedName) {
          const near = nearestDistrict(markets, latitude, longitude);
          detectedName = near || "Karjat, Raigad";
        }

        setLocationText(detectedName);
        setDistrict(detectedName.split(",")[0] || "Raigad");
        localStorage.setItem("prisms-user-location-text", detectedName);

        setFormError("");
        setSavedToastMsg(lang === "mr" ? `📍 GPS स्थान यशस्वीरित्या शोधले: ${detectedName}` : `📍 Real GPS location detected: ${detectedName}`);
        setSavedToast(true);
        setTimeout(() => setSavedToast(false), 3500);
      },
      (err) => {
        setLocating(false);
        console.warn("GPS detection error:", err);
        setCoords({ lat: 18.9102, lng: 73.3300 });
        setLocationText("Karjat, Raigad");
        setDistrict("Raigad");
        setSavedToastMsg(lang === "mr" ? "📍 स्थान सेट केले: कर्जत, रायगड" : "📍 Location set to Karjat, Raigad");
        setSavedToast(true);
        setTimeout(() => setSavedToast(false), 3000);
      },
      { timeout: 10000, enableHighAccuracy: true },
    );
  }

  function handleReset() {
    if (commodities[0]) setCropId(commodities[0].id);
    setQty("5000");
    setGrade("Grade 1");
    setLocationText("Karjat, Raigad");
    setCoords({ lat: 18.9102, lng: 73.3300 });
    setDistrict("Raigad");
    setFormError("");
    setSubmitted(false);
  }

  function handleResetFilters() {
    setSearchRadius(200);
    setDiscoveryCrop("All Crops");
    setMandiType("All Types");
    setMinNetEarning("");
    setMandiSearchQuery("");
  }

  function toggleCompare(id: string) {
    setComparedMandis((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!cropId) {
      setFormError(lang === "mr" ? "कृपया पीक निवडा" : "Please select a crop");
      setSubmitted(false);
      return;
    }

    if (qtyNum <= 0) {
      setFormError(t(lang, "emptyQty"));
      setSubmitted(false);
      return;
    }

    if (!locationText.trim()) {
      setFormError(lang === "mr" ? "कृपया आपले स्थान प्रविष्ट करा" : "Please enter a location");
      setSubmitted(false);
      return;
    }

    if (Number(labourPerTrip) < 0) {
      setFormError(lang === "mr" ? "हमाली खर्च नकारात्मक असू शकत नाही" : "Labour cost cannot be negative");
      setSubmitted(false);
      return;
    }

    setFormError("");
    setCalculating(true);

    const matched = matchDistrict(markets, locationText);
    if (matched) setDistrict(matched);

    setTimeout(async () => {
      setSubmitted(true);
      setCalculating(false);

      if (cropId) {
        void logQuery({
          commodityId: cropId,
          quantityKg: qtyNum,
          farmerLocation: locationText.trim(),
          latitude: coords?.lat ?? null,
          longitude: coords?.lng ?? null,
        }).catch(() => {});

        // Automatically create a backend Trade Lot from Dashboard input
        try {
          const selectedCropObj = commodities.find(c => c.id === cropId);
          const cropName = selectedCropObj ? selectedCropObj.name : "Red Onion";
          const qtyQtl = qtyUnit === "Qtl" ? qtyNum : Math.round((qtyNum / 100) * 10) / 10;
          const expPrice = commodityBasePrice || 3000;
          const minPrice = Math.round(expPrice * 0.9);

          const newLot = await createTradeLot({
            cropName,
            variety: "Standard",
            grade: grade || "Grade A",
            quantityQtl: Math.max(1, qtyQtl),
            expectedPricePerQtl: expPrice,
            minimumAcceptablePrice: minPrice,
            origin: locationText || "Farm Gate, Niphad",
            district: district || "Nashik",
            buyerVisibility: "PUBLIC",
          });

          if (newLot) {
            void userLotsQ.refetch();
            setSavedToastMsg(lang === "mr" ? `✅ ट्रेड लॉट तयार झाला: ${newLot.lotId || "नवीन लॉट"}` : `✅ Trade Lot created successfully: ${newLot.lotId || "New Lot"}`);
            setSavedToast(true);
            setTimeout(() => setSavedToast(false), 3000);
          }
        } catch (err) {
          console.error("Auto trade lot creation error:", err);
        }
      }

      // Smoothly scroll down to the ranked mandis
      setTimeout(() => {
        const el = document.getElementById("markets-near-you");
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    }, 350);
  }

  // 1. PUBLIC LANDING PAGE (Public entry point - NO private dashboard data)
  if (!currentUser || viewLanding) {
    return (
      <>
        <LandingPage
          onOpenAuth={(role, mode = "login") => {
            setAuthModalRole(role);
            setAuthModalMode(mode);
            setAuthModalOpen(true);
          }}
          onExploreFarmer={() => {
            setAuthModalRole("farmer");
            setAuthModalMode("login");
            setAuthModalOpen(true);
          }}
          onExploreBuyer={() => {
            setAuthModalRole("buyer");
            setAuthModalMode("login");
            setAuthModalOpen(true);
          }}
          lang={lang}
          onToggleLang={(newLang) => setLang(newLang)}
        />
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          onSuccess={(user) => {
            setCurrentUser(user);
            setViewLanding(false);
            setAuthModalOpen(false);
            setFarmerName(user.name);
            if (user.phone) setFarmerPhone(user.phone);
            if (user.village) setFarmerVillage(user.village);
            setSavedToastMsg(
              lang === "mr"
                ? `स्वागत आहे, ${user.name}! आपण यशस्वीरित्या जोडले गेला आहात.`
                : `Welcome, ${user.name}! Logged in successfully.`
            );
            setSavedToast(true);
            setTimeout(() => setSavedToast(false), 3500);
          }}
          lang={lang}
          initialRole={authModalRole}
          initialMode={authModalMode}
        />
      </>
    );
  }

  // 2. DEDICATED BUYER COMMAND DASHBOARD (Commercial Buyer Procurement)
  if (currentUser.role === "buyer") {
    return (
      <>
        <BuyerDashboard
          currentUser={currentUser}
          onLogout={() => {
            logoutUser();
            setCurrentUser(null);
            setViewLanding(true);
            setSavedToastMsg(lang === "mr" ? "यशस्वीरित्या लॉग आऊट झाले" : "Logged out successfully");
            setSavedToast(true);
            setTimeout(() => setSavedToast(false), 3000);
          }}
          onSwitchToLanding={() => setViewLanding(true)}
          lang={lang}
        />
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          onSuccess={(user) => {
            setCurrentUser(user);
            setAuthModalOpen(false);
          }}
          lang={lang}
          initialRole={authModalRole}
          initialMode={authModalMode}
        />
      </>
    );
  }

  // 3. FARMER COMMAND CENTER DASHBOARD (Producers & FPOs)
  return (
    <div className="min-h-screen bg-[#fbfbfa] text-slate-900 flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 text-slate-900 shadow-xs flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab("dashboard")}>
            <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-black text-xl shadow-xs flex-shrink-0">
              🌾
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-xl tracking-tight text-emerald-950 font-serif">KrishiSetu</span>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300/60 tracking-wider">
                  Farmer Command Center
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium tracking-wide">
                {farmerName} • {currentUser?.email || "farmer.lasalgaon@prisms.gov.in"}
              </p>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            <button
              type="button"
              onClick={() => setLang(lang === "en" ? "mr" : "en")}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              title="Toggle Language / भाषा बदला"
            >
              <span>{lang === "en" ? "मराठी" : "English"}</span>
            </button>

            <button
              type="button"
              onClick={() => setViewLanding(true)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              title="Public Landing Page"
            >
              <Store className="w-3.5 h-3.5 text-emerald-700" />
              <span className="hidden md:inline">{lang === "mr" ? "मुख्य पोर्टल" : "Public Portal"}</span>
            </button>

            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 bg-white transition-all cursor-pointer"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>

            {currentUser ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setProfileOpen(true)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  title="Profile"
                >
                  <UserIcon className="w-3.5 h-3.5 text-emerald-700" />
                  <span className="hidden sm:inline">{farmerName.split(" ")[0]}</span>
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await logoutUser();
                    setCurrentUser(null);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{lang === "mr" ? "बाहेर पडा" : "Logout"}</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setAuthModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition-all shadow-xs cursor-pointer"
              >
                {lang === "mr" ? "लॉग इन" : "Sign In"}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-6">
        {/* Horizontal Navigation Tabs Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-slate-200">
          {[
            { id: "dashboard", label: lang === "mr" ? "डॅशबोर्ड" : "Dashboard", icon: Layers },
            { id: "crops", label: lang === "mr" ? "व्यापार लॉट्स" : "Trade Lots", icon: Package, badge: activeLots.length },
            { id: "search", label: lang === "mr" ? "बाजार शोध" : "Market Search", icon: Search },
            { id: "offers", label: lang === "mr" ? "डिजिटल ऑफर्स" : "Digital Offers", icon: DollarSign },
            { id: "delivery", label: lang === "mr" ? "वितरण ट्रॅकिंग" : "Delivery", icon: Truck },
            { id: "payments", label: lang === "mr" ? "पेमेंट लेजर" : "Payment", icon: CreditCard },
            { id: "transactions", label: lang === "mr" ? "व्यवहार इतिहास" : "Trade History", icon: Clock },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? "bg-emerald-700 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      isActive ? "bg-emerald-800 text-emerald-100" : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Main Content Canvas */}
        <main className="flex-1 relative flex flex-col space-y-6">
        
        {/* ========================================================================= */}
        {/* TAB 1: DEFAULT DASHBOARD OVERVIEW (NET-EARNING CALCULATOR & FEED) */}
        {/* ========================================================================= */}
        {activeTab === "dashboard" && (
          <div className="px-5 pb-6 pt-3 md:px-7 md:pb-8 md:pt-3 relative z-10 flex flex-col gap-3.5 flex-1">
            <div
              className="absolute inset-0 pointer-events-none opacity-[0.03]"
              style={{
                backgroundImage: "radial-gradient(#002b02 1px, transparent 1px)",
                backgroundSize: "24px 24px",
              }}
            />

            {/* Hero Section */}
            <section className="mb-1">
              <div className="flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="px-2.5 py-0.5 bg-primary/10 text-primary rounded-full text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[14px]">{greeting.icon}</span>
                    <span>{lang === "mr" ? greeting.badge_mr : greeting.badge_en}</span>
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-outline-variant" />
                  <span className="text-[12px] font-bold text-outline flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-success-sage animate-pulse" />
                    <span>{formattedLiveDate} • {formattedLiveTime}</span>
                  </span>
                </div>
                <h2>
                  <BlurText
                    text={greeting[lang]}
                    className="text-[26px] md:text-[30px] font-extrabold text-on-surface leading-tight tracking-tight"
                  />
                </h2>
                <p className="text-[13px] md:text-[14px] font-medium text-on-surface-variant mt-0.5">
                  {lang === "mr" ? greeting.subtitle_mr : greeting.subtitle_en}
                </p>
              </div>
            </section>

            {/* Main Grid: Calculator & Price Forecast */}
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-12 flex flex-col gap-4">
                {/* Net-Earning Calculator */}
                <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.02)] overflow-hidden">
                  <div className="border-b border-outline-variant px-5 py-2.5 bg-surface flex justify-between items-center">
                    <h3 className="text-[17px] font-bold text-on-surface flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-[20px]">calculate</span>
                      {lang === "mr" ? "निव्वळ नफा गणक (Net-Earning Calculator)" : "Net-Earning Calculator"}
                    </h3>
                    <button
                      type="button"
                      onClick={handleReset}
                      className="text-primary text-[12px] font-bold hover:underline transition-all"
                    >
                      {lang === "mr" ? "पुनर्संचयित करा" : "Reset"}
                    </button>
                  </div>

                  <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-5 items-stretch">
                    <div className="lg:col-span-3 p-4 sm:p-5 flex flex-col justify-between gap-3 border-b lg:border-b-0 lg:border-r border-outline-variant/60">
                      <div className="flex flex-col gap-1">
                        <label htmlFor="calc-crop" className="text-[12px] font-bold text-on-surface-variant">
                          {lang === "mr" ? "१. पीक निवडा" : "1. Select Crop"}
                        </label>
                        <div className="relative">
                          <select
                            id="calc-crop"
                            value={cropId}
                            onChange={(e) => setCropId(e.target.value)}
                            className="w-full appearance-none bg-surface-container-low border border-outline-variant rounded-xl px-3.5 py-2 text-[14px] font-semibold text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all pr-10"
                          >
                            {commodities.length > 0 ? (
                              commodities.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {(CROP_EMOJI[c.name] ?? "🌾") +
                                    " " +
                                    (lang === "mr" ? (c.name_mr ?? CROP_MR_FALLBACK[c.name] ?? c.name) : c.name)}
                                </option>
                              ))
                            ) : (
                              <>
                                <option value="onion">🧅 {lang === "mr" ? "लाल कांदा (नाशिक)" : "Red Onion (Nashik Quality)"}</option>
                                <option value="wheat">🌾 {lang === "mr" ? "गहू" : "Hard Red Winter Wheat"}</option>
                                <option value="soy">🌱 {lang === "mr" ? "सोयाबीन" : "Soybeans"}</option>
                              </>
                            )}
                          </select>
                          <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none text-[20px]">
                            arrow_drop_down
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                          <label htmlFor="calc-qty" className="text-[12px] font-bold text-on-surface-variant">
                            {lang === "mr" ? "२. पिकाचे वजन" : "2. Quantity"}
                          </label>
                          <div className="relative">
                            <input
                              id="calc-qty"
                              type="number"
                              min={1}
                              value={qty}
                              onChange={(e) => setQty(e.target.value)}
                              className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-3.5 py-2 text-[14px] font-semibold text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 pl-3.5 pr-14 transition-all"
                            />
                            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[12px] font-bold text-on-surface-variant">
                              {qtyUnit}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col gap-1">
                          <label htmlFor="calc-vehicle" className="text-[12px] font-bold text-on-surface-variant">
                            {lang === "mr" ? "वाहन (Vehicle)" : "Vehicle"}
                          </label>
                          <div className="relative">
                            <select
                              id="calc-vehicle"
                              value={selectedVehicle}
                              onChange={(e) => setSelectedVehicle(e.target.value)}
                              className="w-full appearance-none bg-surface-container-low border border-outline-variant rounded-xl px-3.5 py-2 text-[14px] font-semibold text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all pr-10"
                            >
                              {VEHICLE_OPTIONS.map((v) => (
                                <option key={v.id} value={v.id}>
                                  {lang === "mr" ? v.name_mr : v.name} ({v.capacityQtl} Qtl)
                                </option>
                              ))}
                            </select>
                            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none text-[20px]">
                              arrow_drop_down
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label htmlFor="calc-labour" className="text-[12px] font-bold text-on-surface-variant">
                          {lang === "mr" ? "३. हमाली दर प्रति ट्रिप (₹)" : "3. Labour per Trip (₹)"}
                        </label>
                        <div className="relative">
                          <input
                            id="calc-labour"
                            type="number"
                            min={0}
                            value={labourPerTrip}
                            onChange={(e) => setLabourPerTrip(e.target.value)}
                            placeholder="500"
                            className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-3.5 py-2 text-[14px] font-semibold text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all pr-8"
                          />
                          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[12px] font-bold text-on-surface-variant">
                            ₹
                          </span>
                        </div>
                      </div>

                      {/* Dynamic Current Location & Automated Mandi Discovery Display */}
                      <div className="flex flex-col gap-1.5 bg-primary/5 border border-primary/20 rounded-xl p-2.5 shadow-xs">
                        <div className="flex flex-wrap items-center justify-between gap-1.5 text-[11.5px] font-bold">
                          <span className="flex items-center gap-1.5 text-primary">
                            <span className="material-symbols-outlined text-[15px]">
                              {locationSource === "GPS" ? "my_location" : locationSource === "PROFILE" ? "bookmark" : "edit_location"}
                            </span>
                            <span>
                              {lang === "mr" ? "सध्याचे स्थान (Current Location): " : "Current Location: "}
                              <strong className="text-on-surface font-extrabold">{locationText}</strong>
                            </span>
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">
                              {locationSource === "GPS"
                                ? (lang === "mr" ? "[GPS स्थान]" : "[GPS Auto-detected]")
                                : locationSource === "PROFILE"
                                ? (lang === "mr" ? "[प्रोफाईल]" : "[Saved Profile]")
                                : (lang === "mr" ? "[हस्तचलित]" : "[Manual Input]")}
                            </span>
                            <button
                              type="button"
                              onClick={handleUseMyLocation}
                              title={lang === "mr" ? "सध्याचे GPS लोकेशन शोधा" : "Use current GPS location"}
                              className="p-1 text-primary hover:bg-primary-container/10 rounded-full transition-colors cursor-pointer"
                            >
                              <span className={`material-symbols-outlined text-[15px] ${locating ? "animate-spin" : ""}`}>
                                {locating ? "sync" : "my_location"}
                              </span>
                            </button>
                          </div>
                        </div>
                        <div className="text-[11px] font-bold text-on-surface-variant/90 border-t border-primary/15 pt-1 flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[14px] text-primary shrink-0">auto_awesome</span>
                          <span>
                            {lang === "mr" 
                              ? `स्वयंचलित मंडी शोध: आपल्या स्थानावरून सर्वोत्कृष्ट मंड्यांचा नफ्यानुसार शोध व क्रमवारी` 
                              : `Automated Mandi Discovery: Discovering & ranking best profitable mandis from your origin`}
                          </span>
                        </div>
                      </div>

                      {locationNoticeMsg && (
                        <div className="p-1.5 bg-alert-terracotta/10 border border-alert-terracotta/30 rounded-lg flex items-center justify-between text-[11px] font-bold text-alert-terracotta">
                          <div className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[15px]">location_disabled</span>
                            <span>{locationNoticeMsg}</span>
                          </div>
                          <button
                            type="button"
                            onClick={handleUseMyLocation}
                            className="px-2 py-0.5 bg-primary text-on-primary rounded hover:bg-primary-container text-[10px] font-bold shrink-0 ml-2 cursor-pointer"
                          >
                            {lang === "mr" ? "स्थान वापरा" : "Use My Location"}
                          </button>
                        </div>
                      )}

                      <div className="flex items-center justify-between bg-surface-container-low/70 border border-outline-variant/60 rounded-xl px-3.5 py-2">
                        <label htmlFor="calc-coldchain" className="text-[12px] font-bold text-on-surface-variant cursor-pointer flex items-center gap-2">
                          <span className="material-symbols-outlined text-[16px] text-primary">ac_unit</span>
                          <span>{lang === "mr" ? "कोल्ड-चेन / वातानुकूलित वाहतूक (Cold-chain Transport)" : "Cold-chain / Covered Transport"}</span>
                        </label>
                        <input
                          id="calc-coldchain"
                          type="checkbox"
                          checked={isColdChain}
                          onChange={(e) => setIsColdChain(e.target.checked)}
                          className="w-4 h-4 accent-primary rounded cursor-pointer"
                        />
                      </div>

                      {formError && (
                        <p className="rounded-xl bg-alert-terracotta/10 px-3 py-1.5 text-[12px] font-bold text-alert-terracotta">
                          {formError}
                        </p>
                      )}
                    </div>

                    <div className="lg:col-span-2 bg-surface-container p-4 sm:p-5 flex flex-col justify-between gap-3 relative">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                      <div>
                        <h4 className="text-[11px] font-extrabold text-on-surface-variant mb-2 uppercase tracking-wider relative z-10 flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[15px] text-primary">monitoring</span>
                          {lang === "mr" ? "निव्वळ नफा तपशील" : "True Net Breakdown"}
                        </h4>
                        <div className="space-y-1.5 relative z-10">
                          <div className="flex justify-between items-center border-b border-outline-variant/40 pb-1.5">
                            <span className="text-[12px] text-on-surface-variant font-medium">
                              {lang === "mr" ? "एकूण विक्री मूल्य" : "Gross Market Value"}
                            </span>
                            <span className="text-[14px] font-bold text-on-surface">
                              ₹{grossValue.toLocaleString("en-IN")}
                            </span>
                          </div>
                          <div className="flex justify-between items-center border-b border-outline-variant/40 pb-1.5">
                            <span className="text-[12px] text-on-surface-variant font-medium flex items-center gap-1.5">
                              <span>{lang === "mr" ? "वाहतूक खर्च" : "Transport Freight"}</span>
                              {selectedVehicle === "own_vehicle" && (
                                <span className="text-[10px] font-extrabold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                                  {lang === "mr" ? "बाहेरील भाडे नाही" : "No External Freight"}
                                </span>
                              )}
                            </span>
                            <span className={`text-[12px] font-bold ${selectedVehicle === "own_vehicle" || logisticsCost === 0 ? "text-primary font-extrabold" : "text-alert-terracotta"}`}>
                              {selectedVehicle === "own_vehicle" || logisticsCost === 0 ? "₹0" : `-₹${logisticsCost.toLocaleString("en-IN")}`}
                            </span>
                          </div>
                          <div className="flex justify-between items-center border-b border-outline-variant/40 pb-1.5">
                            <span className="text-[12px] text-on-surface-variant font-medium">
                              {lang === "mr" 
                                ? `अंदाजित साठवणूक नासाडी नुकसान (${commodity?.spoilage_rate_percent || 8}%)` 
                                : `Estimated Spoilage Loss (${commodity?.spoilage_rate_percent || 8}%)`}
                            </span>
                            <span className="text-[12px] font-bold text-alert-terracotta">
                              -₹{spoilageLoss.toLocaleString("en-IN")}
                            </span>
                          </div>
                          <div className="flex justify-between items-center border-b border-outline-variant/40 pb-1.5">
                            <span className="text-[12px] text-on-surface-variant font-medium">
                              {lang === "mr" ? "बाजार हाताळणी खर्च (अंदाजित १%)" : "Est. Market Handling Charges (1.0%)"}
                            </span>
                            <span className="text-[12px] font-bold text-alert-terracotta">
                              -₹{marketHandlingCharges.toLocaleString("en-IN")}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="relative z-10 flex flex-col gap-2">
                        <div>
                          <p className="text-[11px] font-extrabold uppercase tracking-wider text-on-surface-variant mb-0.5">
                            {lang === "mr" ? "हातात येणारा निव्वळ नफा" : "Estimated Net Profit"}
                          </p>
                          <p className="text-[28px] sm:text-[32px] text-primary font-black leading-none tracking-tight">
                            ₹{estimatedNetProfit.toLocaleString("en-IN")}
                          </p>
                        </div>
                        <button
                          type="submit"
                          disabled={calculating}
                          className="w-full h-11 bg-primary text-on-primary font-extrabold text-[14px] rounded-xl hover:bg-primary-container transition-all shadow-md hover:shadow-lg flex justify-center items-center gap-2 active:scale-[0.98] cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                          <span className={`material-symbols-outlined text-[18px] ${calculating ? "animate-spin" : ""}`}>
                            {calculating ? "sync" : "analytics"}
                          </span>
                          <span>
                            {calculating
                              ? (lang === "mr" ? "गणन सुरू आहे..." : "Calculating...")
                              : (lang === "mr" ? "निव्वळ कमाई व सर्वोत्तम बाजार शोधा" : "Calculate & Find Best Mandi")}
                          </span>
                        </button>
                      </div>
                    </div>
                  </form>
                </div>

                {/* PRISMS AI Mandi Optimization & Ranked Mandis (Shown only after clicking Calculate) */}
                {submitted && bestResult && (
                  <>
                    {/* Markets Near You (Ranked by True Net Take-Home Earnings) */}
                    <div id="market-ranking" data-section="markets-near-you" className="space-y-5 pt-2 scroll-mt-20 animate-fade-in">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-[22px] font-extrabold text-on-surface">
                              {lang === "mr" ? "आपल्या परिसरातील बाजारपेठा (निव्वळ नफ्यानुसार क्रमवारी)" : "Markets near you (Ranked by Take-Home Profit)"}
                            </h3>
                            <span className="px-2.5 py-0.5 bg-success-sage/20 text-success-sage font-extrabold text-[11px] rounded-full flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-success-sage" />
                              {lang === "mr" ? "थेट सरकारी मंडी दर (Data.gov.in)" : "Latest Govt Mandi Data (Data.gov.in)"}
                            </span>
                          </div>
                          <p className="text-[13px] text-on-surface-variant font-medium mt-0.5">
                            {lang === "mr"
                              ? `${locationText || "आपल्या भागातून"} विविध APMC बाजार समित्यांमधील निव्वळ नफा तुलना (${qtyNum.toLocaleString("en-IN")} किलो ${commodity ? (lang === "mr" ? (commodity.name_mr ?? commodity.name) : commodity.name) : ""}) • स्त्रोत: भारत सरकार Data.gov.in थेट एपीआय`
                              : `Comparing true net earnings from ${locationText.split(",")[0] || "your origin"} across regional APMC mandis (${qtyNum.toLocaleString("en-IN")} Kg harvest) • Source: Govt of India Data.gov.in Live API`}
                          </p>
                        </div>
                        <span className="px-3.5 py-1 bg-primary/10 text-primary font-extrabold text-[12px] rounded-full border border-primary/20 shrink-0">
                          {results.length} {lang === "mr" ? "बाजारपेठांचे विश्लेषण" : "Markets Analyzed"}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {results.map((r, idx) => (
                          <MandiCard
                            key={r.market.id}
                            result={r}
                            lang={lang}
                            isBest={idx === 0}
                            isHighestListed={r.market.id === highestListedId}
                            bestNet={results[0]?.net ?? 0}
                            showTrend={true}
                          />
                        ))}
                      </div>
                    </div>

                    {/* PRISMS AI Mandi Optimization & MSP Benchmark Card */}
                    <div className="bg-gradient-to-br from-surface-container-high to-surface-container border-2 border-primary/20 rounded-xl p-6 shadow-sm tactile-hover relative overflow-hidden animate-fade-in">
                      <BorderBeam size={250} duration={6} colorFrom="#3b6934" colorTo="#fe932c" />
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 relative z-10">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-lg bg-primary text-on-primary flex items-center justify-center shadow-sm">
                            <span className="material-symbols-outlined text-[20px] icon-fill">verified</span>
                          </div>
                          <div>
                            <h4 className="text-[17px] font-extrabold text-on-surface">
                              {lang === "mr" ? "कृषीसेतू AI शिफारस" : "KrishiSetu Spatial Optimization AI"}
                            </h4>
                            <p className="text-[12px] text-on-surface-variant font-medium">
                              {lang === "mr"
                                ? "वाहतूक खर्च, नासाडी व अडत वजा करून खरी नफा कमाई"
                                : "True Net Realization Formula: Gross Sale - Transport - APMC Fees - Transit Loss"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 bg-success-sage/20 text-success-sage rounded-full text-[12px] font-extrabold flex items-center gap-1">
                            <span className="material-symbols-outlined text-[15px]">trending_up</span>
                            {lang === "mr" ? "हमीभावापेक्षा जास्त नफा" : "Optimal Realization"}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-4">
                        <div className="bg-surface p-4 rounded-xl border border-outline-variant/60">
                          <span className="text-[11px] font-bold uppercase text-on-surface-variant">
                            {lang === "mr" ? "सर्वोत्तम बाजार समिती" : "Recommended Mandi"}
                          </span>
                          <p className="text-[18px] font-extrabold text-primary mt-1">{bestResult.market.name}</p>
                          <p className="text-[12px] text-on-surface-variant">
                            {bestResult.market.distance_km.toFixed(1)} km • ₹{bestResult.pricePerQtl.toLocaleString("en-IN")}/Qtl Gross
                          </p>
                        </div>

                        <div className="bg-surface p-4 rounded-xl border border-outline-variant/60">
                          <span className="text-[11px] font-bold uppercase text-on-surface-variant">
                            {lang === "mr" ? "हातात येणारा खरा नफा" : "Take-Home Realization"}
                          </span>
                          <p className="text-[18px] font-extrabold text-success-sage mt-1">
                            ₹{Math.round(bestResult.net / Math.max(1, qtyNum / 100)).toLocaleString("en-IN")} / Qtl
                          </p>
                          <p className="text-[12px] text-on-surface-variant">
                            {results[1] && bestResult.net - results[1].net > 0 ? (
                              lang === "mr"
                                ? `+₹${(bestResult.net - results[1].net).toLocaleString("en-IN")} दुसऱ्या बाजारापेक्षा जास्त`
                                : `+₹${(bestResult.net - results[1].net).toLocaleString("en-IN")} extra vs 2nd Best Mandi`
                            ) : (
                              lang === "mr" ? "सर्वोच्च नफा देणारा पर्याय" : "Highest Return Option"
                            )}
                          </p>
                        </div>

                        <div className="bg-surface p-4 rounded-xl border border-outline-variant/60">
                          <span className="text-[11px] font-bold uppercase text-on-surface-variant">
                            {lang === "mr" ? "एकूण प्रत्यक्ष निव्वळ नफा" : "Total Net Profit"}
                          </span>
                          <p className="text-[18px] font-extrabold text-on-surface mt-1">
                            ₹{bestResult.net.toLocaleString("en-IN")}
                          </p>
                          <p className="text-[12px] text-success-sage font-bold">✓ {lang === "mr" ? "सर्व खर्च वजा जाता" : "After All Transit Deductions"}</p>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2 border-t border-outline-variant/40 mt-2">
                        <p className="text-[13px] text-on-surface-variant leading-relaxed">
                          💡 <strong>{lang === "mr" ? "AI विश्लेषण:" : "Why this Mandi?"}</strong>{" "}
                          {lang === "mr"
                            ? `${bestResult.market.name} हे ${bestResult.market.distance_km.toFixed(1)} किमी अंतरावर असूनही, तिथला ₹${bestResult.pricePerQtl.toLocaleString("en-IN")}/क्विंटल दर वाहतूक खर्च भरून काढतो आणि आपल्याला ₹${bestResult.net.toLocaleString("en-IN")} चा निव्वळ नफा मिळवून देतो.`
                            : `Even with ${bestResult.market.distance_km.toFixed(1)} km transit, ${bestResult.market.name}'s ₹${bestResult.pricePerQtl.toLocaleString("en-IN")}/Qtl price covers freight and yields ₹${bestResult.net.toLocaleString("en-IN")} net cash in hand.`}
                        </p>
                        <button
                          type="button"
                          onClick={() => setActiveTab("search")}
                          className="whitespace-nowrap px-4 py-2 bg-primary text-on-primary rounded-lg text-[13px] font-bold hover:bg-primary-container transition-colors shadow-sm flex items-center gap-1.5 active:scale-95 cursor-pointer shrink-0"
                        >
                          <span>{lang === "mr" ? "GIS नकाशावर पहा" : "View on GIS Map"}</span>
                          <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                        </button>
                      </div>

                      {/* Phase 17: Nearest vs Most Profitable Mandi Comparison Callout */}
                      {nearestMarket && nearestMarket.market.id !== bestResult.market.id && (
                        <div className="mt-3 p-3 bg-primary/10 border border-primary/20 rounded-xl text-[12px] text-on-surface flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-[18px] text-primary shrink-0">alt_route</span>
                            <div>
                              <span className="font-extrabold text-primary">
                                {lang === "mr" ? "जवळची मंडी विरुद्ध सर्वाधिक नफ्याची मंडी:" : "Nearest vs Most Profitable Mandi:"}
                              </span>{" "}
                              <span className="font-semibold text-on-surface-variant">
                                {lang === "mr"
                                  ? `जवळची: ${nearestMarket.market.name} (${nearestMarket.market.distance_km.toFixed(1)} किमी • निव्वळ: ₹${nearestMarket.net.toLocaleString("en-IN")}) | सर्वाधिक नफा: ${bestResult.market.name} (${bestResult.market.distance_km.toFixed(1)} किमी • निव्वळ: ₹${bestResult.net.toLocaleString("en-IN")})`
                                  : `Nearest: ${nearestMarket.market.name} (${nearestMarket.market.distance_km.toFixed(1)} km • Net: ₹${nearestMarket.net.toLocaleString("en-IN")}) | Most Profitable: ${bestResult.market.name} (${bestResult.market.distance_km.toFixed(1)} km • Net: ₹${bestResult.net.toLocaleString("en-IN")})`}
                              </span>
                            </div>
                          </div>
                          <span className="text-[11px] font-extrabold text-success-sage bg-success-sage/10 border border-success-sage/20 px-2.5 py-1 rounded-md shrink-0">
                            +₹{(bestResult.net - nearestMarket.net).toLocaleString("en-IN")} {lang === "mr" ? "अधिक निव्वळ नफा" : "extra net return"}
                          </span>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: MARKET SEARCH / DISCOVERY (SPLIT-VIEW FILTERS + GIS MAP) */}
        {/* ========================================================================= */}
        {activeTab === "search" && (
          <div className="flex-1 flex overflow-hidden w-full h-[calc(100vh-64px)] shrink-0">
            {/* Left Panel: Filters & Ranked Markets (450px) */}
            <div className="w-[450px] bg-surface border-r border-outline-variant flex flex-col shrink-0 overflow-y-auto custom-scrollbar">
              {/* Smart Filters */}
              <div className="p-6 border-b border-outline-variant bg-surface-container-low/50">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-[18px] font-bold text-on-surface">
                    {lang === "mr" ? "बाजार शोध निकष" : "Discovery Filters"}
                  </h2>
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="text-[12px] font-bold text-primary underline hover:text-primary-container"
                  >
                    {lang === "mr" ? "सर्व रीसेट करा" : "Reset All"}
                  </button>
                </div>
                <div className="space-y-4">
                  {/* Origin Location Display & Badge */}
                  <div className="p-2.5 bg-surface-container border border-outline-variant/60 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="material-symbols-outlined text-primary text-[20px] shrink-0">location_on</span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-outline uppercase tracking-wider">
                            {lang === "mr" ? "उगम स्थान" : "Farm Origin"}
                          </span>
                          <span className="text-[10px] font-bold px-1.5 py-0.2 bg-primary/10 text-primary rounded">
                            {locationSource === "GPS"
                              ? (lang === "mr" ? "GPS स्थान" : "Current Location")
                              : locationSource === "PROFILE"
                              ? (lang === "mr" ? "शेत स्थान" : "Saved Farm Location")
                              : (lang === "mr" ? "हस्तचलित" : "Manual Location")}
                          </span>
                        </div>
                        <p className="text-[13px] font-extrabold text-on-surface truncate">
                          {locationText}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleUseMyLocation}
                      title={lang === "mr" ? "सध्याचे GPS स्थान शोधा" : "Detect live GPS location"}
                      className="p-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-colors shrink-0 ml-2 cursor-pointer"
                    >
                      <span className={`material-symbols-outlined text-[18px] ${locating ? "animate-spin" : ""}`}>
                        {locating ? "sync" : "my_location"}
                      </span>
                    </button>
                  </div>

                  {locationNoticeMsg && (
                    <div className="p-2 bg-alert-terracotta/10 border border-alert-terracotta/30 rounded-lg flex items-center justify-between text-[11px] font-bold text-alert-terracotta">
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px]">location_disabled</span>
                        <span>{locationNoticeMsg}</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleUseMyLocation}
                        className="px-2 py-0.5 bg-primary text-on-primary rounded hover:bg-primary-container text-[10px] font-bold shrink-0 ml-2 cursor-pointer"
                      >
                        {lang === "mr" ? "स्थान वापरा" : "Use My Location"}
                      </button>
                    </div>
                  )}
                  {/* Mandi Name / City Live Search Box */}
                  <div>
                    <label className="block text-[12px] font-bold text-on-surface-variant mb-1">
                      {lang === "mr" ? "मंडी किंवा शहर शोधा" : "Search Mandi or City"}
                    </label>
                    <form onSubmit={(e) => { e.preventDefault(); }} className="flex gap-2">
                      <div className="relative flex-1">
                        <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-outline text-[18px]">
                          search
                        </span>
                        <input
                          type="text"
                          value={mandiSearchQuery}
                          onChange={(e) => setMandiSearchQuery(e.target.value)}
                          placeholder={lang === "mr" ? "उदा. पुणे, लासलगाव, वाशी, नाशिक..." : "e.g. Pune, Lasalgaon, Vashi, Nashik..."}
                          className="w-full pl-8 pr-8 py-2 bg-surface-container-highest border border-outline-variant/60 rounded-md text-[13px] font-bold focus:ring-2 focus:ring-primary outline-none text-on-surface"
                        />
                        {mandiSearchQuery && (
                          <button
                            type="button"
                            onClick={() => setMandiSearchQuery("")}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface"
                          >
                            <span className="material-symbols-outlined text-[16px]">close</span>
                          </button>
                        )}
                      </div>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-primary text-on-primary font-bold text-[13px] rounded-md hover:bg-primary-container transition-all flex items-center gap-1 shrink-0 shadow-sm cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[18px]">search</span>
                        <span>{lang === "mr" ? "शोधा" : "Search"}</span>
                      </button>
                    </form>
                  </div>

                  {/* Search Radius */}
                  <div>
                    <label className="block text-[13px] font-bold text-on-surface-variant mb-2">
                      {lang === "mr" ? `अंतर मर्यादा: ${searchRadius} किमी` : `Search Radius: ${searchRadius} km`}
                    </label>
                    <input
                      className="w-full accent-primary cursor-pointer"
                      max={200}
                      min={10}
                      type="range"
                      value={searchRadius}
                      onChange={(e) => setSearchRadius(Number(e.target.value))}
                    />
                    <div className="flex justify-between text-[11px] font-semibold text-outline mt-1">
                      <span>10 km</span>
                      <span>200 km</span>
                    </div>
                  </div>

                  {/* Select Crop */}
                  <div>
                    <label className="block text-[12px] font-bold text-on-surface-variant mb-1">
                      {lang === "mr" ? "पिकाची निवड (Select Crop)" : "Select Crop"}
                    </label>
                    <select
                      value={discoveryCrop}
                      onChange={(e) => {
                        const val = e.target.value;
                        setDiscoveryCrop(val);
                        if (val.includes("Tomato")) setCropId("tomato_1");
                        else if (val.includes("Onion")) setCropId("onion_1");
                        else if (val.includes("Banana")) setCropId("banana_1");
                        else if (val.includes("Wheat")) setCropId("wheat_1");
                      }}
                      className="w-full bg-surface-container-highest border border-outline-variant/60 rounded-md text-[13px] font-bold p-2 text-on-surface focus:ring-2 focus:ring-primary outline-none cursor-pointer"
                    >
                      <option value="Red Onion (Nashik)">{lang === "mr" ? "कांदा (Onion / Red Onion)" : "Red Onion"}</option>
                      <option value="Tomato">{lang === "mr" ? "टोमॅटो (Tomato)" : "Tomato"}</option>
                      <option value="Banana">{lang === "mr" ? "केळी (Banana)" : "Banana"}</option>
                      <option value="Wheat (HD-2967)">{lang === "mr" ? "गहू (Wheat)" : "Wheat"}</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Ranked Results */}
              <div className="p-6 flex-1 bg-surface space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-[18px] font-bold text-on-surface">
                    {lang === "mr" ? "सर्वोत्तम बाजारपेठा" : "Top Markets"}
                  </h2>
                  <span className="text-[12px] font-bold px-2.5 py-0.5 bg-primary-container/15 text-primary rounded-full">
                    {lang === "mr" ? `${searchRadius} किमी परिसरात ${filteredMandis.length} मंड्या` : `${filteredMandis.length} Markets Within ${searchRadius} km`}
                  </span>
                </div>

                {/* Dynamically Filtered Mandi Cards */}
                {filteredMandis.map((mandiCard) => (
                  <div
                    key={mandiCard.id}
                    onClick={() => setSelectedMandiPin(mandiCard.id)}
                    className={`tactile-hover bg-surface-container-high border rounded-xl p-4 relative overflow-hidden cursor-pointer transition-all ${
                      selectedMandiPin === mandiCard.id
                        ? "border-primary ring-2 ring-primary/30 shadow-md"
                        : "border-outline-variant"
                    }`}
                  >
                    <div className={`absolute top-0 right-0 w-2 h-full ${mandiCard.indicatorColor}`} />
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        {mandiSearchQuery.trim() && selectedMandiPin === mandiCard.id && (
                          <span className="inline-block text-[10px] font-extrabold text-on-primary bg-primary px-2 py-0.5 rounded-full mb-1">
                            {lang === "mr" ? "प्रत्यक्ष शोध निकाल" : "Direct Search Result"}
                          </span>
                        )}
                        <h3 className="text-[18px] font-bold text-on-surface">
                          {lang === "mr" ? mandiCard.name_mr : mandiCard.name}
                        </h3>
                        <p className="text-[13px] font-medium text-on-surface-variant">
                          {mandiCard.dist} km away ({locationText.split(",")[0]} → {mandiCard.name.split(" ")[0]}) • <span className={`${mandiCard.tagColor} font-bold`}>{lang === "mr" ? mandiCard.tag_mr : mandiCard.tag}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-[22px] font-extrabold ${mandiCard.tagColor} leading-none`}>₹{mandiCard.gross}</p>
                        <p className="text-[11px] font-bold text-outline mt-1">/ Qtl ({discoveryCrop.split(" ")[0]})</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-3 bg-surface-container-highest rounded-lg p-2.5">
                      <div className="text-center">
                        <p className="text-[11px] font-bold text-on-surface-variant">
                          {lang === "mr" ? "वाहतूक खर्च" : "Logistics"}
                        </p>
                        <p className="text-[13px] font-extrabold text-alert-terracotta">-₹{mandiCard.logistics}</p>
                      </div>
                      <div className="text-center border-x border-outline-variant">
                        <p className="text-[11px] font-bold text-on-surface-variant">
                          {lang === "mr" ? "हमाली/सेस" : "Handling"}
                        </p>
                        <p className="text-[13px] font-extrabold text-alert-terracotta">-₹{mandiCard.handling}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[11px] font-bold text-primary">
                          {lang === "mr" ? "निव्वळ नफा" : "Net Return"}
                        </p>
                        <p className="text-[14px] font-extrabold text-primary">₹{mandiCard.net}</p>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Empty State when no filters match */}
                {filteredMandis.length === 0 && (
                  <div className="p-8 text-center bg-surface-container-low rounded-xl border border-outline-variant/60">
                    <span className="material-symbols-outlined text-outline text-[36px] mb-2">search_off</span>
                    <p className="text-[14px] font-bold text-on-surface">
                      {lang === "mr" ? `${searchRadius} किमीच्या मर्यादामध्ये कोणतीही बाजारपेठ सापडली नाही.` : `No matching markets found within ${searchRadius} km.`}
                    </p>
                    <p className="text-[12px] text-on-surface-variant mt-1">
                      {lang === "mr" ? "कृपया अंतर मर्यादा वाढवा किंवा शोध शब्द बदला." : "Try increasing the search radius or changing your search query."}
                    </p>
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="mt-3 px-4 py-1.5 bg-primary text-on-primary rounded-lg text-[12px] font-bold cursor-pointer"
                    >
                      {lang === "mr" ? "सर्व निकष रीसेट करा" : "Reset Filters"}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Right Panel: Interactive Real Leaflet GIS Map */}
            <div className="flex-1 relative bg-surface-stone overflow-hidden flex flex-col min-h-[500px]">
              <RealGisMap
                markets={markets}
                userCoords={coords || { lat: 18.9102, lng: 73.3283 }}
                userLocationName={locationText.split(",")[0] || "Karjat"}
                selectedMandiId={selectedMandiPin}
                onSelectMandi={(id) => setSelectedMandiPin(id)}
                onDetectLocation={handleUseMyLocation}
                searchRadiusKm={searchRadius}
                searchScope="nearby"
                searchQuery={mandiSearchQuery}
                lang={lang}
                bestMandiId={bestResult?.market.id || "lasalgaon"}
                commodityName={discoveryCrop}
              />
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: PRICE ANALYTICS (COMMODITY ANALYSIS & REALIZATION WATERFALL) */}
        {/* ========================================================================= */}
        {activeTab === "analytics" && (
          <div className="px-6 pb-6 pt-3 md:px-8 md:pb-8 md:pt-4 relative z-10 flex flex-col gap-6 flex-1">
            {/* Page Header & Crop Selector */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-2">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-3 py-1 bg-surface-container-high rounded-md text-[12px] font-bold text-on-surface-variant uppercase tracking-wider">
                    {lang === "mr" ? "पीक दर विश्लेषण" : "Commodity Analysis"}
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-outline-variant" />
                  <span className="text-[12px] font-medium text-outline">
                    {lang === "mr" ? "२ तासांपूर्वी अद्यतनित" : "Updated 2h ago"}
                  </span>
                </div>
                <h2 className="text-[28px] md:text-[34px] font-bold text-on-surface tracking-tight">
                  {commodity
                    ? (lang === "mr" ? `${commodity.name_mr ?? commodity.name} (बाजार मानक)` : `${commodity.name} (Market Standard)`)
                    : (lang === "mr" ? "लाल कांदा (नाशिक प्रत)" : "Red Onion (Nashik Quality)")}
                </h2>
              </div>
              <div className="flex flex-wrap gap-3 items-center">
                {/* Region Selector */}
                <div className="relative">
                  <select
                    value={selectedRegion}
                    onChange={(e) => setSelectedRegion(e.target.value)}
                    className="appearance-none flex items-center gap-3 px-5 py-3 pr-10 bg-surface-container-lowest border border-outline-variant rounded-lg text-[14px] font-bold text-on-surface hover:bg-surface-container-low transition-colors cursor-pointer outline-none focus:border-primary"
                  >
                    <option value="Maharashtra Region">{lang === "mr" ? "महाराष्ट्र विभाग" : "Maharashtra Region"}</option>
                    <option value="Madhya Pradesh Region">{lang === "mr" ? "मध्य प्रदेश विभाग" : "Madhya Pradesh Region"}</option>
                    <option value="Gujarat Region">{lang === "mr" ? "गुजरात विभाग" : "Gujarat Region"}</option>
                    <option value="Karnataka Region">{lang === "mr" ? "कर्नाटक विभाग" : "Karnataka Region"}</option>
                  </select>
                  <span className="material-symbols-outlined text-on-surface-variant absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[20px]">
                    arrow_drop_down
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => alert(lang === "mr" ? "बाजार भाव व विश्लेषण अहवाल (PDF) डाऊनलोड होत आहे..." : "Downloading Mandi Price & Analytics Report (PDF)...")}
                  className="flex items-center gap-2 px-6 py-3 bg-primary text-on-primary rounded-lg text-[14px] font-bold hover:bg-primary-container transition-colors shadow-sm active:scale-95"
                >
                  <span className="material-symbols-outlined text-[18px]">download</span>
                  {lang === "mr" ? "अहवाल डाऊनलोड करा" : "Export Report"}
                </button>
              </div>
            </div>

            {/* Top Row: Main Chart & Recommendation */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Main Interactive Chart */}
              <div className="lg:col-span-8 bg-surface-container-high rounded-xl border border-outline-variant p-6 flex flex-col tactile-hover">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-[18px] md:text-[20px] font-bold text-on-surface">
                    {lang === "mr" ? "किंमत कल आणि हवामान/सणांचे परिणाम" : "Price Trend & Event Impact"}
                  </h3>
                  <div className="flex bg-surface-container rounded-lg p-1 border border-outline-variant">
                    <button
                      type="button"
                      onClick={() => setAnalyticsRange("30D")}
                      className={`px-4 py-1.5 rounded-md text-[12px] font-bold transition-colors ${
                        analyticsRange === "30D"
                          ? "bg-surface-container-lowest shadow-sm text-primary font-extrabold"
                          : "text-on-surface-variant hover:bg-surface-container-highest"
                      }`}
                    >
                      30D
                    </button>
                    <button
                      type="button"
                      onClick={() => setAnalyticsRange("60D")}
                      className={`px-4 py-1.5 rounded-md text-[12px] font-bold transition-colors ${
                        analyticsRange === "60D"
                          ? "bg-surface-container-lowest shadow-sm text-primary font-extrabold"
                          : "text-on-surface-variant hover:bg-surface-container-highest"
                      }`}
                    >
                      60D
                    </button>
                    <button
                      type="button"
                      onClick={() => setAnalyticsRange("90D")}
                      className={`px-4 py-1.5 rounded-md text-[12px] font-bold transition-colors ${
                        analyticsRange === "90D"
                          ? "bg-surface-container-lowest shadow-sm text-primary font-extrabold"
                          : "text-on-surface-variant hover:bg-surface-container-highest"
                      }`}
                    >
                      90D
                    </button>
                  </div>
                </div>

                <div className="relative flex-1 min-h-[300px] w-full bg-surface-container-lowest rounded-xl border border-outline-variant p-4 overflow-hidden">
                  <SimpleGraph
                    data={analyticsData}
                    color="#002b02"
                    gradientFrom="#1b4d18"
                    gradientTo="#1b4d1800"
                    height={280}
                    showConfidenceInterval={true}
                    showGrid={true}
                    lang={lang}
                    currencySymbol="₹"
                    unit="/ Qtl"
                  />
                </div>
              </div>

              {/* Sell vs Wait Recommendation */}
              <div className="lg:col-span-4 flex flex-col gap-6">
                <div className="bg-surface-bright rounded-xl border border-outline-variant p-6 flex-1 flex flex-col tactile-hover relative overflow-hidden">
                  <BorderBeam size={220} duration={5} colorFrom="#3b6934" colorTo="#154212" />
                  <div
                    className="absolute inset-0 opacity-[0.03] pointer-events-none"
                    style={{
                      backgroundImage: "radial-gradient(#002b02 1px, transparent 1px)",
                      backgroundSize: "16px 16px",
                    }}
                  />
                  <div className="flex items-center gap-2 mb-4 relative z-10">
                    <span className="material-symbols-outlined text-warning-burnt-orange text-[22px]">insights</span>
                    <h3 className="text-[18px] font-bold text-on-surface">
                      {lang === "mr" ? "बाजारपेठ संकेत" : "Market Signal"}
                    </h3>
                  </div>
                  <div className="text-center py-6 border-b border-outline-variant/50">
                    <div className="inline-block px-5 py-2 bg-success-sage/10 rounded-full mb-3">
                      <span className="text-[20px] font-extrabold text-success-sage tracking-wide">
                        {lang === "mr" ? "विक्रीसाठी अनुकूल स्थिती" : "Favorable Selling Window"}
                      </span>
                    </div>
                    <p className="text-[13px] text-on-surface-variant leading-relaxed">
                      {lang === "mr"
                        ? "स्थानिक बाजारभाव सध्या सरासरीपेक्षा अनुकूल आहेत. माल पाठवण्यापूर्वी निव्वळ नफ्याची पडताळणी करा."
                        : "Benchmark prices are currently above the recent regional trend. Compare net realization before dispatch."}
                    </p>
                  </div>

                  <div className="py-6 mt-auto">
                    <div className="flex justify-between text-[13px] text-on-surface-variant font-medium mb-2">
                      <span>{lang === "mr" ? "संकेत तीव्रता" : "Signal Strength"}</span>
                      <span className="font-bold text-primary">
                        {lang === "mr" ? "मध्यम (Moderate)" : "Moderate"}
                      </span>
                    </div>
                    <div className="flex gap-1 h-3 w-full">
                      <div className="flex-1 bg-success-sage rounded-l-sm" />
                      <div className="flex-1 bg-success-sage" />
                      <div className="flex-1 bg-success-sage" />
                      <div className="flex-1 bg-surface-container-highest" />
                      <div className="flex-1 bg-surface-container-highest rounded-r-sm" />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setAlertSet(!alertSet)}
                    className={`w-full flex items-center justify-center gap-2 py-3 border-2 border-primary text-primary rounded-lg text-[14px] font-bold transition-all active:scale-95 ${
                      alertSet ? "bg-primary text-on-primary" : "hover:bg-primary/5"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {alertSet ? "notifications_active" : "notifications"}
                    </span>
                    {alertSet
                      ? (lang === "mr" ? "किंमत अलर्ट सक्रिय आहे" : "Price Alert Activated")
                      : (lang === "mr" ? "दर वाढीचा अलर्ट सेट करा" : "Set Price Alert")}
                  </button>
                </div>
              </div>
            </div>

            {/* Net Realization Waterfall & Alternatives */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-4 bg-surface-container-high rounded-xl border border-outline-variant p-6 flex flex-col tactile-hover">
                <h3 className="text-[18px] font-bold text-on-surface mb-6">
                  {lang === "mr" ? "निव्वळ नफा तपशील (Realization Estimator)" : "Net Realization Estimator"}
                </h3>
                <div className="flex-1 flex flex-col justify-between">
                  <div className="flex justify-between items-center py-3 border-b border-outline-variant/50">
                    <span className="text-[14px] font-bold text-on-surface">
                      {lang === "mr" ? "एकूण बाजार भाव" : "Gross Market Price"}
                    </span>
                    <span className="text-[18px] text-primary font-extrabold">₹{commodityBasePrice.toLocaleString("en-IN")}/q</span>
                  </div>

                  <div className="py-4 space-y-4">
                    <div className="flex justify-between items-center group relative">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-alert-terracotta" />
                        <span className="text-[14px] text-on-surface-variant font-medium">
                          {lang === "mr" ? "अंदाजित वाहतूक (४५ किमी)" : "Est. Transport (45 km)"}
                        </span>
                        <span className="material-symbols-outlined text-[16px] text-outline cursor-help hover:text-on-surface transition-colors">
                          info
                        </span>
                        <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 w-48 bg-inverse-surface text-on-tertiary px-3 py-2 rounded-md text-[11px] opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none hidden md:block shadow-xl">
                          {lang === "mr" ? "₹१.५० प्रति किमी/क्विंटल प्रमाणे वाहतूक खर्च." : "KrishiSetu benchmark rate of ₹1.50/km/Quintal."}
                        </div>
                      </div>
                      <span className="text-[14px] font-bold text-alert-terracotta">-₹{Math.round(45 * 1.5)}</span>
                    </div>

                    <div className="flex justify-between items-center group relative">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-warning-burnt-orange" />
                        <span className="text-[14px] text-on-surface-variant font-medium">
                          {lang === "mr" ? "बाजार हाताळणी खर्च (अंदाजित १%)" : "Est. Market Handling Charges (1.0%)"}
                        </span>
                        <span className="material-symbols-outlined text-[16px] text-outline cursor-help hover:text-on-surface transition-colors">
                          info
                        </span>
                      </div>
                      <span className="text-[14px] font-bold text-warning-burnt-orange">-₹{Math.round(commodityBasePrice * 0.01)}</span>
                    </div>

                    <div className="flex justify-between items-center group relative">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-warning-burnt-orange" />
                        <span className="text-[14px] text-on-surface-variant font-medium">
                          {lang === "mr" 
                            ? `नासाडी जोखीम (NABCONS ${commodity?.spoilage_rate_percent || 8}%)` 
                            : `Est. Spoilage (NABCONS ${commodity?.spoilage_rate_percent || 8}%)`}
                        </span>
                        <span className="material-symbols-outlined text-[16px] text-outline cursor-help hover:text-on-surface transition-colors">
                          info
                        </span>
                      </div>
                      <span className="text-[14px] font-bold text-warning-burnt-orange">
                        -₹{Math.round(commodityBasePrice * ((commodity?.spoilage_rate_percent || 8) / 100))}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t-2 border-outline-variant">
                    <div className="flex justify-between items-end bg-primary-container/10 p-4 rounded-lg">
                      <div>
                        <span className="text-[13px] font-bold text-primary block mb-1">
                          {lang === "mr" ? "अंदाजित निव्वळ कमाई" : "Estimated Net Earning"}
                        </span>
                        <span className="text-[12px] text-on-surface-variant">
                          {lang === "mr" ? "हातात येणारा प्रत्यक्ष नफा" : "Estimated net take-home"}
                        </span>
                      </div>
                      <span className="text-[22px] font-black text-primary">
                        ₹{Math.round(commodityBasePrice - (45 * 1.5) - (commodityBasePrice * 0.05) - (commodityBasePrice * ((commodity?.spoilage_rate_percent || 8) / 100))).toLocaleString("en-IN")}/q
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-8 bg-surface-container-high rounded-xl border border-outline-variant overflow-hidden flex flex-col tactile-hover">
                <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-surface-container-high">
                  <h3 className="text-[18px] font-bold text-on-surface">Top Mandi Alternatives</h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab("search")}
                    className="text-[13px] font-bold text-primary hover:underline"
                  >
                    View in GIS Market Search →
                  </button>
                </div>

                <div className="overflow-x-auto flex-1">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-surface-container-lowest border-b border-outline-variant">
                        <th className="py-4 px-6 text-[13px] font-bold text-on-surface-variant uppercase tracking-wider">
                          Mandi Location
                        </th>
                        <th className="py-4 px-6 text-[13px] font-bold text-on-surface-variant uppercase tracking-wider">
                          Gross Price
                        </th>
                        <th className="py-4 px-6 text-[13px] font-bold text-on-surface-variant uppercase tracking-wider">
                          Est. Net Realization
                        </th>
                        <th className="py-4 px-6 text-[13px] font-bold text-on-surface-variant uppercase tracking-wider">
                          Distance
                        </th>
                        <th className="py-4 px-6 text-[13px] font-bold text-on-surface-variant uppercase tracking-wider">
                          Demand
                        </th>
                      </tr>
                    </thead>
                    <tbody className="text-[14px]">
                      <tr className="bg-surface-container-low border-b border-outline-variant/30 hover:bg-surface-container-highest transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-primary text-[20px]">storefront</span>
                            <span className="font-bold text-on-surface">Lasalgaon APMC</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 font-semibold">₹2,350/q</td>
                        <td className="py-4 px-6 font-bold text-primary">₹2,138/q</td>
                        <td className="py-4 px-6 text-on-surface-variant">45 km</td>
                        <td className="py-4 px-6">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-success-sage/15 text-success-sage font-bold text-[12px]">
                            <span className="material-symbols-outlined text-[14px]">trending_up</span> High
                          </span>
                        </td>
                      </tr>

                      <tr className="bg-surface-container-highest border-b border-outline-variant/30 hover:bg-surface-container transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-outline text-[20px]">storefront</span>
                            <span className="font-medium text-on-surface">Pimpalgaon Baswant</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 font-semibold">₹2,400/q</td>
                        <td className="py-4 px-6 text-on-surface font-semibold">₹2,090/q</td>
                        <td className="py-4 px-6 text-on-surface-variant">82 km</td>
                        <td className="py-4 px-6">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-success-sage/15 text-success-sage font-bold text-[12px]">
                            <span className="material-symbols-outlined text-[14px]">trending_up</span> High
                          </span>
                        </td>
                      </tr>

                      <tr className="bg-surface-container-low hover:bg-surface-container-highest transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-outline text-[20px]">storefront</span>
                            <span className="font-medium text-on-surface">Nashik APMC</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 font-semibold">₹2,280/q</td>
                        <td className="py-4 px-6 text-on-surface font-semibold">₹2,110/q</td>
                        <td className="py-4 px-6 text-on-surface-variant">28 km</td>
                        <td className="py-4 px-6">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-surface-variant text-on-surface-variant font-bold text-[12px]">
                            <span className="material-symbols-outlined text-[14px]">trending_flat</span> Stable
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: TRADE LOTS WORKSPACE */}
        {/* ========================================================================= */}
        {activeTab === "crops" && (
          <div className="px-6 pb-6 pt-3 md:px-8 md:pb-8 md:pt-4 relative z-10 flex flex-col gap-6 flex-1">
            {/* Trade Lots Management Workspace */}
            <div>
              <TradeLotsManager cropBatches={activeBatches} lang={lang} />
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB: BUYER DISCOVERY */}
        {/* ========================================================================= */}
        {activeTab === "buyers" && (
          <div className="px-6 pb-6 pt-3 md:px-8 md:pb-8 md:pt-4 relative z-10 flex flex-col gap-6 flex-1">
            <BuyerDiscovery lang={lang} />
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB: DELIVERY TRACKING */}
        {/* ========================================================================= */}
        {activeTab === "delivery" && (
          <div className="px-6 pb-6 pt-3 md:px-8 md:pb-8 md:pt-4 relative z-10 flex flex-col gap-6 flex-1">
            <DeliveryTracker onNavigateToPayment={handleNavigateToPayment} />
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB: PAYMENT LEDGER */}
        {/* ========================================================================= */}
        {activeTab === "payments" && (
          <div className="px-6 pb-6 pt-3 md:px-8 md:pb-8 md:pt-4 relative z-10 flex flex-col gap-6 flex-1">
            <PaymentTracker />
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB: TRADE HISTORY */}
        {/* ========================================================================= */}
        {activeTab === "transactions" && (
          <div className="px-6 pb-6 pt-3 md:px-8 md:pb-8 md:pt-4 relative z-10 flex flex-col gap-6 flex-1">
            <TransactionHistory />
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB: DISPUTES & GRIEVANCES */}
        {/* ========================================================================= */}
        {activeTab === "grievances" && (
          <div className="px-6 pb-6 pt-3 md:px-8 md:pb-8 md:pt-4 relative z-10 flex flex-col gap-6 flex-1">
            <GrievanceManager />
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB: FPO & GROUP SELLING */}
        {/* ========================================================================= */}
        {activeTab === "fpo" && (
          <div className="px-6 pb-6 pt-3 md:px-8 md:pb-8 md:pt-4 relative z-10 flex flex-col gap-6 flex-1">
            <FpoGroupManager lang={lang} />
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB: SMART INTELLIGENCE & QUALITY */}
        {/* ========================================================================= */}
        {activeTab === "intelligence" && (
          <div className="px-6 pb-6 pt-3 md:px-8 md:pb-8 md:pt-4 relative z-10 flex flex-col gap-6 flex-1">
            <IntelligenceSuite lang={lang} />
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB: ALERTS & SMART NOTIFICATION CENTER */}
        {/* ========================================================================= */}
        {activeTab === "alerts" && (
          <div className="px-6 pb-6 pt-3 md:px-8 md:pb-8 md:pt-4 relative z-10 flex flex-col gap-6 flex-1">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-alert-terracotta/20 text-alert-terracotta flex items-center justify-center">
                  <span className="material-symbols-outlined icon-fill text-[24px]">notifications_active</span>
                </div>
                <div>
                  <h1 className="text-[28px] font-extrabold text-primary leading-tight">
                    {lang === "mr" ? "इशारे व स्मार्ट सूचना केंद्र" : "Alerts & Notifications Center"}
                  </h1>
                  <p className="text-[14px] text-on-surface-variant font-medium">
                    {lang === "mr" ? "इन-ॲप दर टार्गेट इशारे, हवामान सूचना व रस्ता अडथळा अलर्ट" : "In-app price target triggers, weather risk advisories & mandi transport alerts"}
                  </p>
                </div>
              </div>
            </div>

            {/* Price Alert Control Bar */}
            <div className="bg-surface-container border border-outline-variant rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-[16px] font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">notifications</span>
                  {lang === "mr" ? "बाजार भाव अलर्ट प्राधान्ये" : "In-app Price Target Notification Preferences"}
                </h3>
                <p className="text-[13px] text-on-surface-variant mt-1">
                  {lang === "mr"
                    ? "कांदा किंवा सोयाबीनचा भाव आपल्या टार्गेटवर पोहोचल्यास स्क्रीनवर झटपट सूचना मिळेल."
                    : "Receive instant in-app alerts when benchmark prices reach your target threshold."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAlertSet(!alertSet)}
                className={`px-5 py-2.5 rounded-xl font-bold text-[13px] transition-all flex items-center gap-2 shadow-sm ${
                  alertSet
                    ? "bg-primary text-on-primary"
                    : "bg-surface-container-high border border-outline-variant text-on-surface hover:bg-surface-container-highest"
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {alertSet ? "notifications_active" : "notifications"}
                </span>
                <span>
                  {alertSet
                    ? (lang === "mr" ? "इशारा अलर्ट सक्रिय आहे" : "Price Target Alert Active")
                    : (lang === "mr" ? "नवीन अलर्ट सेट करा" : "Activate Price Alert")}
                </span>
              </button>
            </div>

            {/* Alert Stream Feed */}
            <div className="space-y-4">
              <h3 className="text-[16px] font-bold text-on-surface">
                {lang === "mr" ? "सध्याचे सक्रिय इशारे" : "Active In-app Feed Items"}
              </h3>

              {/* Alert Card 1 */}
              <div className="bg-surface border-l-4 border-alert-terracotta rounded-xl p-4 shadow-sm border border-outline-variant/60 flex items-start gap-4">
                <span className="material-symbols-outlined text-alert-terracotta text-[24px] shrink-0 mt-0.5">warning</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-[14px] text-on-surface">
                      {lang === "mr" ? "लासलगाव कांदा दर टार्गेट जवळ" : "Lasalgaon Red Onion Target Approaching"}
                    </h4>
                    <span className="text-[11px] font-mono bg-alert-terracotta/10 text-alert-terracotta px-2 py-0.5 rounded font-bold">
                      {lang === "mr" ? "इन-ॲप" : "In-app Alert"}
                    </span>
                  </div>
                  <p className="text-[13px] text-on-surface-variant mt-1">
                    {lang === "mr"
                      ? "कांदा भाव ₹२,३९०/क्विंटलवर पोहोचला आहे (आपले टार्गेट: ₹२,५००). पुढील ४८ तासांत विक्रीचा विचार करा."
                      : "Red Onion price reached ₹2,390/Qtl (Your target: ₹2,500). High buyer interest reported."}
                  </p>
                </div>
              </div>

              {/* Alert Card 2 */}
              <div className="bg-surface border-l-4 border-warning-burnt-orange rounded-xl p-4 shadow-sm border border-outline-variant/60 flex items-start gap-4">
                <span className="material-symbols-outlined text-warning-burnt-orange text-[24px] shrink-0 mt-0.5">cloud</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-[14px] text-on-surface">
                      {lang === "mr" ? "अवेळी पाऊस इशारा (नाशिक / पुणे)" : "Unseasonal Rainfall Warning (Nashik/Pune)"}
                    </h4>
                    <span className="text-[11px] font-mono bg-warning-burnt-orange/10 text-warning-burnt-orange px-2 py-0.5 rounded font-bold">
                      {lang === "mr" ? "हवामान अलर्ट" : "Weather Advisory"}
                    </span>
                  </div>
                  <p className="text-[13px] text-on-surface-variant mt-1">
                    {lang === "mr"
                      ? "नाशिक व पुणे पट्ट्यात पुढील ३६ तासांत पावसाची शक्यता. उघड्यावरील धान्य सुरक्षित गोदामात हलवा."
                      : "Light showers expected in transit corridors within 36 hours. Ensure waterproof tarpaulins for lot dispatch."}
                  </p>
                </div>
              </div>

              {/* Alert Card 3 */}
              <div className="bg-surface border-l-4 border-success-sage rounded-xl p-4 shadow-sm border border-outline-variant/60 flex items-start gap-4">
                <span className="material-symbols-outlined text-success-sage text-[24px] shrink-0 mt-0.5">storefront</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-[14px] text-on-surface">
                      {lang === "mr" ? "वाशी APMC मध्ये आवक वाढली" : "Vashi APMC High Demand Notice"}
                    </h4>
                    <span className="text-[11px] font-mono bg-success-sage/10 text-success-sage px-2 py-0.5 rounded font-bold">
                      {lang === "mr" ? "मंडी अपडेट" : "Market Bulletin"}
                    </span>
                  </div>
                  <p className="text-[13px] text-on-surface-variant mt-1">
                    {lang === "mr"
                      ? "वाशी बाजारात ग्रेड-A सोयाबीनची मागणी वाढली आहे. निव्वळ हातात मिळणारा नफा: ₹४,३५०/क्विंटल."
                      : "Premium Grade A Soybeans demand spiked at Vashi Mandi. Est net realization ₹4,350/Qtl."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB: DIGITAL OFFERS */}
        {/* ========================================================================= */}
        {activeTab === "offers" && (
          <div className="px-6 pb-6 pt-3 md:px-8 md:pb-8 md:pt-4 relative z-10 flex flex-col gap-6 flex-1">
            <DigitalOffersManager lang={lang} />
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB: COLLECTIVE TRANSPORT */}
        {/* ========================================================================= */}
        {activeTab === "transport" && (
          <div className="px-6 pb-6 pt-3 md:px-8 md:pb-8 md:pt-4 relative z-10 flex flex-col gap-6 flex-1">
            <div className="bg-success-sage/10 border border-success-sage/30 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-success-sage text-[24px]">departure_board</span>
                <div>
                  <h3 className="font-bold text-[15px] text-success-sage">
                    {lang === "mr" ? "सामूहिक वाहतूक आणि ट्रकमधील जागा वाटप" : "Collective Transport & Freight Pooling"}
                  </h3>
                  <p className="text-[12px] text-on-surface-variant">
                    {lang === "mr"
                      ? "FPO व शेतकरी गटाच्या एकत्रित माल वाहतुकीची क्षमता व खर्च बचत ट्रॅक करा."
                      : "Shared truck freight optimization, route consolidation, and cost reduction for group harvest pools."}
                  </p>
                </div>
              </div>
            </div>
            <FpoGroupManager lang={lang} />
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: RESOURCES (KNOWLEDGE & TOOLS) */}
        {/* ========================================================================= */}
        {activeTab === "resources" && (
          <div className="px-6 pb-6 pt-3 md:px-8 md:pb-8 md:pt-4 relative z-10 flex flex-col gap-8 flex-1">
            {/* Page Header */}
            <div>
              <h1 className="text-[38px] md:text-[48px] font-extrabold text-primary leading-tight tracking-tight">
                {lang === "mr" ? "कृषी ज्ञान व साधने" : "Knowledge & Tools"}
              </h1>
              <p className="text-[18px] text-on-surface-variant mt-2 max-w-3xl font-medium">
                {lang === "mr"
                  ? "तज्ज्ञ मार्गदर्शन, काढणीपश्चात व्यवस्थापन आणि थेट कृषी गणक साधनांसह आपले शेतीचे निर्णय अधिक फायदेशीर बनवा."
                  : "Empowering your agricultural decisions with expert insights, practical guides, and interactive calculators."}
              </p>
            </div>

            {/* Grid Layout: Pathways (8 cols) + Interactive Tools (4 cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Learning Pathways Section (8 cols) */}
              <div className="lg:col-span-8 flex flex-col gap-6">
                <h2 className="text-[20px] font-bold text-on-surface border-b border-outline-variant pb-2">
                  {lang === "mr" ? "शेतकरी मार्गदर्शन विभाग" : "Learning Pathways"}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Card 1: Post-Harvest Handling */}
                  <div
                    onClick={() => alert(lang === "mr" ? "काढणीपश्चात व्यवस्थापन मार्गदर्शक उघडत आहे..." : "Opening Post-Harvest Handling Guide & Best Practices...")}
                    className="bg-surface-container-high rounded-xl border border-outline-variant p-6 tactile-hover cursor-pointer group flex flex-col justify-between"
                  >
                    <div>
                      <div className="w-12 h-12 bg-success-sage/20 text-success-sage rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined icon-fill text-[28px]">local_shipping</span>
                      </div>
                      <h3 className="text-[18px] font-bold text-on-surface mb-2">
                        {lang === "mr" ? "काढणीपश्चात व्यवस्थापन व साठवणूक" : "Post-Harvest Handling"}
                      </h3>
                      <p className="text-[14px] text-on-surface-variant leading-relaxed">
                        {lang === "mr"
                          ? "साठवणूक आणि वाहतुकीदरम्यान होणारे नुकसान कमी करा. नाशवंत पिकांचे आयुष्य वाढवण्यासाठी तज्ज्ञ मार्गदर्शन."
                          : "Minimize loss and preserve quality during storage and transport. Essential guides for perishable crops."}
                      </p>
                    </div>
                    <div className="mt-5 flex items-center gap-2 text-primary font-bold text-[13px]">
                      <span>{lang === "mr" ? "मार्गदर्शक पहा" : "Explore Pathway"}</span>
                      <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">
                        arrow_forward
                      </span>
                    </div>
                  </div>

                  {/* Card 2: Market Mastery */}
                  <div
                    onClick={() => alert(lang === "mr" ? "बाजारपेठ सौदेबाजी व भाव व्यवस्थापन उघडत आहे..." : "Opening Market Mastery & Mandi Negotiation Course...")}
                    className="bg-surface-container-high rounded-xl border border-outline-variant p-6 tactile-hover cursor-pointer group flex flex-col justify-between"
                  >
                    <div>
                      <div className="w-12 h-12 bg-warning-burnt-orange/20 text-warning-burnt-orange rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined icon-fill text-[28px]">storefront</span>
                      </div>
                      <h3 className="text-[18px] font-bold text-on-surface mb-2">
                        {lang === "mr" ? "बाजारपेठ व्यवहार व सौदेबाजी" : "Market Mastery"}
                      </h3>
                      <p className="text-[14px] text-on-surface-variant leading-relaxed">
                        {lang === "mr"
                          ? "बाजारपेठेतील दर चढ-उतार समजून घ्या, योग्य भावासाठी सौदेबाजी करा आणि कमाल नफ्यासाठी योग्य वेळी विक्री करा."
                          : "Understand Mandi price fluctuations, negotiate better rates, and time your sales for maximum profit."}
                      </p>
                    </div>
                    <div className="mt-5 flex items-center gap-2 text-primary font-bold text-[13px]">
                      <span>{lang === "mr" ? "मार्गदर्शक पहा" : "Explore Pathway"}</span>
                      <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">
                        arrow_forward
                      </span>
                    </div>
                  </div>

                  {/* Card 3: Finance & Credit */}
                  <div
                    onClick={() => alert(lang === "mr" ? "कृषी कर्ज, केसीसी आणि शासकीय अनुदान माहिती..." : "Opening Agricultural Loans, KCC & Subsidy Navigator...")}
                    className="bg-surface-container-high rounded-xl border border-outline-variant p-6 tactile-hover cursor-pointer group flex flex-col justify-between"
                  >
                    <div>
                      <div className="w-12 h-12 bg-secondary/20 text-secondary rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined icon-fill text-[28px]">account_balance</span>
                      </div>
                      <h3 className="text-[18px] font-bold text-on-surface mb-2">
                        {lang === "mr" ? "कृषी वित्त, कर्ज व योजना" : "Finance & Credit"}
                      </h3>
                      <p className="text-[14px] text-on-surface-variant leading-relaxed">
                        {lang === "mr"
                          ? "किसान क्रेडिट कार्ड (KCC), कमी व्याजाची कृषी कर्जे, पीक विमा आणि शासकीय अनुदानाचा लाभ कसा घ्यावा."
                          : "Navigate agricultural loans, manage operational cash flow, and access government subsidies."}
                      </p>
                    </div>
                    <div className="mt-5 flex items-center gap-2 text-primary font-bold text-[13px]">
                      <span>{lang === "mr" ? "मार्गदर्शक पहा" : "Explore Pathway"}</span>
                      <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">
                        arrow_forward
                      </span>
                    </div>
                  </div>

                  {/* Card 4: Weather Resilience */}
                  <div
                    onClick={() => alert(lang === "mr" ? "हवामान बदल व आपत्कालीन व्यवस्थापन मार्गदर्शक..." : "Opening Climate Adaptation & Drought Management Guide...")}
                    className="bg-surface-container-high rounded-xl border border-outline-variant p-6 tactile-hover cursor-pointer group flex flex-col justify-between"
                  >
                    <div>
                      <div className="w-12 h-12 bg-primary-container text-on-primary-container rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined icon-fill text-[28px]">routine</span>
                      </div>
                      <h3 className="text-[18px] font-bold text-on-surface mb-2">
                        {lang === "mr" ? "हवामान बदल व दुष्काळ व्यवस्थापन" : "Weather Resilience"}
                      </h3>
                      <p className="text-[14px] text-on-surface-variant leading-relaxed">
                        {lang === "mr"
                          ? "बदलत्या हवामानाचा पिकांवर होणारा परिणाम कमी करा. अवेळी पाऊस आणि दुष्काळावर मात करण्यासाठी उपाय."
                          : "Adapt to changing climate patterns. Strategies for drought resistance and unseasonal rainfall management."}
                      </p>
                    </div>
                    <div className="mt-5 flex items-center gap-2 text-primary font-bold text-[13px]">
                      <span>{lang === "mr" ? "मार्गदर्शक पहा" : "Explore Pathway"}</span>
                      <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">
                        arrow_forward
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Interactive Tools Sidebar (4 cols) */}
              <div className="lg:col-span-4 flex flex-col gap-6">
                <h2 className="text-[20px] font-bold text-on-surface border-b border-outline-variant pb-2">
                  {lang === "mr" ? "थेट कृषी गणक साधने" : "Interactive Tools"}
                </h2>

                {/* Tool Widget 1: Loan Planning Estimate */}
                <div className="bg-surface-container-low rounded-xl border border-outline-variant p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="material-symbols-outlined text-secondary icon-fill text-[24px]">
                      request_quote
                    </span>
                    <h3 className="text-[18px] font-bold text-on-surface">
                      {lang === "mr" ? "पीक कर्ज नियोजन अंदाज" : "Loan Planning Estimate"}
                    </h3>
                  </div>
                  <p className="text-[13px] text-on-surface-variant mb-4 leading-relaxed">
                    {lang === "mr"
                      ? "आपल्या पिकाच्या अंदाजित उत्पन्नानुसार प्राथमिक कर्ज नियोजन मर्यादा तपासा. (केवळ प्राथमिक अंदाज — ही बँक मंजुरी नाही)"
                      : "Illustrative borrowing estimate based on crop yield forecasts. (Illustrative estimate only — not a bank approval)"}
                  </p>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[12px] font-bold text-on-surface-variant mb-1">
                        {lang === "mr" ? "अंदाजित पीक मूल्य (₹)" : "Estimated Yield Value (₹)"}
                      </label>
                      <input
                        className="w-full bg-surface border border-outline-variant rounded-md px-3 py-2 text-[14px] font-bold text-on-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                        placeholder="उदा. 5,00,000"
                        type="number"
                        value={loanYieldValue}
                        onChange={(e) => {
                          setLoanYieldValue(e.target.value);
                          setLoanEligibilityResult(null);
                        }}
                      />
                    </div>

                    {loanEligibilityResult !== null && (
                      <div className="p-3 bg-primary-container/10 border border-primary-container/30 rounded-lg text-center">
                        <span className="text-[11px] font-bold uppercase text-on-surface-variant">
                          {lang === "mr" ? "अंदाजित नियोजन मर्यादा (७०% LTV)" : "Estimated Planning Limit (70% LTV)"}
                        </span>
                        <p className="text-[22px] font-extrabold text-primary">
                          ₹{loanEligibilityResult.toLocaleString("en-IN")}
                        </p>
                        <span className="text-[10px] text-on-surface-variant block mt-0.5">
                          {lang === "mr" ? "केवळ मार्गदर्शनासाठी • प्रत्यक्ष मंजुरी बँकेवर अवलंबून आहे" : "For guidance only • Subject to lender verification"}
                        </span>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        const num = Number(loanYieldValue) || 0;
                        setLoanEligibilityResult(Math.round(num * 0.7));
                      }}
                      className="w-full bg-primary text-on-primary font-bold text-[13px] py-3 rounded-lg hover:bg-primary-container transition-colors shadow-sm active:scale-95"
                    >
                      {lang === "mr" ? "नियोजन अंदाज तपासा" : "Calculate Planning Estimate"}
                    </button>
                  </div>
                </div>

                {/* Tool Widget 2: Spoilage Risk */}
                <div className="bg-surface-container-low rounded-xl border border-outline-variant p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="material-symbols-outlined text-alert-terracotta icon-fill text-[24px]">
                      thermostat
                    </span>
                    <h3 className="text-[18px] font-bold text-on-surface">
                      {lang === "mr" ? "साठवणूक नासाडी जोखीम" : "Spoilage Risk"}
                    </h3>
                  </div>
                  <p className="text-[13px] text-on-surface-variant mb-4 leading-relaxed">
                    {lang === "mr"
                      ? "स्थानिक हवेतील आर्द्रता आणि तापमानानुसार पीक साठवणुकीतील जोखीम तपासा."
                      : "Assess real-time storage risk based on local humidity and temperature."}
                  </p>
                  <div className="bg-surface-container p-4 rounded-lg flex justify-between items-center mb-4">
                    <div>
                      <div className="text-[12px] font-medium text-on-surface-variant">
                        {lang === "mr" ? "हवेतील आर्द्रता" : "Current Humidity"}
                      </div>
                      <div className="text-[24px] font-extrabold text-on-surface">78%</div>
                    </div>
                    <div className="h-10 w-0.5 bg-outline-variant mx-4" />
                    <div>
                      <div className="text-[12px] font-medium text-on-surface-variant">
                        {lang === "mr" ? "जोखीम पातळी" : "Risk Level"}
                      </div>
                      <div className="text-[20px] font-extrabold text-alert-terracotta">
                        {lang === "mr" ? "उच्च जोखीम" : "HIGH"}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => alert(lang === "mr" ? "उपाययोजना: गोदामामध्ये पुरेशी हवा खेळती ठेवा, पॅलेट्स कोरडे ठेवा आणि ४८ तासांच्या आत मालाची वाहतूक करा." : "Mitigation Guide: Ensure adequate ventilation, maintain dry warehouse pallets, and expedite transport within 48 hours.")}
                    className="w-full border-2 border-outline-variant text-on-surface font-bold text-[13px] py-2.5 rounded-lg hover:bg-surface-container-highest transition-colors active:scale-95"
                  >
                    {lang === "mr" ? "उपाययोजना मार्गदर्शक पहा" : "View Mitigation Guide"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Floating Action Button & Interactive AI Agri Advisor */}
        <div className="fixed bottom-6 right-6 z-50">
          <button
            type="button"
            onClick={() => setChatModalOpen(!chatModalOpen)}
            className="bg-primary text-on-primary rounded-full h-16 w-16 flex items-center justify-center shadow-2xl hover:bg-primary-container transition-all hover:scale-105 group relative active:scale-95 border-2 border-white/20"
          >
            <span className="material-symbols-outlined text-[28px]">
              {chatModalOpen ? "close" : "smart_toy"}
            </span>
            <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-inverse-surface text-inverse-on-surface font-bold text-[12px] px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-lg">
              {lang === "mr" ? "कृषीसेतू AI सल्लागार" : "Ask KrishiSetu AI Advisor"}
            </div>
          </button>

          {/* Interactive AI Agri Advisor */}
          <AiAgriAdvisor
            isOpen={chatModalOpen}
            onClose={() => setChatModalOpen(false)}
            lang={lang}
            currentCrop={commodity?.name || "Red Onion"}
            farmerName={farmerName}
            userLocation={locationText}
            userCoords={coords}
          />
        </div>

        {/* Shared Command Center Footer (Only on scrolling tabs) */}
        {activeTab !== "search" && (
          <footer className="flex flex-col sm:flex-row justify-between items-center py-5 px-10 w-full bg-surface-container-low border-t border-outline-variant mt-auto">
            <p className="text-[13px] font-medium text-on-surface-variant">
              © 2026 KrishiSetu {lang === "mr" ? "कृषी कमांड सेंटर" : "Agricultural Command Center"}
            </p>
            <div className="flex flex-wrap gap-6 mt-3 sm:mt-0 text-[13px] font-bold">
              <button
                type="button"
                className="text-primary underline hover:text-primary-container transition-colors cursor-pointer"
                onClick={handleExportCsv}
              >
                {lang === "mr" ? "डेटा निर्यात करा" : "Export Data"}
              </button>
              <button
                type="button"
                className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                onClick={() => setAgentModalOpen(true)}
              >
                {lang === "mr" ? "मंडी प्रतिनिधीशी संपर्क साधा" : "Contact Mandi Agent"}
              </button>
              <button
                type="button"
                className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                onClick={() => setPrivacyModalOpen(true)}
              >
                {lang === "mr" ? "गोपनीयता धोरण" : "Privacy Policy"}
              </button>
            </div>
          </footer>
        )}
      </main>
      </div>

      {/* ========================================================================= */}
      {/* COMMAND CENTER SETTINGS MODAL */}
      {/* ========================================================================= */}
      {settingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-xl w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] text-slate-900">
            {/* Modal Header */}
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">settings</span>
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    {lang === "mr" ? "कमांड सेंटर सेटिंग्ज" : "Command Center Settings"}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {lang === "mr" ? "भाषा, वाहतूक दर आणि सूचना प्राधान्ये बदला" : "Configure language, transport benchmarks & notifications"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSettingsOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto custom-scrollbar flex flex-col gap-5 text-xs">
              {/* 1. Language Preference */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  🌐 {lang === "mr" ? "इंटरफेस भाषा (Language)" : "Interface Language"}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setLang("en")}
                    className={`py-3 px-4 rounded-xl border text-center font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      lang === "en"
                        ? "bg-emerald-700 text-white border-emerald-700 shadow-xs"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <span>🇬🇧 English</span>
                    {lang === "en" && <span className="material-symbols-outlined text-[16px]">check_circle</span>}
                  </button>
                  <button
                    type="button"
                    onClick={() => setLang("mr")}
                    className={`py-3 px-4 rounded-xl border text-center font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      lang === "mr"
                        ? "bg-emerald-700 text-white border-emerald-700 shadow-xs"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <span>🚩 मराठी (Marathi)</span>
                    {lang === "mr" && <span className="material-symbols-outlined text-[16px]">check_circle</span>}
                  </button>
                </div>
              </div>

              {/* 2. Default Unit Preference */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  ⚖️ {lang === "mr" ? "पिकाचे डीफॉल्ट वजन एकक" : "Default Crop Quantity Unit"}
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: "kg", label: lang === "mr" ? "किलो (Kg)" : "Kilograms (Kg)" },
                    { id: "qtl", label: lang === "mr" ? "क्विंटल (Qtl)" : "Quintal (Qtl)" },
                    { id: "ton", label: lang === "mr" ? "टन (Ton)" : "Metric Ton (T)" },
                  ].map((unitItem) => (
                    <button
                      key={unitItem.id}
                      type="button"
                      onClick={() => setPrefUnit(unitItem.id as "kg" | "qtl" | "ton")}
                      className={`py-2.5 px-3 rounded-xl border text-center font-bold text-xs transition-all cursor-pointer ${
                        prefUnit === unitItem.id
                          ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {unitItem.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Advanced Transport Rate Configuration */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div>
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <span>🚛</span> {lang === "mr" ? "प्रगत वाहतूक दर कॉन्फिगरेशन" : "Advanced Transport Configuration"}
                    </label>
                    <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded border border-emerald-200">
                      ₹{Number(transportRate).toFixed(2)} / km / Qtl
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium mt-1">
                    {lang === "mr"
                      ? "कृषीसेतू वाहतूक आणि निव्वळ-मिळकत गणना इंजिनद्वारे वापरले जाते. हे मूल्य बदलल्याने फ्रेट आणि अंदाजित निव्वळ मिळकतीवर परिणाम होतो."
                      : "Used by the KrishiSetu transport and net-realization calculation engine. Changing this value affects freight and estimated net realization."}
                  </p>
                </div>

                <div className="pt-1">
                  <input
                    type="range"
                    min="0.5"
                    max="5.0"
                    step="0.1"
                    value={transportRate}
                    onChange={(e) => setTransportRate(e.target.value)}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-700"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-bold mt-1.5">
                    <span>₹0.50 (Local Tractor)</span>
                    <span className="text-emerald-800 font-black">₹1.50 (KrishiSetu Benchmark)</span>
                    <span>₹5.00 (Express Reefer)</span>
                  </div>
                </div>
              </div>

              {/* 5. Primary District Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  📍 {lang === "mr" ? "प्राथमिक कृषी जिल्हा" : "Primary Mandi District"}
                </label>
                <select
                  value={prefDistrict}
                  onChange={(e) => {
                    setPrefDistrict(e.target.value);
                    setLocationText(`${e.target.value}, Maharashtra`);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-600"
                >
                  <option value="Nashik">Nashik (नासिक - कांदा व द्राक्ष हब)</option>
                  <option value="Lasalgaon">Lasalgaon (लासलगाव - आशियातील सर्वात मोठी कांदा बाजारपेठ)</option>
                  <option value="Pimpalgaon">Pimpalgaon (पिंपळगाव बसवंत)</option>
                  <option value="Pune">Pune (पुणे कृषी उत्पन्न बाजार)</option>
                  <option value="Nagpur">Nagpur (नागपूर संत्रा व धान्य मंडई)</option>
                  <option value="Solapur">Solapur (सोलापूर)</option>
                </select>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-between items-center flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setLang("en");
                    setPrefUnit("kg");
                    setTransportRate(String(DEFAULT_TRANSPORT_RATE));
                    setPrefDistrict("Nashik");
                    setSavedToastMsg(lang === "mr" ? "प्राधान्ये डीफॉल्टवर रीसेट केली!" : "Preferences reset to defaults.");
                    setSavedToast(true);
                    setTimeout(() => setSavedToast(false), 3500);
                  }}
                  className="text-xs font-bold text-slate-500 hover:text-emerald-800 transition-colors underline cursor-pointer"
                >
                  {lang === "mr" ? "डीफॉल्ट पुनर्संचयित करा" : "Reset to Defaults"}
                </button>
                <span className="text-slate-300">•</span>
                <button
                  type="button"
                  onClick={() => {
                    setSettingsOpen(false);
                    setResetConfirmModalOpen(true);
                  }}
                  className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg text-[12px] font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                  {lang === "mr" ? "डेमो डेटा रीसेट करा" : "Reset Demo Data"}
                </button>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setSettingsOpen(false)}
                  className="px-4 py-2 bg-surface-container border border-outline-variant rounded-lg text-[13px] font-bold text-on-surface hover:bg-surface-variant transition-colors"
                >
                  {lang === "mr" ? "रद्द करा" : "Cancel"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSavedToast(true);
                    setTimeout(() => setSavedToast(false), 3500);
                    setSettingsOpen(false);
                  }}
                  className="px-5 py-2 bg-primary text-on-primary rounded-lg text-[13px] font-bold hover:bg-primary-container transition-colors shadow-sm active:scale-95"
                >
                  {lang === "mr" ? "सेटिंग्ज सेव्ह करा" : "Save Preferences"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FARMER PROFILE MODAL */}
      {/* ========================================================================= */}
      {profileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-2xl w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh] text-slate-900">
            {/* Profile Header Banner */}
            <div className="relative bg-emerald-800 p-6 text-white">
              <button
                type="button"
                onClick={() => setProfileOpen(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>

              <div className="flex flex-col sm:flex-row items-center gap-5 pt-2">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full border-4 border-white/20 overflow-hidden shadow-lg bg-emerald-900 flex items-center justify-center text-white font-black text-3xl">
                    {farmerName ? farmerName.trim().charAt(0).toUpperCase() : "👨‍🌾"}
                  </div>
                </div>

                <div className="text-center sm:text-left flex-1">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                    <h2 className="text-xl font-black tracking-tight">{farmerName || (lang === "mr" ? "शेतकरी मित्र" : "Guest Farmer")}</h2>
                    <span className="px-2.5 py-0.5 bg-emerald-900/60 text-emerald-200 text-[10px] font-bold rounded-full flex items-center gap-1 border border-emerald-700">
                      <CheckCircle2 className="w-3 h-3" />
                      {lang === "mr" ? "शेतकरी प्रोफाईल" : "Farmer Profile"}
                    </span>
                  </div>
                  <p className="text-xs text-emerald-100/80 font-medium">
                    {farmerVillage ? `${farmerVillage} • ` : ""}
                    <span className="font-mono text-[11px]">
                      ID: MH-KRISHISETU-2026-{currentUser?._id ? currentUser._id.slice(-4) : "8841"}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Profile Quick Stats Bento */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-5 bg-slate-50 border-b border-slate-200 text-center">
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                  {lang === "mr" ? "एकूण जमीन" : "Landholding"}
                </span>
                <p className="text-sm font-black text-slate-900 mt-0.5">
                  {farmerAcres ? `${farmerAcres} Acres` : (lang === "mr" ? "नोंदवलेले नाही" : "Not Set")}
                </p>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                  {lang === "mr" ? "सक्रिय पिके" : "Active Crops"}
                </span>
                <p className="text-sm font-black text-emerald-700 mt-0.5">{activeBatches.length} Batches</p>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                  {lang === "mr" ? "एकूण साठा" : "Batch Volume"}
                </span>
                <p className="text-sm font-black text-slate-900 mt-0.5">
                  {activeBatches.reduce((acc, b) => acc + Math.round(b.qtyKg / 100), 0)} Qtl
                </p>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                  {lang === "mr" ? "खाते प्रकार" : "Account Role"}
                </span>
                <p className="text-sm font-black text-emerald-800 mt-0.5">
                  {currentUser?.role ? currentUser.role.toUpperCase() : "FARMER"}
                </p>
              </div>
            </div>

            {/* Profile Editable Form Body */}
            <div className="p-6 overflow-y-auto custom-scrollbar flex flex-col gap-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === "mr" ? "शेतकऱ्याचे नाव" : "Full Name"}
                  </label>
                  <input
                    type="text"
                    value={farmerName}
                    onChange={(e) => setFarmerName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === "mr" ? "संपर्क / मोबाईल" : "Contact Number"}
                  </label>
                  <input
                    type="text"
                    value={farmerPhone}
                    onChange={(e) => setFarmerPhone(e.target.value)}
                    placeholder={lang === "mr" ? "मोबाईल नंबर किंवा ईमेल" : "Enter mobile number or email"}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === "mr" ? "गाव व जिल्हा" : "Village & District"}
                  </label>
                  <input
                    type="text"
                    value={farmerVillage}
                    onChange={(e) => setFarmerVillage(e.target.value)}
                    placeholder={lang === "mr" ? "उदा. नाशिक / पुणे" : "e.g. Nashik / Pune"}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === "mr" ? "शेतीचे क्षेत्र (एकर)" : "Total Cultivated Area (Acres)"}
                  </label>
                  <input
                    type="text"
                    value={farmerAcres}
                    onChange={(e) => setFarmerAcres(e.target.value)}
                    placeholder={lang === "mr" ? "उदा. 5.0" : "e.g. 5.0"}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>
            </div>

            {/* Profile Modal Footer */}
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-between items-center">
              <button
                type="button"
                onClick={() => {
                  logoutUser();
                  setCurrentUser(null);
                  setSavedToastMsg(lang === "mr" ? "यशस्वीरित्या लॉग आऊट झाले" : "Logged out successfully");
                  setSavedToast(true);
                  setTimeout(() => setSavedToast(false), 3000);
                  setProfileOpen(false);
                }}
                className="text-xs font-bold text-rose-600 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                {lang === "mr" ? "लॉग आऊट" : "Log Out"}
              </button>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setProfileOpen(false)}
                  className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  {lang === "mr" ? "बंद करा" : "Close"}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      if (currentUser) {
                        const updated = await updateUserProfile({
                          name: farmerName,
                          phone: farmerPhone,
                          village: farmerVillage,
                          landholdingAcres: Number(farmerAcres) || undefined,
                        });
                        setCurrentUser(updated);
                      }
                      setSavedToastMsg(lang === "mr" ? "शेतकरी प्रोफाईल डेटाबेसमध्ये जतन झाली!" : "Farmer Profile saved to database!");
                      setSavedToast(true);
                      setTimeout(() => setSavedToast(false), 3500);
                      setProfileOpen(false);
                    } catch (err: any) {
                      alert(err?.response?.data?.error?.message || "Failed to save profile");
                    }
                  }}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  {lang === "mr" ? "बदल सेव्ह करा" : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal (Login / Sign Up) */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={(user) => {
          setCurrentUser(user);
          setFarmerName(user.name);
          if (user.phone) setFarmerPhone(user.phone);
          if (user.village) setFarmerVillage(user.village);
          setSavedToastMsg(
            lang === "mr"
              ? `स्वागत आहे, ${user.name}! आपण यशस्वीरित्या जोडले गेला आहात.`
              : `Welcome back, ${user.name}! Logged in successfully.`
          );
          setSavedToast(true);
          setTimeout(() => setSavedToast(false), 3500);
        }}
        lang={lang}
      />

      {/* Mandi Agent Helpdesk Contact Modal */}
      {agentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface rounded-2xl border border-outline-variant max-w-lg w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-surface-container-high px-6 py-4 border-b border-outline-variant flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-primary text-[22px]">contact_phone</span>
                <h3 className="text-[17px] font-bold text-on-surface">
                  {lang === "mr" ? "नोंदणीकृत मंडी प्रतिनिधी संपर्क" : "APMC Mandi Helpdesk & Agents"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setAgentModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-variant text-on-surface-variant cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div className="p-6 space-y-4 text-[13px]">
              <p className="text-on-surface-variant font-medium">
                {lang === "mr"
                  ? "महाराष्ट्रातील प्रमुख APMC मंडी प्रतिनिधी आणि व्यापारी माहिती कक्ष:"
                  : "Official APMC market desk assistance & registered trader support numbers:"}
              </p>
              <div className="space-y-2.5">
                <div className="p-3 bg-surface-container rounded-xl border border-outline-variant/60 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-on-surface">Lasalgaon APMC Helpdesk</p>
                    <p className="text-[11px] text-outline">Onion & Grains Section</p>
                  </div>
                  <span className="font-mono font-bold text-primary text-[13px]">+91 2550 266100</span>
                </div>
                <div className="p-3 bg-surface-container rounded-xl border border-outline-variant/60 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-on-surface">Vashi APMC Navi Mumbai</p>
                    <p className="text-[11px] text-outline">Terminal Logistics Support</p>
                  </div>
                  <span className="font-mono font-bold text-primary text-[13px]">+91 22 2788 8800</span>
                </div>
                <div className="p-3 bg-surface-container rounded-xl border border-outline-variant/60 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-on-surface">Pune APMC (Gultekdi)</p>
                    <p className="text-[11px] text-outline">Vegetables & Fruits Desk</p>
                  </div>
                  <span className="font-mono font-bold text-primary text-[13px]">+91 20 2426 1234</span>
                </div>
              </div>
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setAgentModalOpen(false)}
                  className="px-5 py-2 bg-primary text-on-primary rounded-lg font-bold cursor-pointer"
                >
                  {lang === "mr" ? "बंद करा" : "Close"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Policy Modal */}
      {privacyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface rounded-2xl border border-outline-variant max-w-lg w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-surface-container-high px-6 py-4 border-b border-outline-variant flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-primary text-[22px]">shield</span>
                <h3 className="text-[17px] font-bold text-on-surface">
                  {lang === "mr" ? "कृषीसेतू शेतकरी डेटा गोपनीयता धोरण" : "KrishiSetu Farmer Data Privacy Policy"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPrivacyModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-variant text-on-surface-variant cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div className="p-6 space-y-3.5 text-[13px] text-on-surface-variant font-medium">
              <p>
                <strong>1. Data Ownership:</strong> Your farm location, crop yields, and market calculations belong strictly to you.
              </p>
              <p>
                <strong>2. Zero Bank/Third-Party Sharing:</strong> KrishiSetu does not share your crop data, landholding info, or phone number with banks, traders, or lenders without your explicit permission.
              </p>
              <p>
                <strong>3. Local Security:</strong> Session credentials and preferences are securely encrypted and stored locally on your device.
              </p>
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setPrivacyModalOpen(false)}
                  className="px-5 py-2 bg-primary text-on-primary rounded-lg font-bold cursor-pointer"
                >
                  {lang === "mr" ? "समजले" : "I Understand"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Saved Toast Notification */}
      {savedToast && (
        <div className="fixed top-20 right-8 z-50 bg-primary text-on-primary px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-primary-container animate-in slide-in-from-top-4 duration-300">
          <span className="material-symbols-outlined text-[22px] text-inverse-primary">
            check_circle
          </span>
          <span className="text-[13px] font-bold">
            {savedToastMsg || (lang === "mr" ? "सेटिंग्ज यशस्वीरित्या सेव्ह झाल्या!" : "Settings successfully updated!")}
          </span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DEMO DATA RESET CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {resetConfirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200 text-slate-900">
            <div className="flex items-center gap-3 text-amber-800 border-b border-slate-100 pb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[24px]">restart_alt</span>
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  {lang === "mr" ? "डेमो डेटा रीसेट करायचा?" : "Reset Demo Data?"}
                </h3>
                <span className="text-[11px] text-amber-800 font-bold">
                  {lang === "mr" ? "केवळ सिम्युलेटेड सत्रासाठी" : "Simulated Sandbox Action"}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              {lang === "mr"
                ? "यामुळे सिम्युलेटेड व्यवहार क्रियाकलाप रीसेट होतील ज्यामध्ये: ट्रेड लॉट्स, खरेदीदार ऑफर्स, काउंटर ऑफर्स, डिलिव्हरी ऑर्डर, पेमेंट रेकॉर्ड, ट्रॅन्झॅक्शन हिस्ट्री आणि डेमो एफपीओ पूल समाविष्ट आहेत."
                : "This will reset simulated trade activity including: Trade Lots, Buyer Offers, Counter Offers, Delivery Orders, Payment Records, Transaction History, Demo FPO Pools, and Demo FPO Contributions."}
            </p>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500 font-medium">
              ℹ️ {lang === "mr" ? "कोणत्याही वास्तविक बॅकएंड किंवा वित्तीय डेटावर परिणाम होणार नाही." : "No real backend or financial data will be affected."}
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setResetConfirmModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                {lang === "mr" ? "रद्द करा" : "Cancel"}
              </button>
              <button
                type="button"
                onClick={() => {
                  resetDemoDataApi();
                  setResetConfirmModalOpen(false);
                  setResetSuccessToast(true);
                  setTimeout(() => setResetSuccessToast(false), 3500);
                }}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                {lang === "mr" ? "होय, डेटा रीसेट करा" : "Reset Demo Data"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {resetSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 border border-slate-700 animate-in slide-in-from-bottom-3 duration-200">
          <span className="material-symbols-outlined text-emerald-400 text-[20px]">check_circle</span>
          <span className="text-xs font-bold">
            {lang === "mr" ? "डेमो डेटा यशस्वीरित्या रीसेट झाला." : "Demo data reset successfully."}
          </span>
        </div>
      )}
    </div>
  );
}

export default Index;

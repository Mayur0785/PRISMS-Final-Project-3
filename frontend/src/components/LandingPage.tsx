import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  ShieldCheck,
  Truck,
  DollarSign,
  Search,
  Sparkles,
  Layers,
  MapPin,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Clock,
  Building2,
  BarChart3,
  Bot,
  FileCheck2,
  Lock,
  ArrowUpRight,
  HelpCircle,
  Menu,
  X,
  PhoneCall,
  Globe,
  Award,
  Zap,
  Check,
  Scale,
  Navigation,
  ExternalLink,
  ChevronDown,
  Warehouse,
  IndianRupee,
  Navigation2,
  Route,
  Store,
  Compass,
  ArrowUpDown,
  Boxes,
  CircleDollarSign,
  Receipt,
  FileText,
  BadgeCheck,
  UserCheck,
  PackageCheck,
} from "lucide-react";
import { AuthModal } from "@/components/AuthModal";
import { getCurrentUser, type AuthUser } from "@/lib/prisms";

interface LandingPageProps {
  onEnterDashboard?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterDashboard }) => {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("signup");
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => getCurrentUser());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [selectedCrop, setSelectedCrop] = useState<"onion" | "tomato" | "banana" | "wheat">("onion");
  const [calcQty, setCalcQty] = useState(40);
  const [calcDistance, setCalcDistance] = useState(65);
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [lang, setLang] = useState<"en" | "mr">("en");
  const [activeTradeTab, setActiveTradeTab] = useState<"offer" | "delivery" | "payment" | "receipt">("offer");
  const [selectedRadius, setSelectedRadius] = useState<50 | 100 | 200>(100);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleOpenAuth = (mode: "login" | "signup") => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  const handleAuthSuccess = (user: AuthUser) => {
    setCurrentUser(user);
    setAuthModalOpen(false);
    if (onEnterDashboard) {
      onEnterDashboard();
    } else {
      window.location.href = "/";
    }
  };

  const cropData = {
    onion: {
      name: lang === "mr" ? "लाल कांदा (Nashik)" : "Red Onion (Nashik)",
      basePrice: 3350,
      bestMandi: "Pune Market Yard",
      bestPrice: 3620,
      localMandi: "Local Rural APMC",
      localPrice: 3100,
      spoilageRate: 0.015,
      transportRatePerKmQtl: 1.35,
      apmcFeePercent: 0.012,
    },
    tomato: {
      name: lang === "mr" ? "टोमॅटो (Narayangaon)" : "Hybrid Tomato (Narayangaon)",
      basePrice: 2450,
      bestMandi: "Vashi APMC Navi Mumbai",
      bestPrice: 2850,
      localMandi: "Junnar Sub-Yard",
      localPrice: 2200,
      spoilageRate: 0.025,
      transportRatePerKmQtl: 1.45,
      apmcFeePercent: 0.015,
    },
    banana: {
      name: lang === "mr" ? "ग्रँड नैन केळी (Jalgaon)" : "Grand Naine Banana (Jalgaon)",
      basePrice: 1950,
      bestMandi: "Surat Central Market",
      bestPrice: 2300,
      localMandi: "Raver Mandi",
      localPrice: 1800,
      spoilageRate: 0.02,
      transportRatePerKmQtl: 1.25,
      apmcFeePercent: 0.01,
    },
    wheat: {
      name: lang === "mr" ? "शरबती गहू (Sharbati)" : "Sharbati Wheat (Grade A)",
      basePrice: 2850,
      bestMandi: "Kalyan Grain Hub",
      bestPrice: 3150,
      localMandi: "Local Primary Yard",
      localPrice: 2750,
      spoilageRate: 0.005,
      transportRatePerKmQtl: 1.15,
      apmcFeePercent: 0.008,
    },
  };

  const currentCropInfo = cropData[selectedCrop];

  // Net realization calculation
  const grossValueBest = currentCropInfo.bestPrice * calcQty;
  const freightBest = Math.round(calcDistance * currentCropInfo.transportRatePerKmQtl * calcQty);
  const apmcFeeBest = Math.round(grossValueBest * currentCropInfo.apmcFeePercent);
  const spoilageBest = Math.round(grossValueBest * currentCropInfo.spoilageRate);
  const netBest = grossValueBest - freightBest - apmcFeeBest - spoilageBest;

  const grossValueLocal = currentCropInfo.localPrice * calcQty;
  const freightLocal = Math.round(15 * currentCropInfo.transportRatePerKmQtl * calcQty);
  const apmcFeeLocal = Math.round(grossValueLocal * currentCropInfo.apmcFeePercent);
  const spoilageLocal = Math.round(grossValueLocal * (currentCropInfo.spoilageRate * 0.7));
  const netLocal = grossValueLocal - freightLocal - apmcFeeLocal - spoilageLocal;

  const profitGain = netBest - netLocal;

  const faqs = [
    {
      q: "How does PRISMS calculate real Net Realization?",
      a: "Unlike simple price boards that only show the top quoted rate, PRISMS computes your true take-home earnings by subtracting verified live road freight (₹/km/Qtl), exact APMC market cess, handling charges, and transit spoilage index from the gross buyer offer.",
    },
    {
      q: "Are the buyer offers legally binding and escrow-protected?",
      a: "Yes. When a buyer submits a bid or offer on PRISMS, their payment is pre-authorized and locked in the PRISMS Escrow Ledger. Once delivery is verified at the gate or warehouse, the payment is automatically settled directly to your bank account.",
    },
    {
      q: "Can I use PRISMS if I am a member of a Farmer Producer Organization (FPO)?",
      a: "PRISMS includes a dedicated FPO Bulk Aggregation & Group Bargaining module. FPO leaders can aggregate crop lots from dozens of member farmers to negotiate higher institutional bulk pricing with corporate buyers.",
    },
    {
      q: "Where does PRISMS get its mandi price intelligence?",
      a: "PRISMS ingests live daily market arrivals and modal price feeds directly from the Ministry of Agriculture's data.gov.in (Agmarknet) system, enhanced with proprietary geospatial distance matrices and historical trend models.",
    },
    {
      q: "Is PRISMS available in local Indian languages?",
      a: "Yes! The entire interface, voice advisor, SMS alerts, and trade documents can be used in English, Marathi (मराठी), and Hindi (हिंदी).",
    },
  ];

  return (
    <div className="min-h-screen bg-[#FBFDF9] text-[#191D17] font-sans antialiased selection:bg-[#20511D] selection:text-white">
      {/* ── 1. NAVBAR ─────────────────────────────────────────────── */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/90 backdrop-blur-md border-b border-[#E2E8DE] shadow-sm py-3"
            : "bg-transparent py-5"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0F3810] to-[#25631E] flex items-center justify-center text-white shadow-md shadow-[#0F3810]/20 ring-2 ring-[#78B470]/30">
              <Sparkles className="w-5 h-5 text-[#B6F5A9]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-tight text-[#0F3810] font-mono">
                  PRISMS
                </span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#E8F6E4] text-[#1E5618] border border-[#BDE5B5]">
                  AI 2.0
                </span>
              </div>
              <p className="text-[10px] font-medium text-[#64745E] hidden sm:block tracking-wide">
                DIGITAL AGRI COMMAND CENTER
              </p>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-[#3C4A38]">
            <a href="#how-it-works" className="hover:text-[#184D13] transition-colors">
              How It Works
            </a>
            <a href="#features" className="hover:text-[#184D13] transition-colors">
              Features
            </a>
            <a href="#market-intelligence" className="hover:text-[#184D13] transition-colors">
              Market Intelligence
            </a>
            <a href="#trade-execution" className="hover:text-[#184D13] transition-colors">
              Trade Execution
            </a>
            <a href="#net-realization" className="hover:text-[#184D13] transition-colors">
              Net Realization
            </a>
            <a href="#gis-map" className="hover:text-[#184D13] transition-colors">
              GIS Radius
            </a>
            <a href="#ai-advisor" className="hover:text-[#184D13] transition-colors">
              AI Advisor
            </a>
            <a href="#faq" className="hover:text-[#184D13] transition-colors">
              FAQ
            </a>
          </nav>

          {/* Right Header CTAs */}
          <div className="hidden sm:flex items-center gap-3">
            {/* Lang switcher */}
            <button
              onClick={() => setLang(lang === "en" ? "mr" : "en")}
              className="px-2.5 py-1.5 rounded-lg border border-[#D5DFD1] text-xs font-semibold text-[#384835] hover:bg-[#F0F5EE] transition-colors flex items-center gap-1.5"
            >
              <Globe className="w-3.5 h-3.5 text-[#546A50]" />
              <span>{lang === "en" ? "मराठी" : "English"}</span>
            </button>

            {currentUser ? (
              <button
                onClick={() => (onEnterDashboard ? onEnterDashboard() : (window.location.href = "/"))}
                className="px-4 py-2 rounded-xl bg-[#0F3810] text-white text-sm font-semibold hover:bg-[#184D13] transition-all shadow-sm hover:shadow-md flex items-center gap-2"
              >
                <span>Dashboard ({currentUser.name?.split(" ")[0] || "Farmer"})</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                <button
                  onClick={() => handleOpenAuth("login")}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-[#1F3D1A] hover:bg-[#EBF3E8] transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => handleOpenAuth("signup")}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#0F3810] to-[#20581B] text-white text-sm font-semibold hover:from-[#184D13] hover:to-[#2B6F24] transition-all shadow-md shadow-[#0F3810]/20 hover:shadow-lg hover:shadow-[#0F3810]/30 flex items-center gap-1.5 group"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-[#233820] hover:bg-[#EAF2E7]"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-[#E0E8DC] px-4 pt-3 pb-6 space-y-3 shadow-xl">
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-medium text-[#2E3F2A]"
            >
              How It Works
            </a>
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-medium text-[#2E3F2A]"
            >
              Features
            </a>
            <a
              href="#market-intelligence"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-medium text-[#2E3F2A]"
            >
              Market Intelligence
            </a>
            <a
              href="#trade-execution"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-medium text-[#2E3F2A]"
            >
              Trade Execution
            </a>
            <a
              href="#net-realization"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-medium text-[#2E3F2A]"
            >
              Net Realization
            </a>
            <a
              href="#gis-map"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-medium text-[#2E3F2A]"
            >
              GIS Radius
            </a>
            <a
              href="#ai-advisor"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-medium text-[#2E3F2A]"
            >
              AI Agri Advisor
            </a>
            <div className="pt-3 border-t border-[#E8F0E4] flex flex-col gap-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleOpenAuth("login");
                }}
                className="w-full py-2.5 rounded-xl border border-[#C5D5C1] text-sm font-semibold text-[#184D13] text-center"
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleOpenAuth("signup");
                }}
                className="w-full py-2.5 rounded-xl bg-[#0F3810] text-white text-sm font-semibold text-center shadow-md"
              >
                Get Started Free
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ── 2. HERO SECTION ───────────────────────────────────────── */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden bg-gradient-to-b from-[#F2F8EF] via-[#FAFDF9] to-[#FBFDF9]">
        {/* Ambient background glows */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gradient-to-br from-[#A5E598]/20 via-[#409633]/10 to-transparent blur-3xl pointer-events-none rounded-full" />
        <div className="absolute top-40 right-10 w-72 h-72 bg-[#FFE799]/20 blur-2xl pointer-events-none rounded-full" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Hero Left Content */}
            <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E5F5E0] border border-[#BBE3B3] text-xs font-bold text-[#14480E] shadow-sm">
                <span className="w-2 h-2 rounded-full bg-[#2E991F] animate-ping" />
                <span className="w-2 h-2 rounded-full bg-[#2E991F] -ml-4" />
                <span>Verified APMC Network · 2,400+ Live Mandis</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#0D260D] leading-[1.12]">
                India's Intelligent{" "}
                <span className="bg-gradient-to-r from-[#0F4A0F] via-[#24791E] to-[#104D10] bg-clip-text text-transparent underline decoration-[#9AE48C]/60 decoration-wavy decoration-2">
                  Agricultural Trading
                </span>{" "}
                Command Center
              </h1>

              {/* Sub-headline */}
              <p className="text-lg sm:text-xl font-bold text-[#2A4725]">
                Sell Smarter. Earn More. Trade with Confidence.
              </p>

              {/* Body */}
              <p className="text-sm sm:text-base text-[#4D6049] leading-relaxed max-w-xl mx-auto lg:mx-0 font-normal">
                PRISMS empowers Indian farmers to discover high-paying mandis, calculate exact road-freight net profit, match with verified buyers, track milestone delivery, and unlock escrow-guaranteed payments.
              </p>

              {/* Primary / Secondary CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <button
                  onClick={() => handleOpenAuth("signup")}
                  className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-gradient-to-r from-[#0E350E] via-[#1A5418] to-[#144912] text-white text-base font-bold hover:shadow-xl hover:shadow-[#0E350E]/25 hover:scale-[1.02] active:scale-[0.99] transition-all flex items-center justify-center gap-2 group ring-2 ring-[#70B865]/30"
                >
                  <span>Start Trading Free</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>

                <a
                  href="#how-it-works"
                  className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white border border-[#CCD8C8] text-[#1F3D1A] text-base font-bold hover:bg-[#F3F8F0] hover:border-[#9FC097] transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <span>Explore Platform</span>
                  <ChevronDown className="w-4 h-4 text-[#5D7657]" />
                </a>
              </div>

              {/* Farmer Trust Proof */}
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 text-xs font-semibold text-[#4F624B]">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full border-2 border-white bg-[#C9EAC0] flex items-center justify-center font-bold text-[#14420F] text-xs">
                    RK
                  </div>
                  <div className="w-8 h-8 rounded-full border-2 border-white bg-[#FFE299] flex items-center justify-center font-bold text-[#6B4B00] text-xs">
                    SB
                  </div>
                  <div className="w-8 h-8 rounded-full border-2 border-white bg-[#B9E3FF] flex items-center justify-center font-bold text-[#084D7A] text-xs">
                    AP
                  </div>
                  <div className="w-8 h-8 rounded-full border-2 border-white bg-[#D6CDF7] flex items-center justify-center font-bold text-[#432A9C] text-xs">
                    +42k
                  </div>
                </div>
                <div className="text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-1 text-[#E08A00]">
                    {"★".repeat(5)}
                    <span className="text-[#1D321A] font-bold ml-1">4.9 / 5.0</span>
                  </div>
                  <span>Trusted by 42,000+ Farmers & 380+ FPO Aggregators</span>
                </div>
              </div>
            </div>

            {/* Hero Right Visual Preview Card */}
            <div className="lg:col-span-6 relative">
              {/* Outer Glowing Container */}
              <div className="relative rounded-3xl p-1 bg-gradient-to-b from-[#67AD5D]/40 via-[#B0DBA8]/20 to-[#E0F0DC]/10 shadow-2xl shadow-[#154611]/15">
                <div className="bg-white rounded-[22px] p-5 sm:p-6 border border-[#E3EBE0] shadow-inner space-y-4">
                  {/* Mock Window Top Bar */}
                  <div className="flex items-center justify-between pb-3 border-b border-[#EDF3EA]">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-[#FF6961]" />
                      <span className="w-3 h-3 rounded-full bg-[#FFD166]" />
                      <span className="w-3 h-3 rounded-full bg-[#06D6A0]" />
                      <span className="text-xs font-mono font-semibold text-[#5B6F57] ml-2">
                        prisms-command-center.gov.in
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#EDF8EA] text-[#1E5E16] text-[11px] font-bold">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#248119]" />
                      <span>Gov Agmarknet Verified</span>
                    </div>
                  </div>

                  {/* Top Live Ticker */}
                  <div className="bg-[#F6FAF4] rounded-xl p-3 border border-[#E0EBDC] flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold text-[#62775E] uppercase tracking-wider block">
                        Optimal Benchmark Mandi
                      </span>
                      <span className="text-sm font-extrabold text-[#0E2E0D]">
                        Pune APMC Market Yard
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-[#2A821E] bg-[#DFF3DB] px-2 py-0.5 rounded inline-block">
                        ₹3,620 / Qtl (+16.8%)
                      </span>
                      <span className="text-[10px] text-[#556950] block mt-0.5">
                        Distance: 135 km · Freight: ₹1.35/km
                      </span>
                    </div>
                  </div>

                  {/* Net Realization Compare Highlight Box */}
                  <div className="bg-gradient-to-br from-[#0F350E] to-[#1E571A] text-white rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden">
                    <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-28 h-28 bg-[#83D175]/20 rounded-full blur-xl pointer-events-none" />
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xs font-semibold text-[#AEE6A3] uppercase tracking-wider">
                          Net Farmer Take-Home Earnings
                        </span>
                        <div className="text-2xl sm:text-3xl font-black text-white mt-1 tracking-tight">
                          ₹1,32,480{" "}
                          <span className="text-xs font-normal text-[#C4EFC0]">
                            for 40 Qtl Lot
                          </span>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg bg-[#276F22] text-[#DCFBD7] text-xs font-extrabold border border-[#529E4B]/40">
                        +₹18,400 Extra Profit
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-[#346F2E] text-xs">
                      <div>
                        <span className="text-[#96C78D] block text-[10px]">Gross Value</span>
                        <span className="font-bold text-white">₹1,44,800</span>
                      </div>
                      <div>
                        <span className="text-[#96C78D] block text-[10px]">Freight & Cess</span>
                        <span className="font-bold text-[#FFD1A6]">-₹9,240</span>
                      </div>
                      <div>
                        <span className="text-[#96C78D] block text-[10px]">Transit Spoilage</span>
                        <span className="font-bold text-[#FFD1A6]">-₹3,080</span>
                      </div>
                    </div>
                  </div>

                  {/* Mini Trade Status Flow */}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2.5 rounded-xl bg-[#F4F9F2] border border-[#DCE8D8]">
                      <Truck className="w-4 h-4 text-[#20671B] mx-auto mb-1" />
                      <span className="font-bold text-[#143412] block">Delivery</span>
                      <span className="text-[10px] text-[#2F7E24] font-semibold">Dispatched</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#F4F9F2] border border-[#DCE8D8]">
                      <DollarSign className="w-4 h-4 text-[#C47D00] mx-auto mb-1" />
                      <span className="font-bold text-[#143412] block">Escrow</span>
                      <span className="text-[10px] text-[#A66800] font-semibold">₹1.32L Locked</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#F4F9F2] border border-[#DCE8D8]">
                      <CheckCircle2 className="w-4 h-4 text-[#1C7317] mx-auto mb-1" />
                      <span className="font-bold text-[#143412] block">Settlement</span>
                      <span className="text-[10px] text-[#1C7317] font-semibold">Instant UPI/NEFT</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. TRUST / VALUE STRIP ────────────────────────────────── */}
      <section className="py-12 bg-white border-y border-[#E2EBE0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8">
            <div className="flex items-start gap-3.5 p-3">
              <div className="w-11 h-11 rounded-xl bg-[#E8F5E5] text-[#144E10] flex items-center justify-center shrink-0 border border-[#BFE4B9]">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#133011]">Better Price Discovery</h4>
                <p className="text-xs text-[#50634D] mt-0.5">
                  Live multi-mandi modal rate spread & spatial sorting within 250km.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3">
              <div className="w-11 h-11 rounded-xl bg-[#E8F5E5] text-[#144E10] flex items-center justify-center shrink-0 border border-[#BFE4B9]">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#133011]">Direct Buyer Matching</h4>
                <p className="text-xs text-[#50634D] mt-0.5">
                  Verified corporate processors, exporters & wholesalers without middlemen.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3">
              <div className="w-11 h-11 rounded-xl bg-[#E8F5E5] text-[#144E10] flex items-center justify-center shrink-0 border border-[#BFE4B9]">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#133011]">Transparent Contracts</h4>
                <p className="text-xs text-[#50634D] mt-0.5">
                  Pre-locked quality grades, delivery terms & guaranteed purchase orders.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3">
              <div className="w-11 h-11 rounded-xl bg-[#E8F5E5] text-[#144E10] flex items-center justify-center shrink-0 border border-[#BFE4B9]">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#133011]">Escrow Payouts</h4>
                <p className="text-xs text-[#50634D] mt-0.5">
                  Funds held securely in escrow and released on gate delivery verification.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. HOW PRISMS WORKS ───────────────────────────────────── */}
      <section id="how-it-works" className="py-20 bg-[#FAFDF9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="inline-block px-3 py-1 rounded-full bg-[#E3F4DF] text-[#195614] text-xs font-bold uppercase tracking-wider border border-[#BBE5B4]">
              Seamless 6-Step Workflow
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0D290D] tracking-tight">
              From Harvest to Bank Payout in 6 Simple Steps
            </h2>
            <p className="text-sm sm:text-base text-[#4E624A]">
              PRISMS replaces uncertain mandi middlemen with a transparent, digital execution pipeline.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Step 1 */}
            <div className="bg-white rounded-2xl p-6 border border-[#E0EADDC] shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
              <div className="w-10 h-10 rounded-xl bg-[#0E350E] text-white flex items-center justify-center font-black text-base mb-4 group-hover:scale-105 transition-transform">
                01
              </div>
              <h3 className="text-lg font-bold text-[#123010] mb-2">
                Digitize Harvest & Create Lot
              </h3>
              <p className="text-xs sm:text-sm text-[#4E604A] leading-relaxed">
                Enter your crop name, variety, estimated quantity (Qtl), quality grade, and farm origin to create a verified digital Trade Lot.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white rounded-2xl p-6 border border-[#E0EADDC] shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
              <div className="w-10 h-10 rounded-xl bg-[#0E350E] text-white flex items-center justify-center font-black text-base mb-4 group-hover:scale-105 transition-transform">
                02
              </div>
              <h3 className="text-lg font-bold text-[#123010] mb-2">
                Discover Best Mandi Realization
              </h3>
              <p className="text-xs sm:text-sm text-[#4E604A] leading-relaxed">
                PRISMS scans nearby APMC markets within 250km and calculates true Net Realization after road freight and market fees.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white rounded-2xl p-6 border border-[#E0EADDC] shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
              <div className="w-10 h-10 rounded-xl bg-[#0E350E] text-white flex items-center justify-center font-black text-base mb-4 group-hover:scale-105 transition-transform">
                03
              </div>
              <h3 className="text-lg font-bold text-[#123010] mb-2">
                Receive Direct Buyer Offers
              </h3>
              <p className="text-xs sm:text-sm text-[#4E604A] leading-relaxed">
                Corporate food processors, wholesalers, and institutional buyers submit competitive, locked bids for your crop lot.
              </p>
            </div>

            {/* Step 4 */}
            <div className="bg-white rounded-2xl p-6 border border-[#E0EADDC] shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
              <div className="w-10 h-10 rounded-xl bg-[#0E350E] text-white flex items-center justify-center font-black text-base mb-4 group-hover:scale-105 transition-transform">
                04
              </div>
              <h3 className="text-lg font-bold text-[#123010] mb-2">
                Accept Optimal Deal
              </h3>
              <p className="text-xs sm:text-sm text-[#4E604A] leading-relaxed">
                Compare gross price, logistics preference (Farm Gate pickup vs Mandi Delivery), and payment terms before 1-click confirmation.
              </p>
            </div>

            {/* Step 5 */}
            <div className="bg-white rounded-2xl p-6 border border-[#E0EADDC] shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
              <div className="w-10 h-10 rounded-xl bg-[#0E350E] text-white flex items-center justify-center font-black text-base mb-4 group-hover:scale-105 transition-transform">
                05
              </div>
              <h3 className="text-lg font-bold text-[#123010] mb-2">
                Milestone Logistics Tracking
              </h3>
              <p className="text-xs sm:text-sm text-[#4E604A] leading-relaxed">
                Track pickup, vehicle dispatch, in-transit GPS progress, and arrival verification at the destination yard or factory.
              </p>
            </div>

            {/* Step 6 */}
            <div className="bg-white rounded-2xl p-6 border border-[#E0EADDC] shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
              <div className="w-10 h-10 rounded-xl bg-[#0E350E] text-white flex items-center justify-center font-black text-base mb-4 group-hover:scale-105 transition-transform">
                06
              </div>
              <h3 className="text-lg font-bold text-[#123010] mb-2">
                Instant Escrow Settlement
              </h3>
              <p className="text-xs sm:text-sm text-[#4E604A] leading-relaxed">
                As soon as the delivery order reaches verified DELIVERED status, funds are transferred straight into your linked bank account.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. CORE PLATFORM MODULES & FEATURES ───────────────────── */}
      <section id="features" className="py-20 bg-white border-y border-[#E2EBE0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="inline-block px-3 py-1 rounded-full bg-[#E3F4DF] text-[#195614] text-xs font-bold uppercase tracking-wider border border-[#BBE5B4]">
              Comprehensive Platform Suite
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0D290D] tracking-tight">
              Enterprise Technology Tailored for Every Farmer
            </h2>
            <p className="text-sm sm:text-base text-[#4E624A]">
              Every tool you need to optimize trade realizations, eliminate price exploitation, and manage settlements.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1 */}
            <div className="bg-[#FAFDF9] rounded-2xl p-6 border border-[#E0EBDC] hover:border-[#86C47A] hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-[#E2F4DE] text-[#134D0F] flex items-center justify-center mb-4">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[#11310E] mb-2">Market Discovery</h3>
              <p className="text-xs sm:text-sm text-[#4F624C] leading-relaxed">
                Search and sort 2,400+ Indian APMCs by distance, modal price, arrival volumes, and historical spikes.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-[#FAFDF9] rounded-2xl p-6 border border-[#E0EBDC] hover:border-[#86C47A] hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-[#E2F4DE] text-[#134D0F] flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[#11310E] mb-2">Mandi Intelligence</h3>
              <p className="text-xs sm:text-sm text-[#4F624C] leading-relaxed">
                AI price trend forecasting, 30-day volatility index, and peak selling window alerts for 15+ commodities.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-[#FAFDF9] rounded-2xl p-6 border border-[#E0EBDC] hover:border-[#86C47A] hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-[#E2F4DE] text-[#134D0F] flex items-center justify-center mb-4">
                <Bot className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[#11310E] mb-2">AI Agri Advisor</h3>
              <p className="text-xs sm:text-sm text-[#4F624C] leading-relaxed">
                Natural-language conversational assistant powered by Google Gemini with multi-dialect support (English, मराठी, हिंदी).
              </p>
            </div>

            {/* Card 4 */}
            <div className="bg-[#FAFDF9] rounded-2xl p-6 border border-[#E0EBDC] hover:border-[#86C47A] hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-[#E2F4DE] text-[#134D0F] flex items-center justify-center mb-4">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[#11310E] mb-2">Trade Lot Management</h3>
              <p className="text-xs sm:text-sm text-[#4F624C] leading-relaxed">
                Catalog your crops with grade badges, moisture ratings, expected rates, and automatic QR tracking tags.
              </p>
            </div>

            {/* Card 5 */}
            <div className="bg-[#FAFDF9] rounded-2xl p-6 border border-[#E0EBDC] hover:border-[#86C47A] hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-[#E2F4DE] text-[#134D0F] flex items-center justify-center mb-4">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[#11310E] mb-2">Digital Buyer Offers</h3>
              <p className="text-xs sm:text-sm text-[#4F624C] leading-relaxed">
                Receive direct procurement bids with transparent freight splits, counter-offer support, and deal locking.
              </p>
            </div>

            {/* Card 6 */}
            <div className="bg-[#FAFDF9] rounded-2xl p-6 border border-[#E0EBDC] hover:border-[#86C47A] hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-[#E2F4DE] text-[#134D0F] flex items-center justify-center mb-4">
                <Truck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[#11310E] mb-2">Delivery Tracking</h3>
              <p className="text-xs sm:text-sm text-[#4F624C] leading-relaxed">
                Live logistics status pipeline from pickup ready to in-transit, warehouse receipt, and proof of weighbridge.
              </p>
            </div>

            {/* Card 7 */}
            <div className="bg-[#FAFDF9] rounded-2xl p-6 border border-[#E0EBDC] hover:border-[#86C47A] hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-[#E2F4DE] text-[#134D0F] flex items-center justify-center mb-4">
                <DollarSign className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[#11310E] mb-2">Payment Ledger</h3>
              <p className="text-xs sm:text-sm text-[#4F624C] leading-relaxed">
                Itemized financial records detailing gross amount, transport deductions, mandi charges, and net payout.
              </p>
            </div>

            {/* Card 8 */}
            <div className="bg-[#FAFDF9] rounded-2xl p-6 border border-[#E0EBDC] hover:border-[#86C47A] hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-[#E2F4DE] text-[#134D0F] flex items-center justify-center mb-4">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[#11310E] mb-2">Verified Trade History</h3>
              <p className="text-xs sm:text-sm text-[#4F624C] leading-relaxed">
                Downloadable PDF tax-ready invoices, digital transaction certificates, and audited settlement summaries.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. LIVE MANDI MARKET INTELLIGENCE TICKER ─────────────── */}
      <section id="market-intelligence" className="py-20 bg-[#FAFDF9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="inline-block px-3 py-1 rounded-full bg-[#E0F2DC] text-[#154E11] text-xs font-bold uppercase tracking-wider border border-[#B7E3AF]">
              Live Agmarknet Stream
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0D290D] tracking-tight">
              Real-Time Mandi Price Spreads & Arrival Volumes
            </h2>
            <p className="text-sm sm:text-base text-[#4E624A]">
              Track wholesale arrival spikes and modal prices across Maharashtra and national terminal markets.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Live Card 1: Nashik */}
            <div className="bg-white rounded-2xl p-6 border border-[#DFE8DC] shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between pb-3 border-b border-[#EDF3EA]">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">🧅</span>
                  <div>
                    <h4 className="font-bold text-[#123010] text-sm">Lasalgaon APMC</h4>
                    <span className="text-[11px] text-[#637760]">Nashik District · Maharashtra</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#DEF7DB] text-[#1E6917]">
                  +4.2% ↑
                </span>
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <div>
                  <span className="text-xs text-[#5D715A] block">Modal Price</span>
                  <span className="text-2xl font-extrabold text-[#11310F] font-mono">₹3,280</span>
                  <span className="text-[11px] text-[#637760]"> / Qtl</span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-[#5D715A] block">Daily Arrivals</span>
                  <span className="text-sm font-bold text-[#1F411C]">18,450 Qtl</span>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-[#F0F5EE] flex justify-between text-[11px] text-[#556952]">
                <span>Min: ₹2,800 · Max: ₹3,510</span>
                <span className="text-[#1A6115] font-semibold">High Liquidity</span>
              </div>
            </div>

            {/* Live Card 2: Pune */}
            <div className="bg-white rounded-2xl p-6 border border-[#DFE8DC] shadow-sm hover:shadow-md transition-all ring-2 ring-[#70B865]/20">
              <div className="flex items-center justify-between pb-3 border-b border-[#EDF3EA]">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">🍅</span>
                  <div>
                    <h4 className="font-bold text-[#123010] text-sm">Pune Market Yard</h4>
                    <span className="text-[11px] text-[#637760]">Gultekdi · Urban Consumer Hub</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#DEF7DB] text-[#1E6917]">
                  +8.6% ↑
                </span>
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <div>
                  <span className="text-xs text-[#5D715A] block">Modal Price</span>
                  <span className="text-2xl font-extrabold text-[#11310F] font-mono">₹3,620</span>
                  <span className="text-[11px] text-[#637760]"> / Qtl</span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-[#5D715A] block">Daily Arrivals</span>
                  <span className="text-sm font-bold text-[#1F411C]">24,100 Qtl</span>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-[#F0F5EE] flex justify-between text-[11px] text-[#556952]">
                <span>Min: ₹3,100 · Max: ₹3,850</span>
                <span className="text-[#155A10] font-bold">Recommended Hub</span>
              </div>
            </div>

            {/* Live Card 3: Vashi */}
            <div className="bg-white rounded-2xl p-6 border border-[#DFE8DC] shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between pb-3 border-b border-[#EDF3EA]">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">🍌</span>
                  <div>
                    <h4 className="font-bold text-[#123010] text-sm">Vashi APMC (Navi Mumbai)</h4>
                    <span className="text-[11px] text-[#637760]">Mumbai Metro Terminal</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#DEF7DB] text-[#1E6917]">
                  +11.2% ↑
                </span>
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <div>
                  <span className="text-xs text-[#5D715A] block">Modal Price</span>
                  <span className="text-2xl font-extrabold text-[#11310F] font-mono">₹3,890</span>
                  <span className="text-[11px] text-[#637760]"> / Qtl</span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-[#5D715A] block">Daily Arrivals</span>
                  <span className="text-sm font-bold text-[#1F411C]">32,800 Qtl</span>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-[#F0F5EE] flex justify-between text-[11px] text-[#556952]">
                <span>Min: ₹3,350 · Max: ₹4,150</span>
                <span className="text-[#1A6115] font-semibold">Exporter Demand</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. DIGITAL TRADE EXECUTION PIPELINE SHOWCASE ─────────── */}
      <section id="trade-execution" className="py-20 bg-white border-y border-[#E2EBE0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="inline-block px-3 py-1 rounded-full bg-[#E0F2DC] text-[#154E11] text-xs font-bold uppercase tracking-wider border border-[#B7E3AF]">
              Zero Dispute Trade Workflow
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0D290D] tracking-tight">
              Digitized Contracts, Delivery Tracking & Bank Settlements
            </h2>
            <p className="text-sm sm:text-base text-[#4E624A]">
              Experience how PRISMS unifies buyer matching, vehicle dispatch, and escrow release into one authoritative ledger.
            </p>
          </div>

          {/* Trade Tabs */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex p-1.5 rounded-2xl bg-[#F0F6EE] border border-[#DCE7DA] gap-1">
              <button
                onClick={() => setActiveTradeTab("offer")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTradeTab === "offer"
                    ? "bg-[#0F3810] text-white shadow-sm"
                    : "text-[#3D5239] hover:text-[#11330F]"
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>1. Buyer Offer</span>
              </button>
              <button
                onClick={() => setActiveTradeTab("delivery")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTradeTab === "delivery"
                    ? "bg-[#0F3810] text-white shadow-sm"
                    : "text-[#3D5239] hover:text-[#11330F]"
                }`}
              >
                <Truck className="w-3.5 h-3.5" />
                <span>2. Delivery Tracking</span>
              </button>
              <button
                onClick={() => setActiveTradeTab("payment")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTradeTab === "payment"
                    ? "bg-[#0F3810] text-white shadow-sm"
                    : "text-[#3D5239] hover:text-[#11330F]"
                }`}
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>3. Escrow Ledger</span>
              </button>
              <button
                onClick={() => setActiveTradeTab("receipt")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTradeTab === "receipt"
                    ? "bg-[#0F3810] text-white shadow-sm"
                    : "text-[#3D5239] hover:text-[#11330F]"
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>4. Trade Certificate</span>
              </button>
            </div>
          </div>

          {/* Interactive Trade Preview Container */}
          <div className="max-w-4xl mx-auto bg-[#FAFDF9] rounded-3xl p-6 sm:p-8 border border-[#DFE9DC] shadow-xl">
            {activeTradeTab === "offer" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-[#E3ECE0]">
                  <div>
                    <span className="text-[10px] font-bold text-[#62775E] uppercase tracking-wider block">
                      Contract Order ID: PRISMS-OFF-2026-8942
                    </span>
                    <h3 className="text-xl font-bold text-[#113010]">
                      Sahyadri Agro Processing Ltd. (Nashik Mega Hub)
                    </h3>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-[#DEF7DB] text-[#175A12] border border-[#BDE5B6]">
                    Verified Buyer · Rating 4.9 ★
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div className="p-3 bg-white rounded-xl border border-[#E0EADE]">
                    <span className="text-[#657962] block text-[10px]">Crop & Variety</span>
                    <span className="font-bold text-[#143212]">Red Onion (Grade A)</span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-[#E0EADE]">
                    <span className="text-[#657962] block text-[10px]">Contracted Quantity</span>
                    <span className="font-bold text-[#143212]">40 Quintals</span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-[#E0EADE]">
                    <span className="text-[#657962] block text-[10px]">Offered Rate</span>
                    <span className="font-bold text-[#196415] text-sm">₹3,450 / Qtl</span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-[#E0EADE]">
                    <span className="text-[#657962] block text-[10px]">Logistics Term</span>
                    <span className="font-bold text-[#143212]">Direct Farm Gate Pickup</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#E8F6E4] border border-[#BDE5B5] flex items-center justify-between">
                  <div>
                    <span className="text-xs text-[#526B50] block">Gross Deal Value</span>
                    <span className="text-2xl font-black text-[#0F3810]">₹1,38,000</span>
                  </div>
                  <button
                    onClick={() => handleOpenAuth("signup")}
                    className="px-5 py-2.5 rounded-xl bg-[#0F3810] text-white text-xs font-bold hover:bg-[#184F14] transition-colors"
                  >
                    Accept Offer & Book Logistics →
                  </button>
                </div>
              </div>
            )}

            {activeTradeTab === "delivery" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="flex justify-between items-center pb-4 border-b border-[#E3ECE0]">
                  <div>
                    <span className="text-[10px] font-bold text-[#62775E] uppercase tracking-wider block">
                      Delivery Manifest: DLV-2026-0814
                    </span>
                    <h3 className="text-xl font-bold text-[#113010]">
                      Vehicle: Bolero MaxiTruck (MH-15-EG-4421)
                    </h3>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-[#E2F0FF] text-[#0A538D] border border-[#B9DCFF]">
                    In Transit · 42 km to Hub
                  </span>
                </div>

                {/* Stepper tracker */}
                <div className="grid grid-cols-4 gap-2 text-center text-xs pt-2">
                  <div className="p-3 bg-[#E8F6E4] rounded-xl border border-[#BDE5B5]">
                    <PackageCheck className="w-5 h-5 text-[#196115] mx-auto mb-1" />
                    <span className="font-bold text-[#143412] block">1. Lot Loaded</span>
                    <span className="text-[10px] text-[#4F684D]">09:30 AM · Dindori</span>
                  </div>
                  <div className="p-3 bg-[#E8F6E4] rounded-xl border border-[#BDE5B5]">
                    <Truck className="w-5 h-5 text-[#196115] mx-auto mb-1" />
                    <span className="font-bold text-[#143412] block">2. Dispatched</span>
                    <span className="text-[10px] text-[#4F684D]">10:15 AM · Gate Exit</span>
                  </div>
                  <div className="p-3 bg-[#E2F0FF] rounded-xl border border-[#B9DCFF] ring-2 ring-[#0A538D]/20">
                    <Navigation2 className="w-5 h-5 text-[#0A538D] mx-auto mb-1 animate-pulse" />
                    <span className="font-bold text-[#0A538D] block">3. In Transit</span>
                    <span className="text-[10px] text-[#0A538D]">GPS Active · 60 km/h</span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-[#E0EADE] opacity-60">
                    <Warehouse className="w-5 h-5 text-[#637A61] mx-auto mb-1" />
                    <span className="font-bold text-[#354833] block">4. Gate Receipt</span>
                    <span className="text-[10px] text-[#637A61]">ETA: 01:15 PM</span>
                  </div>
                </div>
              </div>
            )}

            {activeTradeTab === "payment" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="flex justify-between items-center pb-4 border-b border-[#E3ECE0]">
                  <div>
                    <span className="text-[10px] font-bold text-[#62775E] uppercase tracking-wider block">
                      Escrow Settlement Ledger: PMT-2026-0428
                    </span>
                    <h3 className="text-xl font-bold text-[#113010]">
                      Status: Bank Payout Released (IMPS / UPI)
                    </h3>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-[#DEF7DB] text-[#175A12] border border-[#BDE5B6]">
                    ✓ 100% Settled
                  </span>
                </div>

                <div className="bg-white rounded-2xl p-4 border border-[#DFE9DC] space-y-2 text-xs">
                  <div className="flex justify-between text-[#4D624A]">
                    <span>Gross Produce Settlement (40 Qtl):</span>
                    <span className="font-bold text-[#143212]">₹1,38,000</span>
                  </div>
                  <div className="flex justify-between text-[#9C5D1E]">
                    <span>Transporter Freight Settlement (Pre-deducted):</span>
                    <span className="font-bold">-₹3,850</span>
                  </div>
                  <div className="flex justify-between text-[#9C5D1E]">
                    <span>Standard Handling & Cess (1.2%):</span>
                    <span className="font-bold">-₹1,656</span>
                  </div>
                  <div className="pt-3 border-t border-[#EDF4EB] flex justify-between text-sm font-bold text-[#0F3810]">
                    <span>Net Direct Farmer Credit:</span>
                    <span className="text-lg font-black text-[#155A11] font-mono">₹1,32,494</span>
                  </div>
                </div>
              </div>
            )}

            {activeTradeTab === "receipt" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="p-5 rounded-2xl bg-white border border-[#DFE9DC] space-y-4 text-xs">
                  <div className="flex justify-between items-start pb-3 border-b border-[#EDF4EB]">
                    <div>
                      <span className="font-mono text-[10px] text-[#637960] block">CERTIFICATE NO: PRISMS-TXN-2026-9041</span>
                      <h4 className="text-base font-bold text-[#0F3810]">Digital Agri-Trade Execution Certificate</h4>
                    </div>
                    <BadgeCheck className="w-6 h-6 text-[#175E12]" />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div>
                      <span className="text-[#657C62] block text-[10px]">Seller Farmer</span>
                      <span className="font-bold text-[#133011]">Mayur Patil (Dindori, Nashik)</span>
                    </div>
                    <div>
                      <span className="text-[#657C62] block text-[10px]">Verified Buyer</span>
                      <span className="font-bold text-[#133011]">Sahyadri Agro Processing Ltd.</span>
                    </div>
                    <div>
                      <span className="text-[#657C62] block text-[10px]">Net Realization Paid</span>
                      <span className="font-bold text-[#175C12]">₹1,32,494 (Bank Ref #49021890)</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── 8. INTERACTIVE NET REALIZATION CALCULATOR ─────────────── */}
      <section id="net-realization" className="py-20 bg-[#F4F9F1]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="inline-block px-3 py-1 rounded-full bg-[#E0F2DC] text-[#154E11] text-xs font-bold uppercase tracking-wider border border-[#B7E3AF]">
              True Net Realization Formula
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0D290D] tracking-tight">
              Compare Gross Mandi Rate vs True Net Profit
            </h2>
            <p className="text-sm sm:text-base text-[#4E624A]">
              A higher quoted price isn't always more profitable. PRISMS computes exact road distance, freight rates, and market cess.
            </p>
          </div>

          {/* Interactive Calculator Container */}
          <div className="bg-white rounded-3xl border border-[#DCE8D8] shadow-xl p-6 sm:p-10">
            {/* Crop Selector Tabs */}
            <div className="flex flex-wrap gap-2 pb-6 border-b border-[#EDF3EA]">
              {(["onion", "tomato", "banana", "wheat"] as const).map((cropKey) => (
                <button
                  key={cropKey}
                  onClick={() => setSelectedCrop(cropKey)}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                    selectedCrop === cropKey
                      ? "bg-[#0F3810] text-white shadow-md"
                      : "bg-[#F0F6EE] text-[#3E523A] hover:bg-[#E5EFE2]"
                  }`}
                >
                  {cropData[cropKey].name}
                </button>
              ))}
            </div>

            {/* Slider Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-8">
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-bold text-[#143212]">
                  <span>Harvest Lot Quantity:</span>
                  <span className="text-[#1A5C16] font-mono text-base">{calcQty} Quintals ({(calcQty * 100).toLocaleString()} kg)</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="150"
                  step="5"
                  value={calcQty}
                  onChange={(e) => setCalcQty(Number(e.target.value))}
                  className="w-full h-2 bg-[#E1ECE0] rounded-lg appearance-none cursor-pointer accent-[#154E11]"
                />
                <div className="flex justify-between text-[11px] text-[#6A7E67]">
                  <span>Small Pickup (10 Qtl)</span>
                  <span>Truckload (150 Qtl)</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm font-bold text-[#143212]">
                  <span>Distance to High-Rate APMC:</span>
                  <span className="text-[#1A5C16] font-mono text-base">{calcDistance} km</span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="250"
                  step="5"
                  value={calcDistance}
                  onChange={(e) => setCalcDistance(Number(e.target.value))}
                  className="w-full h-2 bg-[#E1ECE0] rounded-lg appearance-none cursor-pointer accent-[#154E11]"
                />
                <div className="flex justify-between text-[11px] text-[#6A7E67]">
                  <span>Local Radius (15 km)</span>
                  <span>Terminal Hub (250 km)</span>
                </div>
              </div>
            </div>

            {/* Comparative Breakdown Table */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
              {/* Option A: Recommended Terminal APMC */}
              <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-[#0F350E] to-[#1E571A] text-white relative shadow-lg">
                <div className="flex items-center justify-between pb-3 border-b border-[#30682B]">
                  <div>
                    <span className="text-[11px] font-bold text-[#8CE37D] uppercase tracking-wider block">
                      PRISMS Recommended Route
                    </span>
                    <h4 className="text-lg font-extrabold text-white">
                      {currentCropInfo.bestMandi}
                    </h4>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-[#2D7324] text-[#E0F8DC] text-xs font-bold">
                    ₹{currentCropInfo.bestPrice} / Qtl
                  </span>
                </div>

                <div className="space-y-2.5 my-4 text-xs">
                  <div className="flex justify-between text-[#C2E8BC]">
                    <span>Gross Value ({calcQty} Qtl @ ₹{currentCropInfo.bestPrice}):</span>
                    <span className="font-bold text-white font-mono">₹{grossValueBest.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[#FFCCA1]">
                    <span>Road Freight ({calcDistance} km @ ₹{currentCropInfo.transportRatePerKmQtl}/km/Qtl):</span>
                    <span className="font-mono font-bold">-₹{freightBest.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[#FFCCA1]">
                    <span>APMC Cess & Handling ({currentCropInfo.apmcFeePercent * 100}%):</span>
                    <span className="font-mono font-bold">-₹{apmcFeeBest.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[#FFCCA1]">
                    <span>Estimated Spoilage ({currentCropInfo.spoilageRate * 100}%):</span>
                    <span className="font-mono font-bold">-₹{spoilageBest.toLocaleString()}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#30682B] flex items-center justify-between">
                  <div>
                    <span className="text-xs text-[#A8E49E] block">Final Take-Home Realization</span>
                    <span className="text-2xl sm:text-3xl font-black text-white font-mono">
                      ₹{netBest.toLocaleString()}
                    </span>
                  </div>
                  <span className="px-3 py-1.5 rounded-xl bg-[#239217] text-white text-xs font-extrabold shadow-sm">
                    Optimal Net Profit
                  </span>
                </div>
              </div>

              {/* Option B: Local Yard Without PRISMS */}
              <div className="p-5 sm:p-6 rounded-2xl bg-[#F6FAF4] text-[#1E301B] border border-[#D8E5D4]">
                <div className="flex items-center justify-between pb-3 border-b border-[#E0EADE]">
                  <div>
                    <span className="text-[11px] font-bold text-[#62775E] uppercase tracking-wider block">
                      Local Traditional Mandi
                    </span>
                    <h4 className="text-lg font-bold text-[#1B3518]">
                      {currentCropInfo.localMandi}
                    </h4>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-[#E4EDE1] text-[#425540] text-xs font-bold">
                    ₹{currentCropInfo.localPrice} / Qtl
                  </span>
                </div>

                <div className="space-y-2.5 my-4 text-xs">
                  <div className="flex justify-between text-[#50634E]">
                    <span>Gross Value ({calcQty} Qtl @ ₹{currentCropInfo.localPrice}):</span>
                    <span className="font-bold text-[#142812] font-mono">₹{grossValueLocal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[#8A5A2B]">
                    <span>Local Transport (15 km):</span>
                    <span className="font-mono font-bold">-₹{freightLocal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[#8A5A2B]">
                    <span>Market Cess & Unloading:</span>
                    <span className="font-mono font-bold">-₹{apmcFeeLocal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[#8A5A2B]">
                    <span>Handling & Spoilage:</span>
                    <span className="font-mono font-bold">-₹{spoilageLocal.toLocaleString()}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#E0EADE] flex items-center justify-between">
                  <div>
                    <span className="text-xs text-[#5D705B] block">Traditional Take-Home Realization</span>
                    <span className="text-2xl sm:text-3xl font-black text-[#1F3A1C] font-mono">
                      ₹{netLocal.toLocaleString()}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-[#B52A2A] font-extrabold block">
                      -₹{profitGain.toLocaleString()} Less
                    </span>
                    <span className="text-[10px] text-[#71856E]">Middleman loss</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Summary Bar */}
            <div className="mt-6 p-4 rounded-xl bg-[#E8F6E4] border border-[#BDE4B5] flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-[#195614] shrink-0" />
                <span className="text-xs sm:text-sm font-bold text-[#113B0E]">
                  By choosing {currentCropInfo.bestMandi}, you earn an extra{" "}
                  <span className="text-[#0F3810] font-black underline">₹{profitGain.toLocaleString()}</span>{" "}
                  after paying full road freight.
                </span>
              </div>
              <button
                onClick={() => handleOpenAuth("signup")}
                className="px-4 py-2 rounded-xl bg-[#0F3810] text-white text-xs font-bold hover:bg-[#195614] transition-colors shrink-0"
              >
                Find Best Mandi for My Crop
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── 9. GIS & SPATIAL RADIUS INTELLIGENCE SHOWCASE ─────────── */}
      <section id="gis-map" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Spatial Content */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E5F5E1] text-[#165112] text-xs font-bold border border-[#BDE5B6]">
                <Compass className="w-4 h-4" />
                <span>Geospatial Market Discovery</span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0D290D] tracking-tight">
                Radius-Based APMC Discovery & Transport Optimization
              </h2>

              <p className="text-sm sm:text-base text-[#4C6049] leading-relaxed">
                PRISMS plots your farm location against hundreds of APMC mandis, cold-storage clusters, and highway logistics corridors, calculating real road distance instead of simple straight-line radius.
              </p>

              {/* Radius Selectors */}
              <div className="flex gap-3 pt-2">
                {([50, 100, 200] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setSelectedRadius(r)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                      selectedRadius === r
                        ? "bg-[#0F3810] text-white border-[#0F3810] shadow-sm"
                        : "bg-[#F5FAF3] text-[#3D523A] border-[#DCE8D8] hover:bg-[#EAF4E8]"
                    }`}
                  >
                    {r} km Radius Zone
                  </button>
                ))}
              </div>

              <div className="space-y-3 pt-2 text-xs sm:text-sm">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-[#F6FAF4] border border-[#DFE9DC]">
                  <MapPin className="w-5 h-5 text-[#1C6916] shrink-0" />
                  <span>
                    <strong>{selectedRadius === 50 ? "12 Mandis" : selectedRadius === 100 ? "34 Mandis" : "86 Mandis"}</strong> available within {selectedRadius} km zone.
                  </span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-[#F6FAF4] border border-[#DFE9DC]">
                  <Truck className="w-5 h-5 text-[#1C6916] shrink-0" />
                  <span>
                    Average Freight Rate: <strong>₹1.35 / km / Qtl</strong> (Standard Bolero / 407 Truckload).
                  </span>
                </div>
              </div>
            </div>

            {/* Right Map Visual Display */}
            <div className="lg:col-span-6">
              <div className="rounded-3xl bg-gradient-to-br from-[#123911] to-[#0A2609] p-6 text-white shadow-2xl relative overflow-hidden">
                {/* Mock Map Canvas */}
                <div className="h-80 rounded-2xl bg-[#174815] relative overflow-hidden border border-[#2B6A27] flex items-center justify-center">
                  {/* Concentric Radius Rings */}
                  <div className="absolute w-64 h-64 rounded-full border border-dashed border-[#8EE87E]/30 animate-spin duration-1000" style={{ animationDuration: "60s" }} />
                  <div className="absolute w-44 h-44 rounded-full border border-[#8EE87E]/40" />
                  <div className="absolute w-24 h-24 rounded-full border border-[#8EE87E]/60 bg-[#8EE87E]/10" />

                  {/* Center Farm Pin */}
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-[#E5F5E0] text-[#0F3810] flex items-center justify-center font-bold shadow-lg ring-4 ring-[#8EE87E]">
                      🌱
                    </div>
                    <span className="text-[10px] font-bold bg-[#0F3810]/90 px-2 py-0.5 rounded text-white mt-1 border border-[#346F2D]">
                      Your Farm (Nashik)
                    </span>
                  </div>

                  {/* Surrounding Mandi Pins */}
                  <div className="absolute top-12 left-14 flex items-center gap-1 bg-white text-[#11310E] px-2 py-1 rounded-lg text-[10px] font-bold shadow-md">
                    <span className="w-2 h-2 rounded-full bg-[#186414]" />
                    <span>Lasalgaon (42km) · ₹3,280</span>
                  </div>

                  <div className="absolute bottom-10 right-10 flex items-center gap-1 bg-[#F9EED4] text-[#714E08] px-2 py-1 rounded-lg text-[10px] font-bold shadow-md border border-[#DFC27F]">
                    <span className="w-2 h-2 rounded-full bg-[#C2820C]" />
                    <span>Pune Hub (135km) · ₹3,620</span>
                  </div>

                  <div className="absolute top-16 right-16 flex items-center gap-1 bg-white text-[#11310E] px-2 py-1 rounded-lg text-[10px] font-bold shadow-md">
                    <span className="w-2 h-2 rounded-full bg-[#186414]" />
                    <span>Narayangaon (68km)</span>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between text-xs text-[#AFDCA7]">
                  <span>🟢 Connected to State Mandi Highways</span>
                  <span className="font-mono text-white font-bold">Live GPS Matrix</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 10. AI AGRI ADVISOR SHOWCASE ──────────────────────────── */}
      <section id="ai-advisor" className="py-20 bg-[#FAFDF9] border-t border-[#E2EBE0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left AI Feature Copy */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E5F5E1] text-[#165112] text-xs font-bold border border-[#BDE5B6]">
                <Bot className="w-4 h-4" />
                <span>Powered by Google Gemini 2.0</span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0D290D] tracking-tight">
                Your AI Agricultural Decision Assistant
              </h2>

              <p className="text-sm sm:text-base text-[#4C6049] leading-relaxed">
                Have questions about when to sell your onions, whether to store tomatoes in cold storage, or which mandi has rising arrivals? Ask the PRISMS AI Agri Advisor in plain English or Marathi.
              </p>

              <div className="space-y-3.5 pt-2">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#DFF3DC] text-[#144D0F] flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#143212]">Spatial & Road Distance Intelligence</h4>
                    <p className="text-xs text-[#566B53]">Analyzes Google Maps route elevation, toll plazas, and heavy vehicle restrictions.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#DFF3DC] text-[#144D0F] flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#143212]">Multi-Mandi Benchmark Comparisons</h4>
                    <p className="text-xs text-[#566B53]">Compares historical modal rate cycles from Lasalgaon, Pune, Solapur, and Vashi.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#DFF3DC] text-[#144D0F] flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#143212]">Regional Marathi & Hindi Dialects</h4>
                    <p className="text-xs text-[#566B53]">Speak naturally: "माझा ५० क्विंटल कांदा आता विकावा की १० दिवस थांबावे?"</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Chatbot UI Visual */}
            <div className="lg:col-span-6">
              <div className="rounded-3xl p-5 sm:p-6 bg-white border border-[#DFE9DC] shadow-xl space-y-4">
                {/* Chat Header */}
                <div className="flex items-center justify-between pb-3 border-b border-[#E3ECE0]">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#0F3810] text-white flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-[#B5F7A8]" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#102D0E]">PRISMS AI Advisor</h4>
                      <span className="text-[10px] text-[#227E1A] font-semibold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#227E1A]" /> Online · Live APMC Stream
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-[#586C55] bg-[#F6FAF4] px-2 py-1 rounded border border-[#E0EADE]">
                    Model: Gemini-2.0-Flash
                  </span>
                </div>

                {/* Chat Messages Mock */}
                <div className="space-y-3 text-xs sm:text-sm">
                  {/* Farmer message */}
                  <div className="flex justify-end">
                    <div className="max-w-[85%] bg-[#0F3810] text-white p-3.5 rounded-2xl rounded-tr-sm shadow-sm">
                      <p className="leading-relaxed">
                        "I have 35 Quintals of Nashik Red Onion ready at Dindori. Should I sell at Lasalgaon tomorrow or send to Pune Market Yard?"
                      </p>
                    </div>
                  </div>

                  {/* AI response message */}
                  <div className="flex justify-start">
                    <div className="max-w-[90%] bg-[#F6FAF4] text-[#193217] p-4 rounded-2xl rounded-tl-sm border border-[#E0EADE] shadow-sm space-y-2">
                      <p className="font-semibold text-[#0E2F0C]">
                        🌾 Recommendation: <span className="text-[#1A6F13] font-bold">Route to Pune Market Yard</span>
                      </p>
                      <p className="text-xs text-[#4F624C] leading-relaxed">
                        • <strong>Lasalgaon Mandi:</strong> ₹3,240/Qtl (Distance 42km → Freight ₹2,380 → Net: <strong>₹1,11,020</strong>).
                      </p>
                      <p className="text-xs text-[#4F624C] leading-relaxed">
                        • <strong>Pune APMC:</strong> ₹3,620/Qtl (Distance 165km → Freight ₹7,790 → Net: <strong>₹1,18,910</strong>).
                      </p>
                      <div className="p-2 rounded bg-[#EAF5E8] border border-[#C5E5BF] text-xs font-bold text-[#144B0E]">
                        💡 Net Advantage: Sending to Pune yields <strong>+₹7,890 extra profit</strong> even after paying higher freight.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Input box mock */}
                <div className="pt-2">
                  <div className="flex items-center gap-2 p-2 bg-[#F6FAF4] rounded-xl border border-[#DCE7DA]">
                    <input
                      type="text"
                      disabled
                      placeholder="Ask anything about crop prices, mandis, or freight..."
                      className="w-full text-xs text-[#3E523A] bg-transparent outline-none px-2"
                    />
                    <button
                      onClick={() => handleOpenAuth("signup")}
                      className="p-2 rounded-lg bg-[#0F3810] text-white hover:bg-[#1A5C16] transition-colors"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 11. FAQ SECTION ───────────────────────────────────────── */}
      <section id="faq" className="py-20 bg-white border-t border-[#E2EBE0]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 space-y-3">
            <span className="inline-block px-3 py-1 rounded-full bg-[#E3F4DF] text-[#195614] text-xs font-bold uppercase tracking-wider border border-[#BBE5B4]">
              Got Questions?
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0D290D] tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-sm sm:text-base text-[#4E624A]">
              Everything you need to know about PRISMS, escrow security, and market discovery.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = activeFaq === index;
              return (
                <div
                  key={index}
                  className="bg-[#FAFDF9] rounded-2xl border border-[#DFE8DC] overflow-hidden transition-all shadow-sm"
                >
                  <button
                    onClick={() => setActiveFaq(isOpen ? null : index)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-[#123110] hover:text-[#1F6B17] transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-5 h-5 text-[#5F755A] transition-transform duration-200 shrink-0 ${
                        isOpen ? "rotate-180 text-[#155410]" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-[#4E624B] leading-relaxed border-t border-[#F0F5EE]">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 12. FINAL HIGH-CONVERSION CTA ─────────────────────────── */}
      <section className="py-20 bg-gradient-to-br from-[#0B2A0A] via-[#124010] to-[#0A2909] text-white relative overflow-hidden">
        {/* Glow overlay */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-[#67C756]/15 blur-3xl pointer-events-none rounded-full" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1F541B] border border-[#3E8038] text-xs font-bold text-[#AFF2A4]">
            <Sparkles className="w-3.5 h-3.5 text-[#AFF2A4]" />
            <span>Join 42,000+ Smart Farmers Today</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            Make Every Harvest More Profitable.
          </h2>

          <p className="text-base sm:text-lg text-[#B7DEC0] max-w-2xl mx-auto leading-relaxed">
            Discover the right market, connect with verified buyers, and execute your trade with complete confidence and guaranteed payout security.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={() => handleOpenAuth("signup")}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-[#87DC78] to-[#60C34F] text-[#0A2609] text-base font-extrabold hover:shadow-2xl hover:shadow-[#87DC78]/30 hover:scale-[1.03] active:scale-[0.99] transition-all flex items-center justify-center gap-2 group ring-2 ring-white/40"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => handleOpenAuth("login")}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#1B4B17] border border-[#3A7534] text-white text-base font-bold hover:bg-[#235F1E] transition-all"
            >
              Sign In to Account
            </button>
          </div>

          <div className="pt-6 text-xs text-[#8FB999] flex flex-wrap items-center justify-center gap-6">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#87DC78]" /> Zero Subscription Fees
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#87DC78]" /> 100% Free for Individual Farmers
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#87DC78]" /> Integrated with National APMCs
            </span>
          </div>
        </div>
      </section>

      {/* ── 13. ENTERPRISE FOOTER ─────────────────────────────────── */}
      <footer className="bg-[#071B07] text-[#869E83] text-xs py-14 border-t border-[#133211]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-[#163614]">
            {/* Brand column */}
            <div className="md:col-span-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#1B5218] text-white flex items-center justify-center font-bold">
                  <Sparkles className="w-5 h-5 text-[#AFF2A4]" />
                </div>
                <span className="text-xl font-black text-white font-mono tracking-wider">
                  PRISMS
                </span>
              </div>
              <p className="text-xs text-[#95B191] max-w-sm leading-relaxed">
                Predictive Realization & Intelligence System for Mandi Supplies. An AI-powered agricultural market and trade execution platform for Indian farmers.
              </p>
              <div className="text-[11px] text-[#718C6D] space-y-1">
                <p>Digital India & e-NAM Aligned Architecture</p>
                <p>Ministry of Agriculture & Farmers Welfare Integration</p>
              </div>
            </div>

            {/* Links Columns */}
            <div className="md:col-span-2 space-y-3">
              <h5 className="text-xs font-bold text-white uppercase tracking-wider">Platform</h5>
              <ul className="space-y-2">
                <li>
                  <a href="#how-it-works" className="hover:text-white transition-colors">
                    How It Works
                  </a>
                </li>
                <li>
                  <a href="#features" className="hover:text-white transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#market-intelligence" className="hover:text-white transition-colors">
                    Market Intelligence
                  </a>
                </li>
                <li>
                  <a href="#trade-execution" className="hover:text-white transition-colors">
                    Trade Execution
                  </a>
                </li>
                <li>
                  <a href="#net-realization" className="hover:text-white transition-colors">
                    Net Realization Formula
                  </a>
                </li>
              </ul>
            </div>

            <div className="md:col-span-2 space-y-3">
              <h5 className="text-xs font-bold text-white uppercase tracking-wider">Intelligence</h5>
              <ul className="space-y-2">
                <li>
                  <a href="#gis-map" className="hover:text-white transition-colors">
                    GIS Radius Engine
                  </a>
                </li>
                <li>
                  <a href="#ai-advisor" className="hover:text-white transition-colors">
                    Gemini AI Advisor
                  </a>
                </li>
                <li>
                  <a href="#trade-execution" className="hover:text-white transition-colors">
                    Escrow Settlement
                  </a>
                </li>
                <li>
                  <a href="#features" className="hover:text-white transition-colors">
                    FPO Aggregation
                  </a>
                </li>
              </ul>
            </div>

            <div className="md:col-span-3 space-y-3">
              <h5 className="text-xs font-bold text-white uppercase tracking-wider">Contact & Support</h5>
              <p className="text-xs text-[#95B191]">
                Farmer Helpline (Toll-Free): <br />
                <span className="text-white font-bold font-mono">1800-180-1551</span>
              </p>
              <p className="text-xs text-[#95B191]">
                Email: <span className="text-white font-mono">support@prisms.gov.in</span>
              </p>
              <div className="pt-2">
                <button
                  onClick={() => handleOpenAuth("signup")}
                  className="px-4 py-2 rounded-xl bg-[#1D511A] text-white text-xs font-bold hover:bg-[#256621] transition-colors"
                >
                  Create Farmer Account
                </button>
              </div>
            </div>
          </div>

          {/* Copyright bar */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#698066]">
            <p>© 2026 PRISMS Agricultural Command Center. All Rights Reserved.</p>
            <div className="flex items-center gap-6">
              <a href="#faq" className="hover:text-white transition-colors">
                Privacy Policy
              </a>
              <a href="#faq" className="hover:text-white transition-colors">
                Terms of Service
              </a>
              <a href="#faq" className="hover:text-white transition-colors">
                Security & Escrow
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* ── 14. AUTH MODAL INTEGRATION ────────────────────────────── */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
        lang={lang}
      />
    </div>
  );
};

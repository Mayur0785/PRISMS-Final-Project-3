import React, { useState } from "react";
import {
  TrendingUp,
  ShieldCheck,
  Truck,
  CreditCard,
  Building2,
  Users,
  Compass,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Phone,
  Layers,
  MapPin,
  FileText,
  Activity,
  Bot,
  Zap,
  ChevronRight,
  Menu,
  X,
  Lock,
  Globe,
  Award,
  ChevronDown,
} from "lucide-react";
import { BorderBeam } from "./BorderBeam";
import { SpotlightCard } from "./SpotlightCard";

interface LandingPageProps {
  onOpenAuth: (role: "farmer" | "buyer", mode?: "login" | "signup") => void;
  onExploreFarmer: () => void;
  onExploreBuyer: () => void;
  lang?: "en" | "mr";
  onToggleLang?: (lang: "en" | "mr") => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onOpenAuth,
  onExploreFarmer,
  onExploreBuyer,
  lang = "en",
  onToggleLang,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeFeatureTab, setActiveFeatureTab] = useState<"farmer" | "buyer">("farmer");
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-[#fbfbfa] text-slate-900 flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* 1. NAVBAR */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 text-slate-900 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => scrollToSection("hero")}>
            <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white shadow-sm flex items-center justify-center flex-shrink-0 text-xl font-black">
              🌾
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-xl tracking-tight text-emerald-950 font-serif">PRISMS</span>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300/60 tracking-wider">
                  Agri-Tech
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium tracking-wide">
                Agricultural Market Realization & Trading
              </p>
            </div>
          </div>

          {/* Desktop Center Navigation Links */}
          <nav className="hidden lg:flex items-center gap-8 text-sm font-bold text-slate-600">
            <button onClick={() => scrollToSection("hero")} className="hover:text-emerald-800 transition-colors">
              {lang === "mr" ? "मुख्यपृष्ठ" : "Home"}
            </button>
            <button onClick={() => scrollToSection("features-overview")} className="hover:text-emerald-800 transition-colors">
              {lang === "mr" ? "वैशिष्ट्ये" : "Features"}
            </button>
            <button onClick={() => scrollToSection("how-it-works")} className="hover:text-emerald-800 transition-colors">
              {lang === "mr" ? "कार्यपद्धती" : "How It Works"}
            </button>
          </nav>

          {/* Right Action Controls: Lang Switcher & Dual Login Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {onToggleLang && (
              <button
                type="button"
                onClick={() => onToggleLang(lang === "en" ? "mr" : "en")}
                className="px-2.5 py-1.5 rounded-xl text-[11px] font-extrabold bg-slate-100 border border-slate-200 text-slate-700 hover:text-emerald-900 hover:bg-slate-200 transition-all flex items-center gap-1.5 mr-1"
              >
                <Globe className="w-3.5 h-3.5 text-emerald-700" />
                <span>{lang === "en" ? "मराठी" : "English"}</span>
              </button>
            )}

            {/* Farmer Login Button */}
            <button
              onClick={() => onOpenAuth("farmer", "login")}
              className="px-4 py-2.5 rounded-xl text-xs font-extrabold bg-emerald-700 hover:bg-emerald-800 text-white transition-all shadow-sm active:scale-95 flex items-center gap-1.5"
            >
              <span>🚜</span>
              <span>{lang === "mr" ? "शेतकरी लॉग इन" : "Farmer Login"}</span>
            </button>

            {/* Buyer Login Button */}
            <button
              onClick={() => onOpenAuth("buyer", "login")}
              className="px-4 py-2.5 rounded-xl text-xs font-extrabold bg-slate-900 hover:bg-slate-800 text-white transition-all shadow-sm active:scale-95 flex items-center gap-1.5"
            >
              <span>🏢</span>
              <span>{lang === "mr" ? "खरेदीदार लॉग इन" : "Buyer Login"}</span>
            </button>
          </div>

          {/* Mobile Hamburger Toggle */}
          <div className="flex md:hidden items-center gap-2">
            {onToggleLang && (
              <button
                type="button"
                onClick={() => onToggleLang(lang === "en" ? "mr" : "en")}
                className="px-2 py-1 rounded-lg text-[10px] font-extrabold bg-slate-100 border border-slate-200 text-slate-700"
              >
                {lang === "en" ? "मराठी" : "EN"}
              </button>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-700 hover:text-slate-950 hover:bg-slate-100 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 p-4 space-y-3 shadow-lg animate-in slide-in-from-top duration-200">
            <div className="grid grid-cols-2 gap-2 text-xs font-bold">
              <button
                onClick={() => scrollToSection("features-overview")}
                className="p-2 text-left text-slate-700 hover:text-emerald-800"
              >
                Features
              </button>
              <button
                onClick={() => scrollToSection("how-it-works")}
                className="p-2 text-left text-slate-700 hover:text-emerald-800"
              >
                How It Works
              </button>
            </div>
            <div className="pt-2 border-t border-slate-200 flex flex-col gap-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAuth("farmer", "login");
                }}
                className="w-full py-2.5 rounded-xl bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-2"
              >
                🚜 {lang === "mr" ? "शेतकरी लॉग इन (Farmer Login)" : "Farmer Login"}
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAuth("buyer", "login");
                }}
                className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-extrabold text-xs flex items-center justify-center gap-2"
              >
                🏢 {lang === "mr" ? "खरेदीदार लॉग इन (Buyer Login)" : "Buyer Login"}
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* 2. HERO SECTION */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      <section
        id="hero"
        className="relative bg-gradient-to-b from-[#f7f9f6] via-white to-white text-slate-900 py-14 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 border-b border-slate-200/80"
      >
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Hero Left (50% on Desktop) */}
          <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
            {/* Small badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-extrabold shadow-sm">
              <span className="flex h-2 w-2 rounded-full bg-emerald-600" />
              <span>Digital Agricultural Command Center</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.12] text-slate-900 font-serif">
              Smarter Agricultural Trading.
              <span className="block text-emerald-800 mt-1">
                Better Market Decisions.
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed max-w-xl mx-auto lg:mx-0">
              PRISMS connects farmers and buyers through intelligent market discovery, digital offers, negotiation, logistics and settlement.
            </p>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <button
                onClick={() => onOpenAuth("farmer", "login")}
                className="w-full sm:w-auto px-7 py-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm transition-all shadow-md hover:shadow-lg active:scale-95 flex items-center justify-center gap-2.5"
              >
                <span>🚜</span>
                <span>{lang === "mr" ? "शेतकरी लॉग इन" : "Login as Farmer"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => onOpenAuth("buyer", "login")}
                className="w-full sm:w-auto px-7 py-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm transition-all shadow-md hover:shadow-lg active:scale-95 flex items-center justify-center gap-2.5"
              >
                <span>🏢</span>
                <span>{lang === "mr" ? "खरेदीदार लॉग इन" : "Login as Buyer"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Minimal Trust Indicators */}
            <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-slate-500 font-semibold">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Zero Brokerage</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Verified APMC Rates</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-emerald-600" />
                <span>Integrated Logistics</span>
              </div>
            </div>
          </div>

          {/* Hero Right (50% on Desktop): High Quality Realistic Agricultural Photo */}
          <div className="lg:col-span-6 flex justify-center">
            <div className="w-full max-w-lg lg:max-w-none rounded-3xl overflow-hidden bg-white p-2.5 border border-emerald-100 shadow-xl shadow-emerald-950/5">
              <div className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-slate-100">
                <img
                  src="/images/prisms_field_hero.jpg"
                  alt="Indian farmer in agricultural field with harvested produce"
                  className="w-full h-full object-cover object-center transition-transform duration-500 hover:scale-105"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/hero-farm.jpg";
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* 3. ONE PLATFORM. COMPLETE AGRICULTURAL TRADE. */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      <section id="features-overview" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-black uppercase text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              End-to-End Workflow
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight font-serif">
              One Platform. Complete Agricultural Trade.
            </h2>
            <p className="text-sm sm:text-base text-slate-600 font-normal max-w-2xl mx-auto">
              Empowering farmers with transparent market price realization and providing commercial buyers with direct farm-gate supply.
            </p>
          </div>

          {/* 3 Simple Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1: Market Discovery */}
            <div className="p-8 rounded-2xl bg-[#f7f9f6] border border-slate-200/80 space-y-4 hover:border-emerald-300 hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-2xl font-bold">
                📈
              </div>
              <h3 className="font-extrabold text-xl text-slate-900">Market Discovery</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Compare APMC mandi prices, spatial transit costs, and discover verified buyer demands with zero hidden brokerage.
              </p>
            </div>

            {/* Card 2: Digital Negotiation */}
            <div className="p-8 rounded-2xl bg-[#f7f9f6] border border-slate-200/80 space-y-4 hover:border-emerald-300 hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-2xl font-bold">
                🤝
              </div>
              <h3 className="font-extrabold text-xl text-slate-900">Digital Negotiation</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Receive direct transparent bids, submit structured counter-offers, and finalize mutually agreed trade terms instantly.
              </p>
            </div>

            {/* Card 3: End-to-End Trade Tracking */}
            <div className="p-8 rounded-2xl bg-[#f7f9f6] border border-slate-200/80 space-y-4 hover:border-emerald-300 hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-2xl font-bold">
                🚚
              </div>
              <h3 className="font-extrabold text-xl text-slate-900">End-to-End Trade Tracking</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Monitor real-time pickup and transit milestones, with automated escrow settlements released directly upon verified delivery.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* 3. PROBLEM / SOLUTION SECTION */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      <section id="problem-solution" className="py-20 px-4 sm:px-6 lg:px-8 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto space-y-14">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-black uppercase text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              The Agricultural Market Gap
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Why Traditional Agricultural Trade is Broken
            </h2>
            <p className="text-sm text-slate-600 font-medium">
              Fragmented markets, price asymmetry, and lack of verified logistics cost farmers up to 35% of their true realization every season.
            </p>
          </div>

          {/* Problem Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-red-50/50 border border-red-100 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center font-bold">
                ⚠️
              </div>
              <h3 className="font-extrabold text-base text-slate-900">Mandi Price Uncertainty</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Farmers travel to distant mandis without knowing real net realization after deducting transport, commission, handling, and transit spoilage.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-amber-50/50 border border-amber-100 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                ⛓️
              </div>
              <h3 className="font-extrabold text-base text-slate-900">Multiple Intermediaries</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Cascading middlemen take hefty cuts between farm gate and retail buyers, reducing farmer revenue while inflating consumer food costs.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center font-bold">
                ⏱️
              </div>
              <h3 className="font-extrabold text-base text-slate-900">Disconnected Settlement & Logistics</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Commercial buyers struggle to discover graded produce at scale, while farmers face payment delays and lack freight tracking.
              </p>
            </div>
          </div>

          {/* Solution Banner */}
          <div className="bg-gradient-to-r from-[#163819] to-[#255f2c] rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 text-xs font-bold text-amber-300">
                <Sparkles className="w-4 h-4" />
                <span>THE PRISMS TRANSFORMATION</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                "PRISMS brings the entire trade journey into one digital command center."
              </h3>
              <p className="text-xs text-emerald-100 max-w-2xl font-medium leading-relaxed">
                From standardized lot creation (`LOT-2026-XXXX`) and APMC modal comparisons, to verified buyer matching and digital escrow release.
              </p>
            </div>
            <button
              onClick={() => scrollToSection("features")}
              className="px-6 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition-all shadow-md whitespace-nowrap active:scale-95"
            >
              See All Features ↓
            </button>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* 4. FEATURES SECTION */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-[#fbfbfa]">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-black uppercase text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Complete Agricultural Engine
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Tailored Tools for Every Market Participant
            </h2>
            <p className="text-sm text-slate-600 font-medium">
              Explore how PRISMS equips farmers and institutional buyers with dedicated digital capabilities.
            </p>

            {/* Feature Tab Switcher */}
            <div className="inline-flex p-1.5 bg-slate-200 rounded-2xl text-xs font-black mt-4">
              <button
                onClick={() => setActiveFeatureTab("farmer")}
                className={`px-6 py-2.5 rounded-xl transition-all flex items-center gap-2 ${
                  activeFeatureTab === "farmer"
                    ? "bg-emerald-700 text-white shadow-md"
                    : "text-slate-700 hover:text-slate-950"
                }`}
              >
                <span>🚜</span>
                <span>For Farmers & FPOs</span>
              </button>
              <button
                onClick={() => setActiveFeatureTab("buyer")}
                className={`px-6 py-2.5 rounded-xl transition-all flex items-center gap-2 ${
                  activeFeatureTab === "buyer"
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-slate-700 hover:text-slate-950"
                }`}
              >
                <span>🏢</span>
                <span>For Commercial Buyers</span>
              </button>
            </div>
          </div>

          {/* FARMER FEATURES GRID */}
          {activeFeatureTab === "farmer" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
              {[
                {
                  icon: "📦",
                  title: "Crop & Trade Lot Management",
                  desc: "Standardize produce into formal trade lots with automated quality scoring (Moisture, Variety, Grade A/B) and tracking.",
                },
                {
                  icon: "📍",
                  title: "Mandi Market Discovery",
                  desc: "Live Agmarknet benchmark rates across all APMC mandis in Maharashtra with real GPS transit distance calculations.",
                },
                {
                  icon: "📊",
                  title: "Price & Net Realization Comparison",
                  desc: "Calculate true profit per quintal after deducting vehicle freight, labour per trip, mandi commission, and transit spoilage.",
                },
                {
                  icon: "🤝",
                  title: "Digital Buyer Offers",
                  desc: "Receive binding direct purchase bids from verified food processors, exporters, and retail chains with 0% middleman fees.",
                },
                {
                  icon: "🚚",
                  title: "Milestone Delivery Tracking",
                  desc: "Monitor vehicle dispatch, pickup readiness, real-time in-transit progress, and delivery confirmation in one view.",
                },
                {
                  icon: "💳",
                  title: "Payment Ledger & Escrow",
                  desc: "Transparent digital settlement record with automated payout unlock upon delivery completion. No payment defaults.",
                },
                {
                  icon: "📜",
                  title: "Trade History & Invoicing",
                  desc: "Maintain complete transaction history, download tax invoices, and verify quality certificates for previous seasons.",
                },
                {
                  icon: "🤖",
                  title: "AI Agri Advisor (Gemini)",
                  desc: "Multilingual AI assistant providing instant crop disease diagnoses, mandi selling advice, and weather-adjusted timing.",
                },
                {
                  icon: "🗺️",
                  title: "GIS & Spatial Intelligence",
                  desc: "Interactive GIS map pinpointing nearby mandis, cold storage hubs, state warehouse depots, and freight routes.",
                },
              ].map((f, i) => (
                <div
                  key={i}
                  className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all space-y-3"
                >
                  <div className="text-2xl">{f.icon}</div>
                  <h3 className="font-extrabold text-base text-slate-900">{f.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">{f.desc}</p>
                </div>
              ))}
            </div>
          )}

          {/* BUYER FEATURES GRID */}
          {activeFeatureTab === "buyer" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
              {[
                {
                  icon: "🏢",
                  title: "Buyer Command Dashboard",
                  desc: "Comprehensive procurement command center managing all purchasing activity, demand quotas, and active trade lots.",
                },
                {
                  icon: "📢",
                  title: "Demand Management",
                  desc: "Publish required commodity volumes, target price ranges, preferred quality grades, and delivery terms to farmers.",
                },
                {
                  icon: "🔍",
                  title: "Farmer & Trade Lot Discovery",
                  desc: "Browse live farmer lots across districts with certified quality grades, harvest photos, and expected farm-gate rates.",
                },
                {
                  icon: "💬",
                  title: "Digital Bids & Direct Offers",
                  desc: "Submit binding offers with custom transport terms (Buyer Pickup vs Farmer Delivery) and bank escrow terms.",
                },
                {
                  icon: "🔄",
                  title: "Counter Offer Negotiations",
                  desc: "Seamlessly receive and respond to farmer counter prices in real time with automated deal confirmation.",
                },
                {
                  icon: "🔔",
                  title: "Offer & Arrival Notifications",
                  desc: "Instant alerts for incoming produce matching your exact target commodities and sudden mandi rate drops.",
                },
                {
                  icon: "🚛",
                  title: "Purchase & Dispatch Tracking",
                  desc: "Live visibility on pickup vehicle dispatch, transporter details, bolero maxi-truck allocations, and gate entry.",
                },
                {
                  icon: "🔒",
                  title: "Escrow Settlement Security",
                  desc: "Simulated bank escrow locks funds securely and releases payouts to the farmer upon verified weight & quality check.",
                },
                {
                  icon: "📈",
                  title: "Procurement Analytics",
                  desc: "Analyze procurement volume, average purchase rates vs APMC averages, and historical supplier quality metrics.",
                },
              ].map((f, i) => (
                <div
                  key={i}
                  className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all space-y-3"
                >
                  <div className="text-2xl">{f.icon}</div>
                  <h3 className="font-extrabold text-base text-slate-900">{f.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">{f.desc}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* 5. HOW PRISMS WORKS SECTION */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto space-y-14">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-black uppercase text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              End-to-End Workflow
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              How the Trade Journey Operates on PRISMS
            </h2>
            <p className="text-sm text-slate-600 font-medium">
              A transparent, 6-step verified pipeline ensuring complete security from listing to final bank settlement.
            </p>
          </div>

          {/* 6 Step Pipeline Flow */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                step: "01",
                title: "Crop Listing & Lot Creation",
                desc: "Farmer registers their harvested produce into a standardized trade lot (`LOT-2026-XXXX`) with grade and quantity.",
              },
              {
                step: "02",
                title: "Mandi Benchmark Comparison",
                desc: "PRISMS computes live APMC modal prices minus logistics freight, commission, and spoilage to calculate true net realization.",
              },
              {
                step: "03",
                title: "Direct Buyer Discovery",
                desc: "Institutional buyers and processors discover available supply lots matching their exact procurement demands.",
              },
              {
                step: "04",
                title: "Digital Offer Negotiation",
                desc: "Buyer submits an offer; farmer can accept or counter. Once confirmed, binding deal terms are locked.",
              },
              {
                step: "05",
                title: "Milestone Logistics Tracking",
                desc: "Dispatch and transit milestones (`PICKUP_READY` → `DISPATCHED` → `IN_TRANSIT` → `DELIVERED`) are tracked live.",
              },
              {
                step: "06",
                title: "Automated Escrow Release",
                desc: "Buyer inspects produce upon arrival; simulated escrow releases direct payment to the farmer's bank account.",
              },
            ].map((s, i) => (
              <div key={i} className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 relative overflow-hidden">
                <span className="text-4xl font-black text-emerald-900/15 absolute top-3 right-4 font-mono">
                  {s.step}
                </span>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                  Step {s.step}
                </span>
                <h3 className="font-extrabold text-base text-slate-900">{s.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* 6. ROLE SELECTION ("Choose Your PRISMS Experience") */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      <section id="role-selection" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#fbfbfa] to-emerald-50/50">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-black uppercase text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300">
              Role Selector
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Choose Your PRISMS Experience
            </h2>
            <p className="text-sm text-slate-600 font-medium">
              Select your role to access your dedicated command center, market analytics, and trade tools.
            </p>
          </div>

          {/* Two Large Role Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* FARMER CARD */}
            <div className="bg-white rounded-3xl p-8 border-2 border-emerald-200 shadow-xl hover:shadow-2xl transition-all space-y-6 flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full pointer-events-none" />
              <div className="space-y-4 relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center text-3xl shadow-lg">
                  🚜
                </div>
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-700">For Producers</span>
                  <h3 className="text-2xl font-black text-slate-900 mt-0.5">FARMER</h3>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                  "List your produce, discover buyers, compare realization across nearby mandis, and manage your complete trade journey."
                </p>

                <ul className="space-y-2 text-xs font-bold text-slate-700 pt-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Real-time Mandi Modal Price Comparisons</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Direct Buyer Offers with 0% Middleman Gouging</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Delivery Tracking & Guaranteed Escrow Payments</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-2 pt-4 relative z-10">
                <button
                  onClick={() => onOpenAuth("farmer", "login")}
                  className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                >
                  <span>Continue as Farmer</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <div className="text-center">
                  <button
                    onClick={() => onOpenAuth("farmer", "signup")}
                    className="text-xs text-emerald-700 hover:underline font-bold"
                  >
                    New user? Register as Farmer →
                  </button>
                </div>
              </div>
            </div>

            {/* BUYER CARD */}
            <div className="bg-white rounded-3xl p-8 border-2 border-blue-200 shadow-xl hover:shadow-2xl transition-all space-y-6 flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full pointer-events-none" />
              <div className="space-y-4 relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-3xl shadow-lg">
                  🏢
                </div>
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-blue-700">For Commercial Buyers</span>
                  <h3 className="text-2xl font-black text-slate-900 mt-0.5">BUYER</h3>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                  "Discover farmer supply, manage procurement demand, submit offers, and manage commercial purchasing activities."
                </p>

                <ul className="space-y-2 text-xs font-bold text-slate-700 pt-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    <span>Direct Access to Graded Farmer Produce Lots</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    <span>Post Purchase Demands & Receive Lot Submissions</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    <span>Live Transit Milestone Visibility & Escrow Ledger</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-2 pt-4 relative z-10">
                <button
                  onClick={() => onOpenAuth("buyer", "login")}
                  className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-sm transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                >
                  <span>Continue as Buyer</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <div className="text-center">
                  <button
                    onClick={() => onOpenAuth("buyer", "signup")}
                    className="text-xs text-blue-700 hover:underline font-bold"
                  >
                    New organization? Register as Buyer →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* 7. TRUST & PLATFORM HIGHLIGHTS */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      <section id="highlights" className="py-20 px-4 sm:px-6 lg:px-8 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-black uppercase text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Institutional Trust & Security
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Engineered for Enterprise Agri-Trade
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-[#f8faf7] border border-slate-200 space-y-2.5 text-center">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-xl mx-auto font-bold">
                🏛️
              </div>
              <h3 className="font-extrabold text-sm text-slate-900">APMC Mandi Verified</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Official benchmark price feed linked with central Agmarknet data.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#f8faf7] border border-slate-200 space-y-2.5 text-center">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center text-xl mx-auto font-bold">
                🔐
              </div>
              <h3 className="font-extrabold text-sm text-slate-900">Escrow Protected</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Digital escrow safeguards buyer funds and guarantees farmer payouts.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#f8faf7] border border-slate-200 space-y-2.5 text-center">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center text-xl mx-auto font-bold">
                🧭
              </div>
              <h3 className="font-extrabold text-sm text-slate-900">Spatial Geo-Routing</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Accurate GIS route distance, freight rates, and transit time matrix.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#f8faf7] border border-slate-200 space-y-2.5 text-center">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-xl mx-auto font-bold">
                🛡️
              </div>
              <h3 className="font-extrabold text-sm text-slate-900">Zero Middlemen</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Direct peer-to-peer negotiation between verified producers & buyers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* 8. CALL TO ACTION (CTA) */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-tr from-[#163819] via-[#1c4820] to-[#255f2c] text-white relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center space-y-6 relative z-10">
          <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-black uppercase border border-emerald-400/30">
            Get Started Today
          </span>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
            Ready to make smarter agricultural trade decisions?
          </h2>
          <p className="text-sm sm:text-base text-emerald-100/90 font-medium max-w-2xl mx-auto leading-relaxed">
            Join thousands of progressive farmers and commercial buyers leveraging PRISMS for verified price discovery, direct digital contracts, and secure settlements.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => onOpenAuth("farmer", "login")}
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-sm transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2"
            >
              <span>🚜</span>
              <span>Login as Farmer</span>
            </button>
            <button
              onClick={() => onOpenAuth("buyer", "login")}
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-sm transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2 border border-blue-400/40"
            >
              <span>🏢</span>
              <span>Login as Buyer</span>
            </button>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* 9. FOOTER */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      <footer className="bg-[#0f2411] text-emerald-100/80 py-12 px-4 sm:px-6 lg:px-8 border-t border-emerald-900 text-xs">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🌾</span>
              <span className="font-black text-base text-white font-serif">PRISMS</span>
            </div>
            <p className="text-[11px] leading-relaxed text-emerald-200/70 font-medium">
              Digital Agricultural Command Center. Predictive Realization & Intelligence System for Mandi Supplies.
            </p>
          </div>

          <div className="space-y-2">
            <div className="font-extrabold text-white uppercase text-[11px] tracking-wider mb-2">Navigation</div>
            <div className="flex flex-col gap-1.5 font-medium">
              <button onClick={() => scrollToSection("hero")} className="text-left hover:text-white transition-colors">Home</button>
              <button onClick={() => scrollToSection("problem-solution")} className="text-left hover:text-white transition-colors">Vision & Problem</button>
              <button onClick={() => scrollToSection("features")} className="text-left hover:text-white transition-colors">Platform Features</button>
              <button onClick={() => scrollToSection("how-it-works")} className="text-left hover:text-white transition-colors">How It Works</button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="font-extrabold text-white uppercase text-[11px] tracking-wider mb-2">Portals</div>
            <div className="flex flex-col gap-1.5 font-medium">
              <button onClick={() => onOpenAuth("farmer", "login")} className="text-left hover:text-white transition-colors">Farmer Command Portal</button>
              <button onClick={() => onOpenAuth("buyer", "login")} className="text-left hover:text-white transition-colors">Buyer Procurement Portal</button>
              <button onClick={() => onOpenAuth("farmer", "signup")} className="text-left hover:text-white transition-colors">Farmer Registration</button>
              <button onClick={() => onOpenAuth("buyer", "signup")} className="text-left hover:text-white transition-colors">Buyer Onboarding</button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="font-extrabold text-white uppercase text-[11px] tracking-wider mb-2">Support & Legal</div>
            <div className="flex flex-col gap-1.5 font-medium">
              <span className="text-emerald-200/60">APMC Integration: Active</span>
              <span className="text-emerald-200/60">Data Security: AES-256</span>
              <span className="text-emerald-200/60">State Coverage: Maharashtra</span>
              <span className="text-emerald-200/60">Helpline: 1800-2026-PRISMS</span>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-6 border-t border-emerald-900/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] font-medium text-emerald-300/60">
          <div>© 2026 PRISMS Agricultural Command Center. All rights reserved.</div>
          <div className="flex items-center gap-4">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span>APMC Benchmark Disclaimer</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

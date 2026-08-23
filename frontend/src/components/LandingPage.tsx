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
      <header className="sticky top-0 z-50 bg-[#163819]/95 backdrop-blur-md border-b border-emerald-900/60 text-white shadow-lg transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => scrollToSection("hero")}>
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-amber-400 p-0.5 shadow-md flex items-center justify-center flex-shrink-0">
              <div className="w-full h-full bg-[#163819] rounded-[14px] flex items-center justify-center text-xl font-black">
                🌾
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-white font-serif">PRISMS</span>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 tracking-wider">
                  Agri-Tech 2026
                </span>
              </div>
              <p className="text-[11px] text-emerald-200/80 font-medium tracking-wide">
                Digital Agricultural Command Center
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7 text-xs font-bold tracking-wide text-emerald-100">
            <button onClick={() => scrollToSection("hero")} className="hover:text-white transition-colors">
              {lang === "mr" ? "मुख्यपृष्ठ" : "Home"}
            </button>
            <button onClick={() => scrollToSection("problem-solution")} className="hover:text-white transition-colors">
              {lang === "mr" ? "उपाय व दृष्टी" : "Vision"}
            </button>
            <button onClick={() => scrollToSection("features")} className="hover:text-white transition-colors">
              {lang === "mr" ? "वैशिष्ट्ये" : "Features"}
            </button>
            <button onClick={() => scrollToSection("how-it-works")} className="hover:text-white transition-colors">
              {lang === "mr" ? "कार्यपद्धती" : "How It Works"}
            </button>
            <button onClick={() => scrollToSection("role-selection")} className="hover:text-white transition-colors">
              {lang === "mr" ? "शेतकरी व खरेदीदार" : "Role Selector"}
            </button>
            <button onClick={() => scrollToSection("highlights")} className="hover:text-white transition-colors">
              {lang === "mr" ? "सुरक्षितता" : "Security"}
            </button>
          </nav>

          {/* Right Action Controls: Lang Switcher & Dual Login Buttons */}
          <div className="hidden md:flex items-center gap-2.5">
            {/* Language Switcher */}
            {onToggleLang && (
              <button
                type="button"
                onClick={() => onToggleLang(lang === "en" ? "mr" : "en")}
                className="px-2.5 py-1.5 rounded-xl text-[11px] font-extrabold bg-emerald-950/60 border border-emerald-700/50 text-emerald-200 hover:text-white hover:bg-emerald-900 transition-all flex items-center gap-1.5"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>{lang === "en" ? "मराठी" : "English"}</span>
              </button>
            )}

            {/* Farmer Login Button */}
            <button
              onClick={() => onOpenAuth("farmer", "login")}
              className="px-4 py-2 rounded-xl text-xs font-extrabold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md active:scale-95 flex items-center gap-1.5 border border-emerald-400/40"
            >
              <span>🚜</span>
              <span>{lang === "mr" ? "शेतकरी लॉग इन" : "Farmer Login"}</span>
            </button>

            {/* Buyer Login Button */}
            <button
              onClick={() => onOpenAuth("buyer", "login")}
              className="px-4 py-2 rounded-xl text-xs font-extrabold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-md active:scale-95 flex items-center gap-1.5 border border-blue-400/40"
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
                className="px-2 py-1 rounded-lg text-[10px] font-extrabold bg-emerald-900/60 border border-emerald-700/50 text-emerald-200"
              >
                {lang === "en" ? "मराठी" : "EN"}
              </button>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-emerald-100 hover:text-white hover:bg-emerald-900/60 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#143317] border-b border-emerald-800 p-4 space-y-3 animate-in slide-in-from-top duration-200">
            <div className="grid grid-cols-2 gap-2 text-xs font-bold">
              <button
                onClick={() => scrollToSection("problem-solution")}
                className="p-2 text-left text-emerald-200 hover:text-white"
              >
                Vision & Problem
              </button>
              <button
                onClick={() => scrollToSection("features")}
                className="p-2 text-left text-emerald-200 hover:text-white"
              >
                Platform Features
              </button>
              <button
                onClick={() => scrollToSection("how-it-works")}
                className="p-2 text-left text-emerald-200 hover:text-white"
              >
                How It Works
              </button>
              <button
                onClick={() => scrollToSection("role-selection")}
                className="p-2 text-left text-emerald-200 hover:text-white"
              >
                Role Experience
              </button>
            </div>
            <div className="pt-2 border-t border-emerald-800/80 flex flex-col gap-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAuth("farmer", "login");
                }}
                className="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-extrabold text-xs flex items-center justify-center gap-2"
              >
                🚜 {lang === "mr" ? "शेतकरी लॉग इन (Farmer Login)" : "Farmer Login"}
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAuth("buyer", "login");
                }}
                className="w-full py-2.5 rounded-xl bg-blue-600 text-white font-extrabold text-xs flex items-center justify-center gap-2"
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
        className="relative bg-gradient-to-b from-[#163819] via-[#1a441e] to-[#205325] text-white pt-16 pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden"
      >
        {/* Background Grid Accent */}
        <div className="absolute inset-0 bg-[radial-gradient(#2f7836_1px,transparent_1px)] [background-size:24px_24px] opacity-25" />
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Hero Left Text & Actions */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            {/* Gov / Standards Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-xs font-extrabold shadow-sm">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              <span>APMC Market Realization & Spatial Intelligence Platform</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] text-white">
              Smarter Agricultural Trading.
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-amber-300 to-emerald-200 mt-1">
                Better Market Decisions.
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-sm sm:text-base text-emerald-100/90 font-medium max-w-2xl leading-relaxed mx-auto lg:mx-0">
              PRISMS connects farmers with buyers, compares market opportunities, and helps manage the complete trade journey from crop listing to delivery and payment.
            </p>

            {/* Role Action CTAs */}
            <div className="pt-3 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5">
              <button
                onClick={() => onOpenAuth("farmer", "login")}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm transition-all shadow-xl hover:shadow-emerald-500/25 active:scale-95 flex items-center justify-center gap-2"
              >
                <span>🚜</span>
                <span>{lang === "mr" ? "शेतकरी म्हणून प्रवेश करा" : "Login as Farmer"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => onOpenAuth("buyer", "login")}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-sm transition-all shadow-xl hover:shadow-blue-600/25 active:scale-95 flex items-center justify-center gap-2 border border-blue-400/40"
              >
                <span>🏢</span>
                <span>{lang === "mr" ? "खरेदीदार म्हणून प्रवेश करा" : "Login as Buyer"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => scrollToSection("problem-solution")}
                className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 text-emerald-100 font-bold text-xs transition-all border border-white/20 flex items-center justify-center gap-1.5"
              >
                <Compass className="w-4 h-4 text-amber-400" />
                <span>Explore PRISMS</span>
              </button>
            </div>

            {/* Trust Badges */}
            <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-5 text-xs text-emerald-200/80 font-bold border-t border-emerald-800/60">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Zero Hidden Brokerage</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Direct Escrow Settlements</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-emerald-400" />
                <span>GPS Milestone Logistics</span>
              </div>
            </div>
          </div>

          {/* Hero Right Visual: Enterprise Trade Mockup */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-3xl bg-gradient-to-b from-slate-900 to-[#0e2411] border border-emerald-500/30 p-5 sm:p-6 shadow-2xl space-y-4">
              <BorderBeam size={260} duration={8} colorFrom="#10b981" colorTo="#fe932c" />

              {/* Header Preview Bar */}
              <div className="flex items-center justify-between border-b border-emerald-900/60 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                  <span className="text-[11px] font-mono font-bold text-emerald-300 ml-2">
                    PRISMS-CORE // PIPELINE
                  </span>
                </div>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                  LIVE BENCHMARK
                </span>
              </div>

              {/* Sample Trade Lot Card */}
              <div className="bg-emerald-950/60 rounded-2xl p-4 border border-emerald-800/60 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-[10px] font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/40">
                      LOT-2026-0073
                    </span>
                    <h4 className="font-black text-base text-white mt-1">Red Onion (Nashik) • 30 Qtl</h4>
                    <p className="text-[11px] text-emerald-200/70 font-medium">Origin: Pimpalgaon Mandi Catchment</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-500 text-slate-950 uppercase">
                    Grade A (45mm)
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-black/30 p-2.5 rounded-xl border border-emerald-900/40">
                    <span className="text-[10px] text-emerald-300/80 font-bold block uppercase">Mandi Modal Rate</span>
                    <span className="font-black text-base text-white">₹3,200/Qtl</span>
                  </div>
                  <div className="bg-black/30 p-2.5 rounded-xl border border-emerald-900/40">
                    <span className="text-[10px] text-emerald-300/80 font-bold block uppercase">Top Buyer Bid</span>
                    <span className="font-black text-base text-amber-300">₹3,296/Qtl</span>
                  </div>
                </div>
              </div>

              {/* Pipeline Flow Steps */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2.5 bg-emerald-900/20 rounded-xl border border-emerald-800/40">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-400" />
                    <span className="font-bold text-slate-200">Nashik Agro Processors Ltd.</span>
                  </div>
                  <span className="font-extrabold text-emerald-400">Offer Accepted ✓</span>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-emerald-900/20 rounded-xl border border-emerald-800/40">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-amber-400" />
                    <span className="font-bold text-slate-200">Transit: Bolero Pickup</span>
                  </div>
                  <span className="font-bold text-amber-300">In-Transit (35km)</span>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-emerald-900/20 rounded-xl border border-emerald-800/40">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-slate-200">Escrow Net Settlement</span>
                  </div>
                  <span className="font-black text-emerald-300">₹97,460 Secured</span>
                </div>
              </div>
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

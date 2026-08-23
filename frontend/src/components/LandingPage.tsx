import React, { useState } from "react";
import {
  ShieldCheck,
  Truck,
  ArrowRight,
  CheckCircle2,
  Menu,
  X,
  Globe,
} from "lucide-react";

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
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 text-slate-900 shadow-sm transition-all flex-shrink-0">
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
            <button onClick={() => scrollToSection("hero")} className="hover:text-emerald-800 transition-colors">
              {lang === "mr" ? "वैशिष्ट्ये" : "Features"}
            </button>
            <button onClick={() => scrollToSection("hero")} className="hover:text-emerald-800 transition-colors">
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
              className="px-4 py-2.5 rounded-xl text-xs font-extrabold bg-emerald-700 hover:bg-emerald-800 text-white transition-all shadow-sm active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <span>🚜</span>
              <span>{lang === "mr" ? "शेतकरी लॉग इन" : "Farmer Login"}</span>
            </button>

            {/* Buyer Login Button */}
            <button
              onClick={() => onOpenAuth("buyer", "login")}
              className="px-4 py-2.5 rounded-xl text-xs font-extrabold bg-slate-900 hover:bg-slate-800 text-white transition-all shadow-sm active:scale-95 flex items-center gap-1.5 cursor-pointer"
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
                onClick={() => scrollToSection("hero")}
                className="p-2 text-left text-slate-700 hover:text-emerald-800"
              >
                {lang === "mr" ? "वैशिष्ट्ये" : "Features"}
              </button>
              <button
                onClick={() => scrollToSection("hero")}
                className="p-2 text-left text-slate-700 hover:text-emerald-800"
              >
                {lang === "mr" ? "कार्यपद्धती" : "How It Works"}
              </button>
            </div>
            <div className="pt-2 border-t border-slate-200 flex flex-col gap-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAuth("farmer", "login");
                }}
                className="w-full py-2.5 rounded-xl bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                🚜 {lang === "mr" ? "शेतकरी लॉग इन (Farmer Login)" : "Farmer Login"}
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAuth("buyer", "login");
                }}
                className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                🏢 {lang === "mr" ? "खरेदीदार लॉग इन (Buyer Login)" : "Buyer Login"}
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* 2. HERO SECTION (ONLY SECTION BELOW NAVBAR) */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      <section
        id="hero"
        className="flex-1 flex items-center justify-center relative bg-gradient-to-b from-[#f7f9f6] via-white to-white text-slate-900 py-10 sm:py-14 lg:py-16 px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-6xl mx-auto w-full flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-10">
          {/* Hero Left (46% on Desktop) */}
          <div className="w-full lg:w-[46%] space-y-5 text-center lg:text-left flex-shrink-0">
            {/* Small badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-extrabold shadow-sm">
              <span className="flex h-2 w-2 rounded-full bg-emerald-600" />
              <span>Digital Agricultural Command Center</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.12] text-slate-900 font-serif">
              Smarter Agricultural Trading.
              <span className="block text-emerald-800 mt-1">
                Better Market Decisions.
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-sm sm:text-base text-slate-600 font-normal leading-relaxed max-w-lg mx-auto lg:mx-0">
              PRISMS connects farmers and buyers through intelligent market discovery, digital offers, negotiation, logistics and settlement.
            </p>

            {/* Action Buttons */}
            <div className="pt-1 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
              <button
                onClick={() => onOpenAuth("farmer", "login")}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm transition-all shadow-sm hover:shadow active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>🚜</span>
                <span>{lang === "mr" ? "शेतकरी लॉग इन" : "Login as Farmer"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => onOpenAuth("buyer", "login")}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm transition-all shadow-sm hover:shadow active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>🏢</span>
                <span>{lang === "mr" ? "खरेदीदार लॉग इन" : "Login as Buyer"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Minimal Trust Indicators */}
            <div className="pt-3 flex flex-wrap items-center justify-center lg:justify-start gap-5 text-xs text-slate-500 font-semibold border-t border-slate-100">
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

          {/* Hero Right (54% on Desktop): Premium Indian Agriculture Photograph */}
          <div className="w-full lg:w-[54%] flex justify-center lg:justify-end">
            <div className="w-full max-w-lg lg:max-w-none rounded-2xl overflow-hidden bg-white p-2 border border-emerald-100/90 shadow-lg shadow-emerald-950/5">
              <div className="relative rounded-xl overflow-hidden aspect-[4/3] bg-slate-100">
                <img
                  src="/images/prisms_field_hero.jpg"
                  alt="Indian farmer with fresh harvest produce in agricultural field"
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
    </div>
  );
};

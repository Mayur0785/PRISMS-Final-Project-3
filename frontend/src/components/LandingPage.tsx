import React, { useState } from "react";
import {
  ShieldCheck,
  Truck,
  ArrowRight,
  CheckCircle2,
  Menu,
  X,
  Globe,
  Compass,
  ArrowLeftRight,
  FileCheck,
  PackagePlus,
  Search,
  Handshake,
  BadgeCheck,
} from "lucide-react";
import { t, type Lang } from "@/lib/i18n";

interface LandingPageProps {
  onOpenAuth: (role: "farmer" | "buyer", mode?: "login" | "signup") => void;
  onExploreFarmer: () => void;
  onExploreBuyer: () => void;
  lang?: Lang;
  onToggleLang?: (lang: Lang) => void;
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
    <div className="min-h-screen bg-[#fbfbfa] text-slate-900 flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900 scroll-smooth">
      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* 1. NAVBAR */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 text-slate-900 shadow-sm transition-all flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => scrollToSection("home")}>
            <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white shadow-sm flex items-center justify-center flex-shrink-0 text-xl font-black">
              🌾
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-xl tracking-tight text-emerald-950 font-serif">KrishiSetu</span>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300/60 tracking-wider">
                  {t(lang, "agriTech")}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium tracking-wide">
                {t(lang, "landingSubBrand")}
              </p>
            </div>
          </div>

          {/* Desktop Center Navigation Links */}
          <nav className="hidden lg:flex items-center gap-8 text-sm font-bold text-slate-600">
            <button onClick={() => scrollToSection("home")} className="hover:text-emerald-800 transition-colors cursor-pointer">
              {t(lang, "home")}
            </button>
            <button onClick={() => scrollToSection("features")} className="hover:text-emerald-800 transition-colors cursor-pointer">
              {t(lang, "features")}
            </button>
            <button onClick={() => scrollToSection("how-it-works")} className="hover:text-emerald-800 transition-colors cursor-pointer">
              {t(lang, "howItWorks")}
            </button>
          </nav>

          {/* Right Action Controls: Lang Switcher & Dual Login Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {onToggleLang && (
              <button
                type="button"
                onClick={() => onToggleLang(lang === "en" ? "mr" : "en")}
                className="px-2.5 py-1.5 rounded-xl text-[11px] font-extrabold bg-slate-100 border border-slate-200 text-slate-700 hover:text-emerald-900 hover:bg-slate-200 transition-all flex items-center gap-1.5 mr-1 cursor-pointer"
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
              <span>{t(lang, "farmerLogin")}</span>
            </button>

            {/* Buyer Login Button */}
            <button
              onClick={() => onOpenAuth("buyer", "login")}
              className="px-4 py-2.5 rounded-xl text-xs font-extrabold bg-slate-900 hover:bg-slate-800 text-white transition-all shadow-sm active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <span>🏢</span>
              <span>{t(lang, "buyerLogin")}</span>
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
              className="p-2 rounded-xl text-slate-700 hover:text-slate-950 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 p-4 space-y-3 shadow-lg animate-in slide-in-from-top duration-200">
            <div className="grid grid-cols-3 gap-2 text-xs font-bold text-center">
              <button
                onClick={() => scrollToSection("home")}
                className="p-2 rounded-lg bg-slate-50 text-slate-700 hover:text-emerald-800"
              >
                {t(lang, "home")}
              </button>
              <button
                onClick={() => scrollToSection("features")}
                className="p-2 rounded-lg bg-slate-50 text-slate-700 hover:text-emerald-800"
              >
                {t(lang, "features")}
              </button>
              <button
                onClick={() => scrollToSection("how-it-works")}
                className="p-2 rounded-lg bg-slate-50 text-slate-700 hover:text-emerald-800"
              >
                {t(lang, "howItWorks")}
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
                🚜 {t(lang, "farmerLogin")}
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAuth("buyer", "login");
                }}
                className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                🏢 {t(lang, "buyerLogin")}
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* 2. HERO / HOME SECTION */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      <section
        id="home"
        className="flex items-center justify-center relative bg-gradient-to-b from-[#f7f9f6] via-white to-white text-slate-900 py-10 sm:py-14 lg:py-16 px-4 sm:px-6 lg:px-8 border-b border-slate-100"
      >
        <div className="max-w-6xl mx-auto w-full flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-10">
          {/* Hero Left (46% on Desktop) */}
          <div className="w-full lg:w-[46%] space-y-5 text-center lg:text-left flex-shrink-0">
            {/* Small badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-extrabold shadow-sm">
              <span className="flex h-2 w-2 rounded-full bg-emerald-600" />
              <span>{t(lang, "heroBadge")}</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.14] text-slate-900 font-serif">
              {t(lang, "heroHeading1")}
              <span className="block text-emerald-800 mt-1">
                {t(lang, "heroHeading2")}
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-sm sm:text-base text-slate-600 font-normal leading-relaxed max-w-lg mx-auto lg:mx-0">
              {t(lang, "heroDescription")}
            </p>

            {/* Action Buttons */}
            <div className="pt-1 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
              <button
                onClick={() => onOpenAuth("farmer", "login")}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm transition-all shadow-sm hover:shadow active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>🚜</span>
                <span>{t(lang, "loginAsFarmer")}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => onOpenAuth("buyer", "login")}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm transition-all shadow-sm hover:shadow active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>🏢</span>
                <span>{t(lang, "loginAsBuyer")}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Minimal Trust Indicators */}
            <div className="pt-3 flex flex-wrap items-center justify-center lg:justify-start gap-5 text-xs text-slate-500 font-semibold border-t border-slate-100">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{t(lang, "zeroBrokerage")}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>{t(lang, "verifiedApmcRates")}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-emerald-600" />
                <span>{t(lang, "integratedLogistics")}</span>
              </div>
            </div>
          </div>

          {/* Hero Right (54% on Desktop): Premium Indian Agriculture Photograph */}
          <div className="w-full lg:w-[54%] flex justify-center lg:justify-end">
            <div className="w-full max-w-lg lg:max-w-none rounded-2xl overflow-hidden bg-white p-2 border border-emerald-100/90 shadow-lg shadow-emerald-950/5">
              <div className="relative rounded-xl overflow-hidden aspect-[4/3] bg-slate-100">
                <img
                  src="/images/prisms_field_hero.jpg"
                  alt={t(lang, "farmerHeroAlt")}
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
      {/* 3. FEATURES SECTION */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      <section
        id="features"
        className="py-14 sm:py-16 px-4 sm:px-6 lg:px-8 bg-[#fbfbfa] border-b border-slate-200/80"
      >
        <div className="max-w-6xl mx-auto space-y-10">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 font-serif">
              {t(lang, "featuresHeading")}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 font-normal">
              {t(lang, "featuresSubheading")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1: Market Discovery */}
            <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/80 shadow-sm hover:border-emerald-300 hover:shadow-md transition-all space-y-3.5 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/60 flex items-center justify-center font-black text-xl">
                  <Compass className="w-6 h-6" />
                </div>
                <h3 className="font-serif font-black text-lg text-slate-900">
                  {t(lang, "featDiscoveryTitle")}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                  {t(lang, "featDiscoveryDesc")}
                </p>
              </div>
            </div>

            {/* Feature 2: Digital Negotiation */}
            <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/80 shadow-sm hover:border-emerald-300 hover:shadow-md transition-all space-y-3.5 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/60 flex items-center justify-center font-black text-xl">
                  <ArrowLeftRight className="w-6 h-6" />
                </div>
                <h3 className="font-serif font-black text-lg text-slate-900">
                  {t(lang, "featNegotiationTitle")}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                  {t(lang, "featNegotiationDesc")}
                </p>
              </div>
            </div>

            {/* Feature 3: Trade Execution */}
            <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/80 shadow-sm hover:border-emerald-300 hover:shadow-md transition-all space-y-3.5 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/60 flex items-center justify-center font-black text-xl">
                  <FileCheck className="w-6 h-6" />
                </div>
                <h3 className="font-serif font-black text-lg text-slate-900">
                  {t(lang, "featExecutionTitle")}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                  {t(lang, "featExecutionDesc")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* 4. HOW IT WORKS SECTION */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      <section
        id="how-it-works"
        className="py-14 sm:py-16 px-4 sm:px-6 lg:px-8 bg-white"
      >
        <div className="max-w-6xl mx-auto space-y-10">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 font-serif">
              {t(lang, "howItWorksHeading")}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 font-normal">
              {t(lang, "howItWorksSubheading")}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Step 1 */}
            <div className="bg-[#fbfbfa] p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="w-8 h-8 rounded-full bg-emerald-700 text-white font-black text-xs flex items-center justify-center shadow-xs">
                  1
                </span>
                <PackagePlus className="w-5 h-5 text-emerald-700" />
              </div>
              <h3 className="font-serif font-black text-base text-slate-900">
                {t(lang, "step1Title")}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {t(lang, "step1Desc")}
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-[#fbfbfa] p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="w-8 h-8 rounded-full bg-emerald-700 text-white font-black text-xs flex items-center justify-center shadow-xs">
                  2
                </span>
                <Search className="w-5 h-5 text-emerald-700" />
              </div>
              <h3 className="font-serif font-black text-base text-slate-900">
                {t(lang, "step2Title")}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {t(lang, "step2Desc")}
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-[#fbfbfa] p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="w-8 h-8 rounded-full bg-emerald-700 text-white font-black text-xs flex items-center justify-center shadow-xs">
                  3
                </span>
                <Handshake className="w-5 h-5 text-emerald-700" />
              </div>
              <h3 className="font-serif font-black text-base text-slate-900">
                {t(lang, "step3Title")}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {t(lang, "step3Desc")}
              </p>
            </div>

            {/* Step 4 */}
            <div className="bg-[#fbfbfa] p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="w-8 h-8 rounded-full bg-emerald-700 text-white font-black text-xs flex items-center justify-center shadow-xs">
                  4
                </span>
                <BadgeCheck className="w-5 h-5 text-emerald-700" />
              </div>
              <h3 className="font-serif font-black text-base text-slate-900">
                {t(lang, "step4Title")}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {t(lang, "step4Desc")}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

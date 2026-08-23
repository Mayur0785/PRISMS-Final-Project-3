import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  Building2,
  FileCheck2,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Menu,
  X,
  Globe,
  Package,
  Search,
  Truck,
  IndianRupee,
  ChevronRight,
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
  const [lang, setLang] = useState<"en" | "mr">("en");

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

  return (
    <div className="min-h-screen bg-[#FBFDF9] text-[#191D17] font-sans antialiased selection:bg-[#1C5E18] selection:text-white">
      {/* ── 1. NAVBAR (Transparent over Hero / Blurred on Scroll) ───── */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-[#0B240B]/90 backdrop-blur-md border-b border-white/10 shadow-lg py-3.5"
            : "bg-gradient-to-b from-black/60 via-black/20 to-transparent py-5"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Brand Logo */}
          <a href="#" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1B5717] to-[#2B8224] flex items-center justify-center text-white shadow-md ring-2 ring-white/30 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 text-[#B6F5A9]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-tight text-white font-mono">
                  PRISMS
                </span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#E8F6E4]/20 text-[#B6F5A9] border border-[#B6F5A9]/30">
                  AI 2.0
                </span>
              </div>
              <p className="text-[10px] font-semibold text-white/75 tracking-wider uppercase">
                DIGITAL AGRI COMMAND CENTER
              </p>
            </div>
          </a>

          {/* Center Navigation */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-white/90">
            <a href="#hero" className="hover:text-white transition-colors">
              {lang === "mr" ? "मुख्य" : "Home"}
            </a>
            <a href="#features" className="hover:text-white transition-colors">
              {lang === "mr" ? "वैशिष्ट्ये" : "Features"}
            </a>
            <a href="#about" className="hover:text-white transition-colors">
              {lang === "mr" ? "प्रणाली बद्दल" : "About"}
            </a>
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden sm:flex items-center gap-3">
            {/* Lang switcher */}
            <button
              onClick={() => setLang(lang === "en" ? "mr" : "en")}
              className="px-2.5 py-1.5 rounded-lg border border-white/20 text-xs font-semibold text-white hover:bg-white/10 transition-colors flex items-center gap-1.5"
            >
              <Globe className="w-3.5 h-3.5 text-[#B6F5A9]" />
              <span>{lang === "en" ? "मराठी" : "English"}</span>
            </button>

            {currentUser ? (
              <button
                onClick={() => (onEnterDashboard ? onEnterDashboard() : (window.location.href = "/"))}
                className="px-4 py-2 rounded-xl bg-white text-[#0F3810] text-sm font-bold hover:bg-white/90 transition-all shadow-md flex items-center gap-2"
              >
                <span>Dashboard ({currentUser.name?.split(" ")[0] || "Farmer"})</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                <button
                  onClick={() => handleOpenAuth("login")}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-white hover:bg-white/10 transition-colors"
                >
                  {lang === "mr" ? "लॉग इन" : "Login"}
                </button>
                <button
                  onClick={() => handleOpenAuth("signup")}
                  className="px-4 py-2 rounded-xl bg-white text-[#0F3810] text-sm font-bold hover:bg-[#F2F8EF] transition-all shadow-md flex items-center gap-1.5 group"
                >
                  <span>{lang === "mr" ? "नोंदणी करा" : "Sign Up"}</span>
                  <ArrowRight className="w-4 h-4 text-[#0F3810] group-hover:translate-x-0.5 transition-transform" />
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-white hover:bg-white/10"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#0A260A] border-b border-white/10 px-4 pt-3 pb-6 space-y-3 shadow-2xl text-white">
            <a
              href="#hero"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-medium hover:text-[#B6F5A9]"
            >
              Home
            </a>
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-medium hover:text-[#B6F5A9]"
            >
              Features
            </a>
            <a
              href="#about"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-medium hover:text-[#B6F5A9]"
            >
              About
            </a>
            <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleOpenAuth("login");
                }}
                className="w-full py-2.5 rounded-xl border border-white/30 text-sm font-semibold text-white text-center"
              >
                Login
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleOpenAuth("signup");
                }}
                className="w-full py-2.5 rounded-xl bg-white text-[#0F3810] text-sm font-bold text-center shadow-md"
              >
                Sign Up
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ── 2. HERO SECTION (80–90vh with Farm Tractor Background) ── */}
      <section
        id="hero"
        className="relative min-h-[85vh] lg:min-h-[90vh] flex items-center justify-center bg-cover bg-center bg-no-repeat overflow-hidden"
        style={{
          backgroundImage: `url('/hero-farm.jpg')`,
        }}
      >
        {/* Dark Natural Green Scrim Overlay for crisp text contrast */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#061C05]/90 via-[#092B08]/75 to-[#051A04]/45" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B240B]/80 via-transparent to-black/30" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-28 relative z-10 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Hero Content */}
            <div className="lg:col-span-8 space-y-6 text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-xs font-bold text-[#DCFBD7] shadow-sm">
                <span className="w-2 h-2 rounded-full bg-[#75E565] animate-ping" />
                <span className="w-2 h-2 rounded-full bg-[#75E565] -ml-4" />
                <span>SMART AGRICULTURAL MARKET PLATFORM</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.1]">
                Sell Smarter. <br />
                <span className="text-[#A5F295]">Earn More.</span>
              </h1>

              {/* Secondary Heading */}
              <p className="text-xl sm:text-2xl font-bold text-white/95">
                Your Intelligent Agricultural Trading Command Center
              </p>

              {/* Supporting Description */}
              <p className="text-sm sm:text-base text-white/80 max-w-2xl leading-relaxed font-normal">
                Discover better markets, compare real net realization after road freight and APMC fees, connect directly with verified buyers, and manage your agricultural trade from one unified platform.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
                <button
                  onClick={() => handleOpenAuth("signup")}
                  className="w-full sm:w-auto px-8 py-4 rounded-xl bg-[#1E6B19] hover:bg-[#25811F] text-white text-base font-bold transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.99] flex items-center justify-center gap-2 group ring-2 ring-white/30"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={() => handleOpenAuth("login")}
                  className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/40 text-white text-base font-bold transition-all flex items-center justify-center gap-2"
                >
                  <span>Login</span>
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="pt-2 flex items-center gap-6 text-xs text-white/80">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#89F075]" />
                  <span>2,400+ Verified Mandis</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#89F075]" />
                  <span>Escrow Payout Security</span>
                </div>
                <div className="hidden sm:flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#89F075]" />
                  <span>100% Free for Farmers</span>
                </div>
              </div>
            </div>

            {/* Right Subtle Floating Market Data Cards */}
            <div className="lg:col-span-4 flex flex-col gap-4">
              {/* Card 1: Better Market Price */}
              <div className="bg-white/90 backdrop-blur-md rounded-2xl p-5 border border-white/40 shadow-2xl text-[#143211] space-y-2 hover:translate-y-[-2px] transition-transform">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-bold text-[#4B6347] uppercase tracking-wider">
                    Better Market Price
                  </span>
                  <span className="px-2 py-0.5 rounded text-[11px] font-extrabold bg-[#E2F7DE] text-[#196B16]">
                    +16.8% Gain
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-black font-mono text-[#0F3810]">
                    ₹3,620 <span className="text-xs font-normal text-[#50664C]">/ Qtl</span>
                  </span>
                  <span className="text-xs font-bold text-[#276E23]">Pune Market Yard</span>
                </div>
                <p className="text-[11px] text-[#556D51]">
                  Higher modal rate identified over local yard benchmark.
                </p>
              </div>

              {/* Card 2: Estimated Net Realization */}
              <div className="bg-[#0D2E0B]/90 backdrop-blur-md rounded-2xl p-5 border border-white/20 shadow-2xl text-white space-y-2 hover:translate-y-[-2px] transition-transform">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-bold text-[#A8EBA0] uppercase tracking-wider">
                    Estimated Net Realization
                  </span>
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#1C5B17] text-[#DCFBD7]">
                    Take-Home
                  </span>
                </div>
                <div className="text-2xl font-black font-mono text-white">
                  ₹1,32,480{" "}
                  <span className="text-xs font-normal text-[#BEECC0]">for 40 Qtl</span>
                </div>
                <p className="text-[11px] text-[#A5CCA0]">
                  Exact freight and mandi cess calculated before you dispatch.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. FEATURE STRIP ──────────────────────────────────────── */}
      <section id="features" className="py-14 bg-white border-b border-[#E3EBE0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className="flex items-start gap-4 p-2">
              <div className="w-12 h-12 rounded-xl bg-[#E8F5E5] text-[#155411] flex items-center justify-center shrink-0 border border-[#BFE4B9]">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-[#11310E]">Market Intelligence</h3>
                <p className="text-xs text-[#52664F] leading-relaxed">
                  Compare live mandi rates & road freight across 2,400+ Indian APMCs.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex items-start gap-4 p-2">
              <div className="w-12 h-12 rounded-xl bg-[#E8F5E5] text-[#155411] flex items-center justify-center shrink-0 border border-[#BFE4B9]">
                <Building2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-[#11310E]">Buyer Matching</h3>
                <p className="text-xs text-[#52664F] leading-relaxed">
                  Connect directly with verified processors, wholesalers & exporters.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex items-start gap-4 p-2">
              <div className="w-12 h-12 rounded-xl bg-[#E8F5E5] text-[#155411] flex items-center justify-center shrink-0 border border-[#BFE4B9]">
                <FileCheck2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-[#11310E]">Trade Execution</h3>
                <p className="text-xs text-[#52664F] leading-relaxed">
                  Digitize crop lots with transparent offer terms and milestone delivery.
                </p>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="flex items-start gap-4 p-2">
              <div className="w-12 h-12 rounded-xl bg-[#E8F5E5] text-[#155411] flex items-center justify-center shrink-0 border border-[#BFE4B9]">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-[#11310E]">Payment Tracking</h3>
                <p className="text-xs text-[#52664F] leading-relaxed">
                  Transparent deductions with bank-grade escrow payout upon delivery.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. ABOUT PRISMS (Simple Horizontal Journey Flow) ──────── */}
      <section id="about" className="py-20 bg-[#FAFDF9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="inline-block px-3 py-1 rounded-full bg-[#E3F4DF] text-[#175612] text-xs font-bold uppercase tracking-wider border border-[#BBE5B4]">
              End-to-End Agri Trade
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0D290D] tracking-tight">
              One platform for the complete agricultural trade journey.
            </h2>
            <p className="text-sm sm:text-base text-[#4E624A]">
              From farm gate harvest to guaranteed bank settlement in 6 seamless steps.
            </p>
          </div>

          {/* Clean Horizontal Steps */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {/* Step 1 */}
            <div className="bg-white rounded-2xl p-5 border border-[#E0EBDC] shadow-sm text-center space-y-2.5">
              <div className="w-10 h-10 rounded-full bg-[#EAF6E7] text-[#165612] font-bold flex items-center justify-center mx-auto text-sm border border-[#C5E8BF]">
                1
              </div>
              <h4 className="font-bold text-sm text-[#11300E]">Harvest</h4>
              <p className="text-[11px] text-[#556952] leading-relaxed">
                Ready your crop yield at the farm gate.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white rounded-2xl p-5 border border-[#E0EBDC] shadow-sm text-center space-y-2.5">
              <div className="w-10 h-10 rounded-full bg-[#EAF6E7] text-[#165612] font-bold flex items-center justify-center mx-auto text-sm border border-[#C5E8BF]">
                2
              </div>
              <h4 className="font-bold text-sm text-[#11300E]">Trade Lot</h4>
              <p className="text-[11px] text-[#556952] leading-relaxed">
                Create digital lot with quantity & grade.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white rounded-2xl p-5 border border-[#E0EBDC] shadow-sm text-center space-y-2.5">
              <div className="w-10 h-10 rounded-full bg-[#EAF6E7] text-[#165612] font-bold flex items-center justify-center mx-auto text-sm border border-[#C5E8BF]">
                3
              </div>
              <h4 className="font-bold text-sm text-[#11300E]">Market Discovery</h4>
              <p className="text-[11px] text-[#556952] leading-relaxed">
                Scan top-paying mandis & freight costs.
              </p>
            </div>

            {/* Step 4 */}
            <div className="bg-white rounded-2xl p-5 border border-[#E0EBDC] shadow-sm text-center space-y-2.5">
              <div className="w-10 h-10 rounded-full bg-[#EAF6E7] text-[#165612] font-bold flex items-center justify-center mx-auto text-sm border border-[#C5E8BF]">
                4
              </div>
              <h4 className="font-bold text-sm text-[#11300E]">Buyer Offer</h4>
              <p className="text-[11px] text-[#556952] leading-relaxed">
                Receive and accept verified buyer bids.
              </p>
            </div>

            {/* Step 5 */}
            <div className="bg-white rounded-2xl p-5 border border-[#E0EBDC] shadow-sm text-center space-y-2.5">
              <div className="w-10 h-10 rounded-full bg-[#EAF6E7] text-[#165612] font-bold flex items-center justify-center mx-auto text-sm border border-[#C5E8BF]">
                5
              </div>
              <h4 className="font-bold text-sm text-[#11300E]">Delivery</h4>
              <p className="text-[11px] text-[#556952] leading-relaxed">
                Track pickup, vehicle transit & gate arrival.
              </p>
            </div>

            {/* Step 6 */}
            <div className="bg-white rounded-2xl p-5 border border-[#E0EBDC] shadow-sm text-center space-y-2.5">
              <div className="w-10 h-10 rounded-full bg-[#EAF6E7] text-[#165612] font-bold flex items-center justify-center mx-auto text-sm border border-[#C5E8BF]">
                6
              </div>
              <h4 className="font-bold text-sm text-[#11300E]">Payment</h4>
              <p className="text-[11px] text-[#556952] leading-relaxed">
                Instant escrow settlement to bank account.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. FINAL CTA (Clean Full-Width Green Section) ─────────── */}
      <section className="py-20 bg-gradient-to-br from-[#0B2B0A] via-[#134911] to-[#0A2909] text-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
            Ready to sell smarter?
          </h2>
          <p className="text-base sm:text-lg text-[#B9E0BF] max-w-xl mx-auto leading-relaxed">
            Discover better opportunities for your next harvest with PRISMS. Join thousands of farmers trading with confidence.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={() => handleOpenAuth("signup")}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white text-[#0F3810] text-base font-extrabold hover:bg-[#F2F8EF] transition-all shadow-xl hover:scale-[1.02] active:scale-[0.99]"
            >
              Get Started
            </button>
            <button
              onClick={() => handleOpenAuth("login")}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-transparent border border-white/40 text-white text-base font-bold hover:bg-white/10 transition-all"
            >
              Login
            </button>
          </div>
        </div>
      </section>

      {/* ── 6. MINIMAL FOOTER ─────────────────────────────────────── */}
      <footer className="bg-[#061A06] text-[#7A9577] text-xs py-10 border-t border-[#123610]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <span className="text-lg font-black text-white font-mono tracking-wider block">
              PRISMS
            </span>
            <p className="text-[11px] text-[#86A383] mt-0.5">
              Digital Agri Command Center
            </p>
          </div>

          <div className="flex items-center gap-6 font-semibold text-white/80">
            <a href="#hero" className="hover:text-white transition-colors">
              Home
            </a>
            <a href="#features" className="hover:text-white transition-colors">
              Features
            </a>
            <a href="#about" className="hover:text-white transition-colors">
              About
            </a>
            <button
              onClick={() => handleOpenAuth("login")}
              className="hover:text-white transition-colors"
            >
              Login
            </button>
          </div>

          <p className="text-[11px] text-[#637C60]">
            © 2026 PRISMS Agricultural Command Center. All rights reserved.
          </p>
        </div>
      </footer>

      {/* ── 7. AUTH MODAL INTEGRATION ─────────────────────────────── */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
        lang={lang}
      />
    </div>
  );
};

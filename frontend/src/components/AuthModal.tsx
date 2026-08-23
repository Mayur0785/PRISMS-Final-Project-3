import React, { useState, useEffect } from "react";
import { loginUser, registerUser, type AuthUser } from "@/lib/prisms";
import { BorderBeam } from "@/components/BorderBeam";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: AuthUser) => void;
  lang?: "en" | "mr";
  initialRole?: "farmer" | "buyer" | "fpo" | "advisor";
  initialMode?: "login" | "signup";
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  lang = "en",
  initialRole = "farmer",
  initialMode = "login",
}) => {
  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"farmer" | "buyer" | "fpo" | "advisor">(initialRole);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authMethod, setAuthMethod] = useState<"password" | "otp">("password");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setRole(initialRole);
      setError("");
      setOtpSent(false);
      setAuthMethod("password");
      if (initialRole === "buyer") {
        setEmail("buyer.nashik@prisms.gov.in");
        setPassword("Kisan@2024");
        setName("Nashik Agro Processors Ltd.");
      } else {
        setEmail("farmer.lasalgaon@prisms.gov.in");
        setPassword("Kisan@2024");
        setName("Mayur Kapse (नवी मुंबई)");
      }
    }
  }, [isOpen, initialRole, initialMode]);

  if (!isOpen) return null;

  const normalizeIdentifier = (val: string) => {
    const trimmed = val.trim();
    if (/^\d{10}$/.test(trimmed)) {
      return `${trimmed}@prisms.gov.in`;
    }
    return trimmed;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const targetEmail = normalizeIdentifier(email);

    try {
      if (authMethod === "otp") {
        if (!otpSent) {
          if (!email.trim()) {
            setError(lang === "mr" ? "कृपया वैध १० अंकी मोबाईल नंबर प्रविष्ट करा." : "Please enter a valid 10-digit mobile number.");
            setLoading(false);
            return;
          }
          setOtpSent(true);
          setOtpCode("490218");
          setLoading(false);
          return;
        }

        // Verify OTP Login
        try {
          const res = await loginUser(targetEmail, "Kisan@2024");
          onSuccess(res.user);
          onClose();
        } catch {
          // Auto-create user on first-time OTP
          const defaultName = name.trim() || (role === "buyer" ? (lang === "mr" ? `खरेदीदार (${email.slice(-4)})` : `Buyer (${email.slice(-4)})`) : (lang === "mr" ? `शेतकरी (${email.slice(-4)})` : `Farmer (${email.slice(-4)})`));
          const regRes = await registerUser(defaultName, targetEmail, "Kisan@2024", role);
          onSuccess(regRes.user);
          onClose();
        }
        return;
      }

      if (mode === "login") {
        const res = await loginUser(targetEmail, password);
        onSuccess(res.user);
        onClose();
      } else {
        const res = await registerUser(name || (role === "buyer" ? "Registered Buyer" : "Farmer User"), targetEmail, password, role);
        onSuccess(res.user);
        onClose();
      }
    } catch (err: any) {
      const msg = err?.message || err?.response?.data?.error?.message || err?.response?.data?.message;
      if (msg && (msg.includes("already exists") || msg.includes("switch to Sign In") || err?.code === "ACCOUNT_EXISTS")) {
        setError(lang === "mr" 
          ? "या मोबाईल नंबर किंवा ईमेलने खाते आधीपासून अस्तित्वात आहे. कृपया लॉग इन (Sign In) वर जा."
          : "An account with this mobile number or email already exists. Please switch to Sign In.");
      } else if (msg && (msg.includes("Incorrect password") || err?.code === "INVALID_PASSWORD")) {
        setError(lang === "mr" ? "चुकीचा पासवर्ड. कृपया पुन्हा प्रयत्न करा." : "Incorrect password. Please try again.");
      } else if (msg && (msg.includes("Account not found") || err?.code === "ACCOUNT_NOT_FOUND")) {
        setError(lang === "mr" ? "खाते आढळले नाही. कृपया 'नवीन नोंदणी' (Create Account) करा." : "Account not found. Please create an account.");
      } else {
        setError(msg || (lang === "mr" ? "प्रमाणीकरण अयशस्वी. कृपया पुन्हा प्रयत्न करा." : "Authentication failed. Please try again."));
      }
    } finally {
      setLoading(false);
    }
  };

  const isBuyer = role === "buyer";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-surface rounded-2xl border border-outline-variant max-w-md w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 relative">
        <BorderBeam size={220} duration={6} colorFrom={isBuyer ? "#1d4ed8" : "#3b6934"} colorTo="#fe932c" />

        {/* Modal Header */}
        <div className="p-6 bg-surface-container-high border-b border-outline-variant flex justify-between items-start relative z-10">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-xl ${isBuyer ? "bg-blue-600" : "bg-primary"} text-on-primary flex items-center justify-center font-bold text-xl shadow-md`}>
              {isBuyer ? "🏢" : "🌾"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-[20px] font-extrabold text-on-surface leading-tight">
                  {mode === "login"
                    ? isBuyer
                      ? lang === "mr" ? "खरेदीदार लॉग इन" : "Buyer Sign In"
                      : lang === "mr" ? "शेतकरी लॉग इन" : "Farmer Sign In"
                    : isBuyer
                    ? lang === "mr" ? "नवीन खरेदीदार नोंदणी" : "Register as Buyer"
                    : lang === "mr" ? "नवीन शेतकरी नोंदणी" : "Register as Farmer"}
                </h3>
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${isBuyer ? "bg-blue-100 text-blue-800 border border-blue-200" : "bg-emerald-100 text-emerald-800 border border-emerald-200"}`}>
                  {role}
                </span>
              </div>
              <p className="text-[12px] text-on-surface-variant font-medium mt-0.5">
                {isBuyer
                  ? lang === "mr" ? "थेट शेतकरी पुरवठा, डिजिटल खरेदी आणि सुरक्षित व्यापार" : "Direct farmer supply discovery, digital offers & procurement"
                  : lang === "mr" ? "थेट APMC भाव, हमीभाव आणि AI नफा विश्लेषण" : "Live APMC prices, MSP benchmarks & AI profit"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-variant text-on-surface-variant transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="grid grid-cols-2 p-1.5 bg-surface-container border-b border-outline-variant text-[13px] font-bold text-center">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError("");
              setOtpSent(false);
            }}
            className={`py-2.5 rounded-lg transition-all ${
              mode === "login"
                ? "bg-surface text-primary shadow-sm"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            {lang === "mr" ? "लॉग इन (Sign In)" : "Sign In"}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setError("");
              setOtpSent(false);
            }}
            className={`py-2.5 rounded-lg transition-all ${
              mode === "signup"
                ? "bg-surface text-primary shadow-sm"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            {lang === "mr" ? "नोंदणी (Sign Up)" : "Create Account"}
          </button>
        </div>

        {/* Role Selector */}
        <div className="px-6 pt-3 pb-1">
          <label className="block text-[11px] font-extrabold text-on-surface-variant uppercase tracking-wider mb-1.5">
            {lang === "mr" ? "भूमिका निवडा (Select Role)" : "Selected Role"}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {[
              { id: "farmer", label: lang === "mr" ? "🚜 शेतकरी" : "🚜 Farmer" },
              { id: "buyer", label: lang === "mr" ? "🏢 खरेदीदार" : "🏢 Buyer" },
              { id: "fpo", label: lang === "mr" ? "🌾 FPO" : "🌾 FPO" },
              { id: "advisor", label: lang === "mr" ? "📊 सल्लागार" : "📊 Advisor" },
            ].map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => {
                  setRole(r.id as any);
                  if (r.id === "buyer") {
                    setEmail("buyer.nashik@prisms.gov.in");
                    setName("Nashik Agro Processors Ltd.");
                  } else if (r.id === "farmer") {
                    setEmail("farmer.lasalgaon@prisms.gov.in");
                    setName("Mayur Kapse (नवी मुंबई)");
                  }
                }}
                className={`py-2 px-1 rounded-lg border text-center font-bold text-[11px] transition-all ${
                  role === r.id
                    ? isBuyer && r.id === "buyer"
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : "bg-primary text-on-primary border-primary shadow-sm"
                    : "bg-surface-container-low border-outline-variant text-on-surface-variant hover:bg-surface-container"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Alternate Auth Method Toggle (Password vs Mobile OTP) */}
        {mode === "login" && (
          <div className="px-6 pt-3 flex items-center justify-between text-[12px] font-bold border-b border-outline-variant/40 pb-3">
            <span className="text-on-surface-variant">
              {lang === "mr" ? "लॉग इन पर्याय:" : "Sign In Option:"}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setAuthMethod("password");
                  setOtpSent(false);
                  setError("");
                }}
                className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all border ${
                  authMethod === "password"
                    ? "bg-primary text-on-primary border-primary shadow-sm"
                    : "bg-surface-container border-outline-variant text-on-surface-variant hover:text-on-surface"
                }`}
              >
                🔑 {lang === "mr" ? "पासवर्ड" : "Password"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMethod("otp");
                  setError("");
                }}
                className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all border ${
                  authMethod === "otp"
                    ? "bg-primary text-on-primary border-primary shadow-sm"
                    : "bg-surface-container border-outline-variant text-on-surface-variant hover:text-on-surface"
                }`}
              >
                📱 {lang === "mr" ? "मोबाईल OTP" : "Mobile OTP"}
              </button>
            </div>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-3.5 text-[13px] relative z-10">
          {error && (
            <div className="p-3 bg-alert-terracotta/10 border border-alert-terracotta/30 text-alert-terracotta rounded-lg font-bold text-[12px] flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">error</span>
              <span>{error}</span>
            </div>
          )}

          {mode === "signup" && (
            <div>
              <label className="block font-bold text-on-surface-variant mb-1">
                {isBuyer
                  ? lang === "mr" ? "कंपनी / व्यवसाय नाव (Business Name)" : "Business / Company Name"
                  : lang === "mr" ? "पूर्ण नाव (Full Name)" : "Full Name"}
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={isBuyer ? "e.g. Pune Fresh Foods Pvt Ltd" : lang === "mr" ? "आपले पूर्ण नाव प्रविष्ट करा" : "Enter your full name"}
                className="w-full bg-surface-container-low border border-outline-variant rounded-lg p-2.5 text-on-surface font-medium focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
          )}

          <div>
            <label className="block font-bold text-on-surface-variant mb-1">
              {authMethod === "otp"
                ? lang === "mr"
                  ? "१० अंकी मोबाईल नंबर"
                  : "10-Digit Mobile Number"
                : lang === "mr"
                ? "ईमेल किंवा मोबाईल नंबर"
                : "Email or Mobile Number"}
            </label>
            <input
              type="text"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={
                authMethod === "otp"
                  ? lang === "mr"
                    ? "उदा. 9876543210"
                    : "e.g. 9876543210"
                  : isBuyer
                  ? "e.g. buyer.nashik@prisms.gov.in"
                  : lang === "mr"
                  ? "ईमेल किंवा १० अंकी मोबाईल नंबर"
                  : "Enter email or mobile number"
              }
              className="w-full bg-surface-container-low border border-outline-variant rounded-lg p-2.5 text-on-surface font-medium focus:ring-2 focus:ring-primary outline-none"
            />
          </div>

          {/* Password Input */}
          {(authMethod === "password" || mode === "signup") && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-bold text-on-surface-variant">
                  {lang === "mr" ? "पासवर्ड (Password)" : "Password"}
                </label>
                {mode === "login" && (
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMethod("otp");
                      setOtpSent(true);
                      setOtpCode("490218");
                    }}
                    className="text-[11px] font-bold text-primary hover:underline"
                  >
                    {lang === "mr" ? "OTP ने साइन इन करा" : "Sign in via OTP"}
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required={authMethod === "password" || mode === "signup"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg p-2.5 pr-10 text-on-surface font-medium focus:ring-2 focus:ring-primary outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Mobile OTP Verification Step */}
          {authMethod === "otp" && mode === "login" && otpSent && (
            <div className="p-3 bg-surface-container-high border border-primary/30 rounded-xl space-y-2 animate-in fade-in duration-200">
              <div className="flex justify-between items-center text-[12px] font-bold">
                <span className="text-primary flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">sms</span>
                  {lang === "mr" ? "SMS द्वारे OTP पाठवला गेला" : "OTP Code Sent via SMS"}
                </span>
                <span className="text-[11px] text-on-surface-variant font-mono bg-primary/10 px-2 py-0.5 rounded">
                  Demo Code: {otpCode}
                </span>
              </div>
              <input
                type="text"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                maxLength={6}
                placeholder="Enter 6-digit OTP"
                className="w-full bg-surface border border-outline-variant rounded-lg p-2.5 text-center font-mono font-bold tracking-widest text-[16px] text-on-surface focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 ${isBuyer ? "bg-blue-600 hover:bg-blue-700" : "bg-primary hover:bg-primary-container"} text-on-primary rounded-xl font-bold text-[14px] transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 mt-4`}
          >
            {loading ? (
              <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">
                  {authMethod === "otp" ? "smartphone" : mode === "login" ? "login" : "how_to_reg"}
                </span>
                <span>
                  {authMethod === "otp"
                    ? otpSent
                      ? lang === "mr"
                        ? "OTP पडताळणी व लॉग इन"
                        : "Verify OTP & Sign In"
                      : lang === "mr"
                      ? "OTP मिळवा"
                      : "Send OTP Code"
                    : mode === "login"
                    ? isBuyer
                      ? lang === "mr" ? "खरेदीदार लॉग इन करा" : "Sign In as Buyer"
                      : lang === "mr" ? "शेतकरी लॉग इन करा" : "Sign In as Farmer"
                    : isBuyer
                    ? lang === "mr" ? "खरेदीदार नोंदणी पूर्ण करा" : "Complete Buyer Registration"
                    : lang === "mr" ? "शेतकरी नोंदणी पूर्ण करा" : "Complete Farmer Registration"}
                </span>
              </>
            )}
          </button>

          {/* Quick Demo Credentials Autofill */}
          <div className="pt-2 flex flex-col gap-1.5 text-center">
            <div className="text-[11px] text-on-surface-variant font-medium">Quick Demo Accounts:</div>
            <div className="flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setEmail("farmer.lasalgaon@prisms.gov.in");
                  setPassword("Kisan@2024");
                  setName("Mayur Kapse (नवी मुंबई)");
                  setRole("farmer");
                  setAuthMethod("password");
                  setError("");
                }}
                className="text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-full hover:bg-emerald-100 font-bold transition-all"
              >
                🚜 Demo Farmer
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setEmail("buyer.nashik@prisms.gov.in");
                  setPassword("Kisan@2024");
                  setName("Nashik Agro Processors Ltd.");
                  setRole("buyer");
                  setAuthMethod("password");
                  setError("");
                }}
                className="text-[11px] bg-blue-50 text-blue-800 border border-blue-200 px-2.5 py-1 rounded-full hover:bg-blue-100 font-bold transition-all"
              >
                🏢 Demo Buyer
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

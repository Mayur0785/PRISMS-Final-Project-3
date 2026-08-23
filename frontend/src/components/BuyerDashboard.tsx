import React, { useState, useEffect } from "react";
import {
  type AuthUser,
  type BuyerDemand,
  type TradeLot,
  type Offer,
  type DeliveryOrder,
  type PaymentLedger,
  fetchBuyerDemands,
  fetchUserDeliveries,
  fetchUserPayments,
  apiClient,
  API_URL,
} from "@/lib/prisms";
import {
  Building2,
  Package,
  Layers,
  Truck,
  CreditCard,
  Bell,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  ShieldCheck,
  RefreshCw,
  LogOut,
  SlidersHorizontal,
  DollarSign,
  MapPin,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Tag,
  Store,
  FileText,
} from "lucide-react";
import { BorderBeam } from "./BorderBeam";
import { SpotlightCard } from "./SpotlightCard";

interface BuyerDashboardProps {
  currentUser: AuthUser;
  onLogout: () => void;
  onSwitchToLanding: () => void;
  lang?: "en" | "mr";
}

export const BuyerDashboard: React.FC<BuyerDashboardProps> = ({
  currentUser,
  onLogout,
  onSwitchToLanding,
  lang = "en",
}) => {
  const [activeTab, setActiveTab] = useState<
    "overview" | "lots" | "demands" | "offers" | "purchases" | "payments" | "notifications"
  >("overview");

  // Buyer Demands State
  const [demands, setDemands] = useState<BuyerDemand[]>([]);
  const [loadingDemands, setLoadingDemands] = useState(false);
  const [newDemandModalOpen, setNewDemandModalOpen] = useState(false);
  const [newCrop, setNewCrop] = useState("Red Onion");
  const [newQty, setNewQty] = useState("100");
  const [newTargetMin, setNewTargetMin] = useState("2900");
  const [newTargetMax, setNewTargetMax] = useState("3400");
  const [newDistrict, setNewDistrict] = useState("Nashik");
  const [newQualityGrade, setNewQualityGrade] = useState("Grade A");
  const [newDeliveryPref, setNewDeliveryPref] = useState("Buyer Pickup");

  // Farmer Trade Lots Discovery State
  const [availableLots, setAvailableLots] = useState<TradeLot[]>([]);
  const [loadingLots, setLoadingLots] = useState(false);
  const [lotSearchQuery, setLotSearchQuery] = useState("");
  const [lotFilterCrop, setLotFilterCrop] = useState("ALL");
  const [selectedLotForBid, setSelectedLotForBid] = useState<TradeLot | null>(null);
  const [bidPrice, setBidPrice] = useState("");
  const [bidTerms, setBidTerms] = useState("Payment within 24h via Bank Escrow");
  const [bidDeliveryType, setBidDeliveryType] = useState("Buyer Pickup (Self Logistics)");
  const [bidSubmitting, setBidSubmitting] = useState(false);
  const [bidSuccessToast, setBidSuccessToast] = useState<string | null>(null);

  // Buyer Deliveries & Purchases State
  const [deliveries, setDeliveries] = useState<DeliveryOrder[]>([]);
  const [loadingDeliveries, setLoadingDeliveries] = useState(false);

  // Buyer Payments State
  const [payments, setPayments] = useState<PaymentLedger[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);

  // Submitted Buyer Bids / Offers State (Simulated & API)
  const [buyerBids, setBuyerBids] = useState<Array<{
    id: string;
    lotId: string;
    cropName: string;
    farmerName: string;
    farmerDistrict: string;
    offeredPrice: number;
    expectedPrice: number;
    quantityQtl: number;
    status: "PENDING" | "COUNTERED" | "ACCEPTED" | "REJECTED";
    counterPrice?: number;
    counterNote?: string;
    date: string;
  }>>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("prisms_buyer_submitted_bids");
      if (saved) {
        try { return JSON.parse(saved); } catch {}
      }
    }
    return [
      {
        id: "BID-2026-081",
        lotId: "LOT-2026-0073",
        cropName: "Red Onion (Nashik)",
        farmerName: "Mayur Kapse",
        farmerDistrict: "Raigad / Nashik",
        offeredPrice: 3250,
        expectedPrice: 3200,
        quantityQtl: 30,
        status: "ACCEPTED",
        date: "Today, 10:45 AM",
      },
      {
        id: "BID-2026-082",
        lotId: "LOT-2026-0042",
        cropName: "Sharbati Wheat",
        farmerName: "Sahyadri FPO Member",
        farmerDistrict: "Nashik",
        offeredPrice: 2850,
        expectedPrice: 3000,
        quantityQtl: 50,
        status: "COUNTERED",
        counterPrice: 2950,
        counterNote: "Farmer requested ₹2,950/Qtl due to premium Grade A sorting.",
        date: "Yesterday, 04:20 PM",
      },
      {
        id: "BID-2026-083",
        lotId: "LOT-2026-0019",
        cropName: "Solapur Banana (G9)",
        farmerName: "Kisan Producer Co.",
        farmerDistrict: "Solapur",
        offeredPrice: 2100,
        expectedPrice: 2200,
        quantityQtl: 40,
        status: "PENDING",
        date: "2 days ago",
      }
    ];
  });

  // Buyer Notifications
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    title: string;
    desc: string;
    time: string;
    type: "counter" | "lot" | "delivery" | "payment";
    unread: boolean;
  }>>([
    {
      id: "n1",
      title: "Farmer Counter Offer Received",
      desc: "Farmer for LOT-2026-0042 (Sharbati Wheat) submitted a counter price of ₹2,950/Qtl.",
      time: "15 mins ago",
      type: "counter",
      unread: true,
    },
    {
      id: "n2",
      title: "New Red Onion Lot Listed Nearby",
      desc: "35 Qtl Grade A Red Onion listed in Niphad, Nashik matching your target demand.",
      time: "2 hours ago",
      type: "lot",
      unread: true,
    },
    {
      id: "n3",
      title: "Delivery Dispatched",
      desc: "Lot LOT-2026-0073 has been marked DISPATCHED. Bolero Pickup en route.",
      time: "5 hours ago",
      type: "delivery",
      unread: false,
    },
    {
      id: "n4",
      title: "Escrow Payment Confirmed",
      desc: "Simulated Escrow of ₹97,500 locked for Deal DLV-2026-0091.",
      time: "Yesterday",
      type: "payment",
      unread: false,
    }
  ]);

  // Load all buyer data on mount
  useEffect(() => {
    loadBuyerDemandsData();
    loadAvailableFarmerLots();
    loadPurchasesData();
    loadPaymentsData();
  }, []);

  const loadBuyerDemandsData = async () => {
    setLoadingDemands(true);
    try {
      const data = await fetchBuyerDemands();
      setDemands(data || []);
    } catch (e) {
      console.warn("Failed fetching buyer demands", e);
    } finally {
      setLoadingDemands(false);
    }
  };

  const loadAvailableFarmerLots = async () => {
    setLoadingLots(true);
    try {
      const res = await apiClient.get(`${API_URL}/lots`);
      const lots: TradeLot[] = res.data?.data || [];
      setAvailableLots(lots);
    } catch (e) {
      // Fallback to demo published lots for buyer discovery
      const demoLots: TradeLot[] = [
        {
          _id: "lot_demo_pune_1",
          lotId: "LOT-2026-0073",
          userId: "user_demo_001",
          cropName: "Red Onion (Nashik)",
          variety: "Garwa / Late Kharif",
          grade: "Grade A (45-55mm)",
          quantityQtl: 30,
          expectedPricePerQtl: 3200,
          minimumAcceptablePrice: 3000,
          qualityScore: 92,
          origin: "Farm Gate (Pimpalgaon)",
          district: "Nashik",
          lotStatus: "PUBLISHED",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          _id: "lot_demo_pune_2",
          lotId: "LOT-2026-0042",
          userId: "user_demo_002",
          cropName: "Sharbati Wheat",
          variety: "HD-2967",
          grade: "Grade A",
          quantityQtl: 50,
          expectedPricePerQtl: 3000,
          minimumAcceptablePrice: 2850,
          qualityScore: 94,
          origin: "Lasalgaon Mandi Yard",
          district: "Nashik",
          lotStatus: "PUBLISHED",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          _id: "lot_demo_pune_3",
          lotId: "LOT-2026-0089",
          userId: "user_demo_003",
          cropName: "Tomato (Junnah)",
          variety: "Abhinav / Hybrid",
          grade: "Grade A",
          quantityQtl: 25,
          expectedPricePerQtl: 2400,
          minimumAcceptablePrice: 2200,
          qualityScore: 88,
          origin: "Narayangaon Hub",
          district: "Pune",
          lotStatus: "PUBLISHED",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          _id: "lot_demo_pune_4",
          lotId: "LOT-2026-0112",
          userId: "user_demo_004",
          cropName: "Yellow Soybeans",
          variety: "JS-335",
          grade: "Grade 1 (Cleaned)",
          quantityQtl: 60,
          expectedPricePerQtl: 4800,
          minimumAcceptablePrice: 4600,
          qualityScore: 95,
          origin: "Latur Mandi Gate",
          district: "Latur",
          lotStatus: "PUBLISHED",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      ];
      setAvailableLots(demoLots);
    } finally {
      setLoadingLots(false);
    }
  };

  const loadPurchasesData = async () => {
    setLoadingDeliveries(true);
    try {
      const data = await fetchUserDeliveries();
      setDeliveries(data || []);
    } catch (e) {
      console.warn("Error fetching deliveries", e);
    } finally {
      setLoadingDeliveries(false);
    }
  };

  const loadPaymentsData = async () => {
    setLoadingPayments(true);
    try {
      const data = await fetchUserPayments();
      setPayments(data || []);
    } catch (e) {
      console.warn("Error fetching payments", e);
    } finally {
      setLoadingPayments(false);
    }
  };

  // Submit Bid on a Farmer Lot
  const handleSubmitBid = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLotForBid || !bidPrice) return;

    setBidSubmitting(true);
    setTimeout(() => {
      const newBid = {
        id: `BID-2026-0${Math.floor(Math.random() * 900 + 100)}`,
        lotId: selectedLotForBid.lotId || "LOT-2026-XXXX",
        cropName: selectedLotForBid.cropName || "Produce",
        farmerName: selectedLotForBid.district ? `Farmer (${selectedLotForBid.district})` : "Verified Farmer",
        farmerDistrict: selectedLotForBid.district || "Maharashtra",
        offeredPrice: parseFloat(bidPrice),
        expectedPrice: selectedLotForBid.expectedPricePerQtl || 3000,
        quantityQtl: selectedLotForBid.quantityQtl || 25,
        status: "PENDING" as const,
        date: "Just now",
      };

      const updated = [newBid, ...buyerBids];
      setBuyerBids(updated);
      localStorage.setItem("prisms_buyer_submitted_bids", JSON.stringify(updated));

      setBidSuccessToast(`Bid submitted successfully for ${selectedLotForBid.lotId} at ₹${bidPrice}/Qtl!`);
      setBidSubmitting(false);
      setSelectedLotForBid(null);
      setBidPrice("");
      setTimeout(() => setBidSuccessToast(null), 4000);
    }, 600);
  };

  // Accept or Counter Farmer Counter-Offer
  const handleAcceptCounterOffer = (bidId: string) => {
    const updated = buyerBids.map((b) => {
      if (b.id === bidId) {
        return {
          ...b,
          status: "ACCEPTED" as const,
          offeredPrice: b.counterPrice || b.offeredPrice,
        };
      }
      return b;
    });
    setBuyerBids(updated);
    localStorage.setItem("prisms_buyer_submitted_bids", JSON.stringify(updated));
    setBidSuccessToast("Counter offer accepted! Deal confirmed with farmer.");
    setTimeout(() => setBidSuccessToast(null), 4000);
  };

  // Add New Buyer Demand
  const handleCreateDemand = (e: React.FormEvent) => {
    e.preventDefault();
    const newDem: BuyerDemand = {
      demandId: `DEM-2026-${Math.floor(Math.random() * 900 + 100)}`,
      buyerId: currentUser.id || "buyer_01",
      commodity: newCrop,
      variety: "Standard / Hybrid",
      targetGrade: newQualityGrade,
      quantityRequiredQtl: parseFloat(newQty) || 50,
      targetPriceMin: parseFloat(newTargetMin) || 2800,
      targetPriceMax: parseFloat(newTargetMax) || 3200,
      preferredDistricts: [newDistrict],
      deliveryPreference: newDeliveryPref,
      urgency: "HIGH",
      status: "OPEN",
    };
    setDemands([newDem, ...demands]);
    setNewDemandModalOpen(false);
    setBidSuccessToast(`New demand for ${newCrop} created successfully!`);
    setTimeout(() => setBidSuccessToast(null), 4000);
  };

  const filteredLots = availableLots.filter((l) => {
    if (lotFilterCrop !== "ALL") {
      if (!l.cropName.toLowerCase().includes(lotFilterCrop.toLowerCase())) return false;
    }
    if (lotSearchQuery.trim()) {
      const q = lotSearchQuery.toLowerCase();
      const matchName = l.cropName.toLowerCase().includes(q);
      const matchId = l.lotId.toLowerCase().includes(q);
      const matchDist = (l.district || "").toLowerCase().includes(q);
      if (!matchName && !matchId && !matchDist) return false;
    }
    return true;
  });

  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <div className="min-h-screen bg-[#f8faf7] text-slate-900 flex flex-col font-sans">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-xl shadow-md">
              🏢
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg text-slate-900 tracking-tight">PRISMS</span>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                  Buyer Command Center
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                {currentUser.businessName || currentUser.name || "Commercial Buyer"} • {currentUser.email}
              </p>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setActiveTab("notifications")}
              className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all border border-slate-200"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            <button
              onClick={onSwitchToLanding}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all border border-slate-200"
            >
              <Store className="w-3.5 h-3.5" />
              {lang === "mr" ? "मुख्य पोर्टल" : "Public Portal"}
            </button>

            <button
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 transition-all border border-red-200"
            >
              <LogOut className="w-3.5 h-3.5" />
              {lang === "mr" ? "लॉग आउट" : "Sign Out"}
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex overflow-x-auto no-scrollbar gap-1 border-t border-slate-100">
          {[
            { id: "overview", label: lang === "mr" ? "आढावा (Overview)" : "Command Overview", icon: Layers },
            { id: "lots", label: lang === "mr" ? "शेतकरी लॉट्स शोधा" : "Farmer Produce Lots", icon: Search },
            { id: "demands", label: lang === "mr" ? "मागणी व्यवस्थापन" : "Purchase Demands", icon: Tag },
            { id: "offers", label: lang === "mr" ? "ऑफर व वाटाघाटी" : "Digital Bids & Offers", icon: DollarSign },
            { id: "purchases", label: lang === "mr" ? "वाहतूक ट्रॅकिंग" : "Logistics & Delivery", icon: Truck },
            { id: "payments", label: lang === "mr" ? "पेमेंट व एस्क्रो" : "Escrow & Settlement", icon: CreditCard },
            { id: "notifications", label: lang === "mr" ? "सूचना" : `Alerts (${unreadCount})`, icon: Bell },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-3.5 text-xs font-bold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-all ${
                  isActive
                    ? "border-blue-600 text-blue-600 bg-blue-50/50"
                    : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-6">
        {/* Toast Notification */}
        {bidSuccessToast && (
          <div className="p-4 bg-emerald-600 text-white rounded-xl shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-top duration-300">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-bold">{bidSuccessToast}</span>
          </div>
        )}

        {/* TAB 1: COMMAND OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-2">
                  <span>ACTIVE DEMANDS</span>
                  <Tag className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-2xl font-black text-slate-900">{demands.length} Commodities</div>
                <p className="text-[11px] text-slate-500 font-medium mt-1">Total volume: 240 Qtl posted</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-2">
                  <span>SUBMITTED BIDS</span>
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-2xl font-black text-slate-900">{buyerBids.length} Active Offers</div>
                <p className="text-[11px] text-emerald-600 font-medium mt-1">1 Accepted deal confirmed</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-2">
                  <span>PENDING COUNTER OFFERS</span>
                  <Clock className="w-4 h-4 text-amber-600" />
                </div>
                <div className="text-2xl font-black text-amber-600">
                  {buyerBids.filter((b) => b.status === "COUNTERED").length} Action Needed
                </div>
                <p className="text-[11px] text-slate-500 font-medium mt-1">Review farmer counter prices</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-2">
                  <span>ESCROW PROCUREMENT</span>
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-2xl font-black text-slate-900">₹97,500</div>
                <p className="text-[11px] text-blue-600 font-medium mt-1">Protected in digital settlement</p>
              </div>
            </div>

            {/* Quick Actions & Live Market Discovery Banner */}
            <div className="bg-gradient-to-r from-slate-900 to-blue-950 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
              <BorderBeam size={300} duration={8} colorFrom="#3b82f6" colorTo="#10b981" />
              <div className="relative z-10 space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[11px] font-bold border border-blue-400/30">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  Verified Farmer Supply Stream
                </div>
                <h2 className="text-2xl font-extrabold tracking-tight">Direct Agri-Procurement without Middlemen</h2>
                <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                  Browse standardized trade lots (`LOT-2026-XXXX`) directly from verified farmers in Maharashtra. Submit binding digital offers with transparent escrow.
                </p>
              </div>
              <div className="relative z-10 flex flex-wrap gap-2.5">
                <button
                  onClick={() => setNewDemandModalOpen(true)}
                  className="px-4 py-2.5 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700 transition-all flex items-center gap-1.5 shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  Post Purchase Demand
                </button>
                <button
                  onClick={() => setActiveTab("lots")}
                  className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl transition-all border border-white/20 flex items-center gap-1.5"
                >
                  <Search className="w-4 h-4" />
                  Browse Farmer Lots
                </button>
              </div>
            </div>

            {/* Recent Bids & Counter Offers */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left: Active Negotiations */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-blue-600" />
                    Active Offers & Negotiations
                  </h3>
                  <button
                    onClick={() => setActiveTab("offers")}
                    className="text-xs font-bold text-blue-600 hover:underline"
                  >
                    View All
                  </button>
                </div>

                <div className="space-y-3">
                  {buyerBids.map((b) => (
                    <div
                      key={b.id}
                      className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-slate-900 text-sm">{b.cropName}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            b.status === "ACCEPTED"
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              : b.status === "COUNTERED"
                              ? "bg-amber-100 text-amber-800 border border-amber-200 animate-pulse"
                              : "bg-slate-200 text-slate-700"
                          }`}
                        >
                          {b.status === "COUNTERED" ? "Counter-Offer from Farmer" : b.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-slate-600 font-medium">
                        <div>
                          Lot: <span className="font-mono font-bold text-slate-900">{b.lotId}</span>
                        </div>
                        <div>
                          Qty: <span className="font-bold text-slate-900">{b.quantityQtl} Qtl</span>
                        </div>
                        <div>
                          Your Bid: <span className="font-bold text-slate-900">₹{b.offeredPrice}/Qtl</span>
                        </div>
                      </div>

                      {b.status === "COUNTERED" && b.counterPrice && (
                        <div className="p-2 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 space-y-1.5">
                          <div className="font-bold flex items-center justify-between">
                            <span>Farmer Counter Price: ₹{b.counterPrice}/Qtl</span>
                            <button
                              onClick={() => handleAcceptCounterOffer(b.id)}
                              className="px-2.5 py-1 bg-amber-600 text-white rounded font-bold hover:bg-amber-700 transition-all text-[11px]"
                            >
                              Accept Counter ₹{b.counterPrice}
                            </button>
                          </div>
                          {b.counterNote && <p className="text-[11px] text-amber-800">{b.counterNote}</p>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: Active Demands */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                    <Tag className="w-4 h-4 text-emerald-600" />
                    Your Posted Buyer Demands
                  </h3>
                  <button
                    onClick={() => setNewDemandModalOpen(true)}
                    className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Post New
                  </button>
                </div>

                <div className="space-y-3">
                  {demands.slice(0, 4).map((d) => (
                    <div
                      key={d.demandId}
                      className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-slate-900 text-sm">{d.commodity}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
                          {d.targetGrade || "Grade A"}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-slate-600 font-medium">
                        <div>
                          Requirement: <span className="font-bold text-slate-900">{d.quantityRequiredQtl} Qtl</span>
                        </div>
                        <div>
                          Target: <span className="font-bold text-emerald-700">₹{d.targetPriceMin} - ₹{d.targetPriceMax}/Qtl</span>
                        </div>
                        <div>
                          Terms: <span className="font-bold text-slate-900">{d.deliveryPreference || "Buyer Pickup"}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: FARMER TRADE LOTS DISCOVERY */}
        {activeTab === "lots" && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="font-extrabold text-lg text-slate-900">Farmer Produce Lots Directory</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Verified agricultural lots listed directly by farmers across Maharashtra.
                  </p>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={lotSearchQuery}
                      onChange={(e) => setLotSearchQuery(e.target.value)}
                      placeholder="Search crop, lot ID, district..."
                      className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none w-52 sm:w-64"
                    />
                  </div>

                  <select
                    value={lotFilterCrop}
                    onChange={(e) => setLotFilterCrop(e.target.value)}
                    className="py-1.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:ring-2 focus:ring-blue-600 outline-none"
                  >
                    <option value="ALL">All Commodities</option>
                    <option value="Onion">Red Onion</option>
                    <option value="Wheat">Wheat</option>
                    <option value="Banana">Banana</option>
                    <option value="Tomato">Tomato</option>
                    <option value="Soybeans">Soybeans</option>
                  </select>
                </div>
              </div>

              {/* Trade Lots Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                {filteredLots.map((lot) => (
                  <div
                    key={lot._id || lot.lotId}
                    className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                            {lot.lotId}
                          </span>
                          <h4 className="font-extrabold text-base text-slate-900 mt-1">{lot.cropName}</h4>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {lot.grade || "Grade A"}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-xl">
                        <div>
                          <div className="text-[10px] text-slate-500 font-bold uppercase">Volume</div>
                          <div className="font-black text-slate-900">{lot.quantityQtl} Qtl</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-500 font-bold uppercase">Expected Rate</div>
                          <div className="font-black text-emerald-700">₹{lot.expectedPricePerQtl}/Qtl</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-500 font-bold uppercase">Location</div>
                          <div className="font-bold text-slate-700 truncate">{lot.district || "Nashik"}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-500 font-bold uppercase">Quality Score</div>
                          <div className="font-bold text-blue-700">{lot.qualityScore || 90}/100</div>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedLotForBid(lot);
                        setBidPrice(String(lot.expectedPricePerQtl || 3200));
                      }}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
                    >
                      <DollarSign className="w-3.5 h-3.5" />
                      Submit Digital Bid
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: DEMAND MANAGEMENT */}
        {activeTab === "demands" && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-lg text-slate-900">Buyer Procurement Demands</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Publish your purchase requirements to attract direct farmer lot submissions.
                  </p>
                </div>
                <button
                  onClick={() => setNewDemandModalOpen(true)}
                  className="px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700 transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  Post New Demand
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {demands.map((d) => (
                  <div
                    key={d.demandId}
                    className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-900">{d.commodity}</span>
                        <span className="text-[10px] font-mono text-slate-500">({d.demandId})</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                        {d.status || "ACTIVE"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-white p-3 rounded-xl border border-slate-100">
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold block">REQUIRED VOLUME</span>
                        <span className="font-black text-slate-900">{d.quantityRequiredQtl} Qtl</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold block">TARGET PRICE</span>
                        <span className="font-black text-emerald-700">₹{d.targetPriceMin} - ₹{d.targetPriceMax}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold block">LOGISTICS</span>
                        <span className="font-bold text-slate-800">{d.deliveryPreference || "Buyer Pickup"}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: OFFERS & NEGOTIATIONS */}
        {activeTab === "offers" && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-extrabold text-lg text-slate-900">Submitted Buyer Bids & Negotiations</h3>
              <div className="space-y-3">
                {buyerBids.map((b) => (
                  <div
                    key={b.id}
                    className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 text-xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="font-mono text-[10px] font-bold text-slate-500">{b.id} • Lot: {b.lotId}</span>
                        <h4 className="font-extrabold text-base text-slate-900">{b.cropName}</h4>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider self-start sm:self-auto ${
                          b.status === "ACCEPTED"
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : b.status === "COUNTERED"
                            ? "bg-amber-100 text-amber-800 border border-amber-200 animate-pulse"
                            : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {b.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-white p-3 rounded-xl border border-slate-100">
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold block">FARMER</span>
                        <span className="font-bold text-slate-900">{b.farmerName}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold block">QUANTITY</span>
                        <span className="font-black text-slate-900">{b.quantityQtl} Qtl</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold block">YOUR OFFER</span>
                        <span className="font-black text-blue-700">₹{b.offeredPrice}/Qtl</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold block">EXPECTED PRICE</span>
                        <span className="font-bold text-slate-700">₹{b.expectedPrice}/Qtl</span>
                      </div>
                    </div>

                    {b.status === "COUNTERED" && b.counterPrice && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2 text-amber-900">
                        <div className="flex items-center justify-between font-extrabold text-sm">
                          <span>Farmer Counter: ₹{b.counterPrice}/Qtl</span>
                          <button
                            onClick={() => handleAcceptCounterOffer(b.id)}
                            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shadow-sm"
                          >
                            Accept Counter Price
                          </button>
                        </div>
                        {b.counterNote && <p className="text-xs text-amber-800">{b.counterNote}</p>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: LOGISTICS & PURCHASES */}
        {activeTab === "purchases" && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-extrabold text-lg text-slate-900">Purchases & Dispatch Logistics</h3>
              <p className="text-xs text-slate-500 font-medium">
                Live delivery orders and milestone tracking from farm gate to buyer warehouse.
              </p>

              <div className="space-y-3">
                {deliveries.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-500 font-medium text-xs">
                    No active delivery orders currently in transit.
                  </div>
                ) : (
                  deliveries.map((d) => (
                    <div
                      key={d.deliveryId || d._id}
                      className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-slate-700">{d.deliveryId}</span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                          {d.deliveryStatus}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-white p-3 rounded-xl">
                        <div>
                          <span className="text-[10px] text-slate-500 font-bold block">CROP</span>
                          <span className="font-bold text-slate-900">{d.crop || "Produce"}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 font-bold block">QUANTITY</span>
                          <span className="font-black text-slate-900">{d.quantityQtl || 30} Qtl</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 font-bold block">VEHICLE</span>
                          <span className="font-bold text-slate-700">{d.vehicleType || "Bolero Pickup"}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 font-bold block">EST. FREIGHT</span>
                          <span className="font-bold text-slate-900">₹{d.estimatedFreight || 1417}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: ESCROW & PAYMENTS */}
        {activeTab === "payments" && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-extrabold text-lg text-slate-900">Buyer Escrow & Settlement Ledger</h3>
              <p className="text-xs text-slate-500 font-medium">
                Simulated escrow funds locked until final delivery confirmation.
              </p>

              <div className="space-y-3">
                {payments.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-500 font-medium text-xs">
                    No active escrow payment records found.
                  </div>
                ) : (
                  payments.map((p) => (
                    <div
                      key={p.paymentId || p._id}
                      className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-slate-700">{p.paymentId}</span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-100 text-blue-800">
                          {p.paymentStatus}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-white p-3 rounded-xl">
                        <div>
                          <span className="text-[10px] text-slate-500 font-bold block">GROSS AMOUNT</span>
                          <span className="font-black text-slate-900">₹{p.grossAmount}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 font-bold block">NET PAYABLE</span>
                          <span className="font-black text-emerald-700">₹{p.netPayable}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 font-bold block">PAYMENT MODE</span>
                          <span className="font-bold text-slate-700">{p.paymentMode || "DEMO_BANK_ESCROW"}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: NOTIFICATIONS */}
        {activeTab === "notifications" && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-extrabold text-lg text-slate-900">Buyer Activity Notifications</h3>
              <div className="space-y-2.5">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-3.5 rounded-xl border transition-all text-xs flex items-start gap-3 ${
                      n.unread
                        ? "bg-blue-50/60 border-blue-200 text-slate-900"
                        : "bg-slate-50 border-slate-200 text-slate-700"
                    }`}
                  >
                    <div className="p-2 rounded-lg bg-blue-100 text-blue-700 flex-shrink-0 mt-0.5">
                      {n.type === "counter" ? (
                        <DollarSign className="w-4 h-4" />
                      ) : n.type === "lot" ? (
                        <Package className="w-4 h-4" />
                      ) : n.type === "delivery" ? (
                        <Truck className="w-4 h-4" />
                      ) : (
                        <CreditCard className="w-4 h-4" />
                      )}
                    </div>
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-sm text-slate-900">{n.title}</span>
                        <span className="text-[10px] text-slate-400 font-medium">{n.time}</span>
                      </div>
                      <p className="text-slate-600 leading-relaxed font-medium">{n.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODAL 1: SUBMIT BID ON A LOT */}
      {selectedLotForBid && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="font-mono text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                  {selectedLotForBid.lotId}
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-1">Submit Purchase Bid</h3>
              </div>
              <button
                onClick={() => setSelectedLotForBid(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 text-slate-500 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitBid} className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl space-y-1 font-medium text-slate-600">
                <div>
                  Produce: <span className="font-extrabold text-slate-900">{selectedLotForBid.cropName}</span>
                </div>
                <div>
                  Volume: <span className="font-bold text-slate-900">{selectedLotForBid.quantityQtl} Qtl</span> • Grade: <span className="font-bold text-slate-900">{selectedLotForBid.grade}</span>
                </div>
                <div>
                  Farmer Asking Rate: <span className="font-bold text-emerald-700">₹{selectedLotForBid.expectedPricePerQtl}/Qtl</span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Your Offered Price (₹ / Qtl)</label>
                <input
                  type="number"
                  required
                  value={bidPrice}
                  onChange={(e) => setBidPrice(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Delivery Preference</label>
                <select
                  value={bidDeliveryType}
                  onChange={(e) => setBidDeliveryType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 focus:ring-2 focus:ring-blue-600 outline-none"
                >
                  <option value="Buyer Pickup (Self Logistics)">Buyer Pickup (Self Logistics - 0 Freight for Farmer)</option>
                  <option value="Farmer Delivery to Hub">Farmer Delivery to Buyer Hub</option>
                  <option value="Shared Logistics Hub">Shared Logistics APMC Yard</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Payment Settlement Terms</label>
                <input
                  type="text"
                  value={bidTerms}
                  onChange={(e) => setBidTerms(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-900 focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedLotForBid(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bidSubmitting}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-1.5"
                >
                  {bidSubmitting ? "Submitting..." : "Send Digital Offer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: POST NEW BUYER DEMAND */}
      {newDemandModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-black text-slate-900">Post Purchase Demand</h3>
              <button
                onClick={() => setNewDemandModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 text-slate-500 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateDemand} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Commodity / Crop</label>
                <select
                  value={newCrop}
                  onChange={(e) => setNewCrop(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 focus:ring-2 focus:ring-blue-600 outline-none"
                >
                  <option value="Red Onion">Red Onion</option>
                  <option value="Wheat">Sharbati Wheat</option>
                  <option value="Banana">Banana</option>
                  <option value="Tomato">Tomato</option>
                  <option value="Soybeans">Soybeans</option>
                  <option value="Potato">Potato</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Volume (Qtl)</label>
                  <input
                    type="number"
                    required
                    value={newQty}
                    onChange={(e) => setNewQty(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 focus:ring-2 focus:ring-blue-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Grade</label>
                  <select
                    value={newQualityGrade}
                    onChange={(e) => setNewQualityGrade(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 focus:ring-2 focus:ring-blue-600 outline-none"
                  >
                    <option value="Grade A">Grade A (Premium)</option>
                    <option value="Grade B">Grade B (Standard)</option>
                    <option value="Processing Grade">Processing Grade</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Min Price (₹/Qtl)</label>
                  <input
                    type="number"
                    required
                    value={newTargetMin}
                    onChange={(e) => setNewTargetMin(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 focus:ring-2 focus:ring-blue-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Max Price (₹/Qtl)</label>
                  <input
                    type="number"
                    required
                    value={newTargetMax}
                    onChange={(e) => setNewTargetMax(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 focus:ring-2 focus:ring-blue-600 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Preferred District</label>
                <input
                  type="text"
                  value={newDistrict}
                  onChange={(e) => setNewDistrict(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Delivery Preference</label>
                <select
                  value={newDeliveryPref}
                  onChange={(e) => setNewDeliveryPref(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 focus:ring-2 focus:ring-blue-600 outline-none"
                >
                  <option value="Buyer Pickup">Buyer Pickup</option>
                  <option value="Farmer Delivery">Farmer Delivery to Facility</option>
                </select>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setNewDemandModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md"
                >
                  Publish Demand
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

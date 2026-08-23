import React, { useState, useEffect, useRef } from "react";
import {
  type AuthUser,
  type BuyerDemand,
  type TradeLot,
  type Offer,
  type DeliveryOrder,
  type PaymentLedger,
  type NotificationItem,
  fetchBuyerDemands,
  createBuyerDemandApi,
  fetchMarketplaceLotsApi,
  fetchUserDeliveries,
  fetchUserPayments,
  fetchUserOffers,
  fetchNotifications,
  markNotificationReadApi,
  createOfferApi,
  acceptOfferApi,
  rejectOfferApi,
  counterOfferApi,
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
  X,
  MessageSquare,
} from "lucide-react";
import { BorderBeam } from "./BorderBeam";
import { SpotlightCard } from "./SpotlightCard";
import { QualityPassportModal } from "./QualityPassportModal";

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
  const [selectedLotForPassport, setSelectedLotForPassport] = useState<TradeLot | null>(null);
  const [bidPrice, setBidPrice] = useState("");
  const [bidTerms, setBidTerms] = useState("Payment within 24h via Bank Escrow");
  const [bidDeliveryType, setBidDeliveryType] = useState("Buyer Pickup (Self Logistics)");
  const [bidSubmitting, setBidSubmitting] = useState(false);
  const [bidSuccessToast, setBidSuccessToast] = useState<string | null>(null);

  // Buyer Offers State (Live from Backend)
  const [backendOffers, setBackendOffers] = useState<Offer[]>([]);
  const [loadingOffers, setLoadingOffers] = useState(false);
  const [counterModalOffer, setCounterModalOffer] = useState<Offer | null>(null);
  const [buyerCounterPrice, setBuyerCounterPrice] = useState("");
  const [buyerCounterMsg, setBuyerCounterMsg] = useState("");
  const [actionInProgressId, setActionInProgressId] = useState<string | null>(null);

  // Buyer Deliveries & Purchases State
  const [deliveries, setDeliveries] = useState<DeliveryOrder[]>([]);
  const [loadingDeliveries, setLoadingDeliveries] = useState(false);

  // Buyer Payments State
  const [payments, setPayments] = useState<PaymentLedger[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);

  // Buyer Notifications (Live from Backend)
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadNotifsCount, setUnreadNotifsCount] = useState(0);

  // Load all buyer data on mount & start auto-poll interval
  useEffect(() => {
    loadAllData();

    // 5-second automatic sync interval for real-time trade coordination
    const interval = setInterval(() => {
      syncBackgroundData();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const loadAllData = async () => {
    await Promise.allSettled([
      loadBuyerDemandsData(),
      loadAvailableFarmerLots(),
      loadOffersData(),
      loadPurchasesData(),
      loadPaymentsData(),
      loadNotificationsData(),
    ]);
  };

  const syncBackgroundData = async () => {
    try {
      const [offers, notifs, dels, pmts] = await Promise.all([
        fetchUserOffers(),
        fetchNotifications(),
        fetchUserDeliveries(),
        fetchUserPayments(),
      ]);
      setBackendOffers(offers || []);
      setNotifications(notifs?.data || []);
      setUnreadNotifsCount(notifs?.unreadCount || 0);
      setDeliveries(dels || []);
      setPayments(pmts || []);
    } catch {
      // silent background sync catch
    }
  };

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
      const lots = await fetchMarketplaceLotsApi();
      setAvailableLots(lots || []);
    } catch (e) {
      console.warn("Failed loading marketplace lots from API", e);
    } finally {
      setLoadingLots(false);
    }
  };

  const loadOffersData = async () => {
    setLoadingOffers(true);
    try {
      const offers = await fetchUserOffers();
      setBackendOffers(offers || []);
    } catch (e) {
      console.warn("Failed loading buyer offers", e);
    } finally {
      setLoadingOffers(false);
    }
  };

  const loadNotificationsData = async () => {
    try {
      const notifs = await fetchNotifications();
      setNotifications(notifs?.data || []);
      setUnreadNotifsCount(notifs?.unreadCount || 0);
    } catch (e) {
      console.warn("Failed loading notifications", e);
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

  // Submit Bid on a Farmer Lot using Real Backend API
  const handleSubmitBid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLotForBid || !bidPrice) return;

    setBidSubmitting(true);
    try {
      const lotId = selectedLotForBid._id || selectedLotForBid.lotId;
      const created = await createOfferApi({
        lotId,
        pricePerQtl: parseFloat(bidPrice),
        quantityQtl: selectedLotForBid.quantityQtl || 25,
        paymentTerms: bidTerms,
        deliveryTerms: bidDeliveryType,
        message: `Direct binding purchase bid from ${currentUser.businessName || currentUser.name || "Buyer"}`,
      });

      setBidSuccessToast(`Bid of ₹${bidPrice}/Qtl submitted successfully for ${selectedLotForBid.lotId}!`);
      setSelectedLotForBid(null);
      setBidPrice("");
      await loadOffersData();
      await loadNotificationsData();
    } catch (err: any) {
      alert(err?.response?.data?.error?.message || "Failed to submit bid to farmer.");
    } finally {
      setBidSubmitting(false);
      setTimeout(() => setBidSuccessToast(null), 4000);
    }
  };

  // Accept Counter-Offer from Farmer
  const handleAcceptCounterOffer = async (offerId: string) => {
    setActionInProgressId(offerId);
    try {
      await acceptOfferApi(offerId);
      setBidSuccessToast("Counter offer accepted! Purchase deal confirmed and escrow initiated.");
      await loadOffersData();
      await loadPurchasesData();
      await loadPaymentsData();
      await loadNotificationsData();
    } catch (err: any) {
      alert(err?.response?.data?.error?.message || "Failed to accept counter offer.");
    } finally {
      setActionInProgressId(null);
      setTimeout(() => setBidSuccessToast(null), 4000);
    }
  };

  // Reject Offer
  const handleRejectOffer = async (offerId: string) => {
    setActionInProgressId(offerId);
    try {
      await rejectOfferApi(offerId);
      setBidSuccessToast("Offer declined.");
      await loadOffersData();
      await loadNotificationsData();
    } catch (err: any) {
      alert(err?.response?.data?.error?.message || "Failed to reject offer.");
    } finally {
      setActionInProgressId(null);
      setTimeout(() => setBidSuccessToast(null), 3000);
    }
  };

  // Submit Buyer Counter
  const handleBuyerCounterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!counterModalOffer || !buyerCounterPrice) return;

    setActionInProgressId(counterModalOffer._id);
    try {
      await counterOfferApi(
        counterModalOffer._id || counterModalOffer.offerId,
        parseFloat(buyerCounterPrice),
        buyerCounterMsg || "Buyer updated counter price"
      );
      setBidSuccessToast(`Counter offer of ₹${buyerCounterPrice}/Qtl sent to farmer!`);
      setCounterModalOffer(null);
      setBuyerCounterPrice("");
      setBuyerCounterMsg("");
      await loadOffersData();
      await loadNotificationsData();
    } catch (err: any) {
      alert(err?.response?.data?.error?.message || "Failed to submit counter offer.");
    } finally {
      setActionInProgressId(null);
      setTimeout(() => setBidSuccessToast(null), 4000);
    }
  };

  // Add New Buyer Demand
  const handleCreateDemand = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createBuyerDemandApi({
        commodity: newCrop,
        variety: "Standard / Hybrid",
        targetGrade: newQualityGrade,
        quantityRequiredQtl: parseFloat(newQty) || 50,
        targetPriceMin: parseFloat(newTargetMin) || 2800,
        targetPriceMax: parseFloat(newTargetMax) || 3200,
        preferredDistricts: [newDistrict],
        deliveryPreference: newDeliveryPref,
      });
      setNewDemandModalOpen(false);
      setBidSuccessToast(`New demand for ${newCrop} created successfully on backend!`);
      await loadBuyerDemandsData();
    } catch (err: any) {
      alert(err?.response?.data?.error?.message || "Failed to create procurement demand.");
    } finally {
      setTimeout(() => setBidSuccessToast(null), 4000);
    }
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

  return (
    <div className="min-h-screen bg-[#fbfbfa] text-slate-900 flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 text-slate-900 shadow-sm flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab("overview")}>
            <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-black text-xl shadow-sm flex-shrink-0">
              🏢
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-xl tracking-tight text-emerald-950 font-serif">PRISMS</span>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300/60 tracking-wider">
                  Buyer Command Center
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium tracking-wide">
                {currentUser.businessName || currentUser.name || "Commercial Buyer"} • {currentUser.email}
              </p>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setActiveTab("notifications")}
              className="relative p-2.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all border border-slate-200 bg-white"
              title="Notifications"
            >
              <Bell className="w-4 h-4 text-slate-700" />
              {unreadNotifsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadNotifsCount}
                </span>
              )}
            </button>

            <button
              onClick={onSwitchToLanding}
              className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs"
              title="Public Landing Page"
            >
              <Store className="w-3.5 h-3.5 text-emerald-700" />
              <span className="hidden md:inline">Public Portal</span>
            </button>

            <button
              onClick={onLogout}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Toast Notification */}
      {bidSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold">{bidSuccessToast}</span>
        </div>
      )}

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-slate-200">
          {[
            { id: "overview", label: "Overview", icon: Layers },
            { id: "lots", label: "Farmer Produce Discovery", icon: Package, badge: availableLots.length },
            { id: "demands", label: "My Demands", icon: Tag, badge: demands.length },
            { id: "offers", label: "Bids & Counter Offers", icon: DollarSign, badge: backendOffers.length },
            { id: "purchases", label: "Purchases & Logistics", icon: Truck, badge: deliveries.length },
            { id: "payments", label: "Escrow & Settlements", icon: CreditCard, badge: payments.length },
            { id: "notifications", label: "Alerts & Feed", icon: Bell, badge: unreadNotifsCount },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? "bg-emerald-700 text-white shadow-sm"
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

        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Metric KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2 hover:border-emerald-200 transition-all">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-xs font-bold uppercase tracking-wider">Available Farmer Lots</span>
                  <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                    <Package className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900 font-serif">{availableLots.length} Lots</div>
                <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" /> Live verified lots in Maharashtra
                </p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2 hover:border-emerald-200 transition-all">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-xs font-bold uppercase tracking-wider">Active Demands</span>
                  <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                    <Tag className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900 font-serif">{demands.length} Demands</div>
                <p className="text-[11px] text-slate-500 font-medium">Procurement requirements posted</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2 hover:border-emerald-200 transition-all">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-xs font-bold uppercase tracking-wider">Active Bids & Offers</span>
                  <div className="p-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200/60">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900 font-serif">{backendOffers.length} Bids</div>
                <p className="text-[11px] text-amber-700 font-bold">
                  {backendOffers.filter((b) => b.offerStatus === "COUNTERED").length} Counter Offers Pending
                </p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2 hover:border-emerald-200 transition-all">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-xs font-bold uppercase tracking-wider">Escrow Procurement</span>
                  <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900 font-serif">
                  ₹{payments.reduce((acc, p) => acc + (p.netPayable || 0), 0).toLocaleString("en-IN")}
                </div>
                <p className="text-[11px] text-emerald-700 font-semibold">T+1 Direct Settlement Secured</p>
              </div>
            </div>

            {/* Quick Actions & Live Stream */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Featured Available Lots */}
              <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900">Top Available Trade Lots</h3>
                    <p className="text-xs text-slate-500 font-medium">Verified farm-gate and APMC yard supply</p>
                  </div>
                  <button
                    onClick={() => setActiveTab("lots")}
                    className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 cursor-pointer"
                  >
                    View All Lots ({availableLots.length}) <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {availableLots.slice(0, 4).map((lot) => (
                    <div
                      key={lot.lotId || lot._id}
                      className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-xl hover:border-emerald-300 transition-all space-y-2.5 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-slate-900 text-sm">{lot.cropName}</span>
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-black text-[10px] border border-emerald-200">
                          {lot.quantityQtl} Qtl
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600">
                        <span>Expected: <strong className="text-slate-900">₹{lot.expectedPricePerQtl}/Qtl</strong></span>
                        <span className="text-[11px] text-slate-500 font-medium">{lot.district || "Nashik"}</span>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedLotForBid(lot);
                          setBidPrice(String(lot.expectedPricePerQtl || 3000));
                        }}
                        className="w-full py-2 bg-emerald-700 text-white font-bold rounded-xl hover:bg-emerald-800 transition-all flex items-center justify-center gap-1 shadow-sm text-xs cursor-pointer"
                      >
                        Submit Direct Bid →
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Live Alerts Feed */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-base text-slate-900">Recent Notifications</h3>
                  <button
                    onClick={() => setActiveTab("notifications")}
                    className="text-xs font-bold text-emerald-800 hover:text-emerald-950 cursor-pointer"
                  >
                    View All
                  </button>
                </div>

                <div className="space-y-3">
                  {notifications.slice(0, 5).map((n) => {
                    const isUnread = n.isRead === false || n.read === false;
                    const isCounter = n.type === "COUNTER_OFFER";

                    return (
                      <div
                        key={n._id || n.notificationId}
                        onClick={async () => {
                          if (isUnread && n._id) {
                            await markNotificationReadApi(n._id);
                            loadNotificationsData();
                          }
                          if (isCounter) {
                            setActiveTab("offers");
                          }
                        }}
                        className={`p-3.5 rounded-xl border transition-all space-y-1.5 text-xs cursor-pointer ${
                          isCounter && isUnread
                            ? "bg-amber-50/90 border-amber-300 shadow-sm ring-1 ring-amber-200"
                            : isUnread
                            ? "bg-emerald-50/80 border-emerald-200 shadow-xs"
                            : "bg-slate-50/80 border-slate-100 text-slate-600"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="font-extrabold text-xs text-slate-900 truncate">
                              {isCounter ? "🔔 Farmer Counter Offer Received" : n.title}
                            </span>
                            {isUnread && (
                              <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black uppercase shrink-0 ${
                                isCounter ? "bg-amber-500 text-slate-950" : "bg-blue-600 text-white"
                              }`}>
                                NEW
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 shrink-0">
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-slate-600 text-[11px] leading-relaxed">{n.message}</p>
                        {isCounter && (
                          <div className="flex items-center justify-between pt-1 text-[11px]">
                            {n.counterPrice && (
                              <span className="font-black text-amber-950 bg-amber-100/80 px-2 py-0.5 rounded border border-amber-300">
                                Counter: ₹{n.counterPrice}/Qtl
                              </span>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveTab("offers");
                              }}
                              className="text-xs font-black text-blue-700 hover:text-blue-800 flex items-center gap-1 ml-auto"
                            >
                              View Offer →
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {notifications.length === 0 && (
                    <p className="text-xs text-slate-400 text-center py-4">No notifications yet.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: FARMER PRODUCE DISCOVERY */}
        {activeTab === "lots" && (
          <div className="space-y-6">
            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search crop, variety, or district..."
                  value={lotSearchQuery}
                  onChange={(e) => setLotSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 focus:bg-white text-xs font-medium"
                />
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
                <span className="font-bold text-slate-500 whitespace-nowrap">Filter Commodity:</span>
                {["ALL", "Onion", "Wheat", "Tomato", "Soybean", "Banana"].map((crop) => (
                  <button
                    key={crop}
                    onClick={() => setLotFilterCrop(crop)}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer ${
                      lotFilterCrop === crop
                        ? "bg-emerald-700 text-white shadow-sm"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {crop}
                  </button>
                ))}
              </div>
            </div>

            {/* Lots Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredLots.map((lot) => (
                <div
                  key={lot.lotId || lot._id}
                  className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all space-y-3.5 text-xs flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold text-slate-400">{lot.lotId}</span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300/60">
                        {lot.provisionalGrade || lot.grade || "Grade A"}
                      </span>
                    </div>

                    <h4 className="font-extrabold text-base text-slate-900">{lot.cropName}</h4>
                    <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {lot.origin || "Farm Gate"}, {lot.district || "Nashik"}
                    </p>
                  </div>

                  {/* Quality Passport Summary Pill */}
                  {lot.qualityScore || lot.qualityPassport ? (
                    <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200/80 text-emerald-950 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-xs text-emerald-900 flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                          <span>{lot.provisionalGrade || lot.grade || "Grade A"}</span>
                        </span>
                        <span className="text-[10px] font-black text-emerald-800 bg-emerald-200/80 px-2 py-0.5 rounded">
                          Score: {lot.qualityScore}/100
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-600">
                        <span>Confidence: {lot.evidenceConfidence || 75}%</span>
                        <button
                          type="button"
                          onClick={() => setSelectedLotForPassport(lot)}
                          className="font-bold text-emerald-800 hover:text-emerald-950 underline cursor-pointer"
                        >
                          View Quality Passport →
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-2 text-slate-500">
                      <ShieldCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="text-[11px] font-medium text-slate-500">
                        Quality Assessment Not Provided
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block">LOT VOLUME</span>
                      <span className="font-black text-slate-900 text-sm">{lot.quantityQtl} Qtl</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block">EXPECTED PRICE</span>
                      <span className="font-black text-emerald-700 text-sm">₹{lot.expectedPricePerQtl}/Qtl</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedLotForBid(lot);
                      setBidPrice(String(lot.expectedPricePerQtl || 3000));
                    }}
                    className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-98 cursor-pointer text-xs"
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    Submit Binding Offer
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: DEMAND MANAGEMENT */}
        {activeTab === "demands" && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-lg text-slate-900">Buyer Procurement Demands</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Publish your purchase requirements to attract direct farmer lot submissions.
                  </p>
                </div>
                <button
                  onClick={() => setNewDemandModalOpen(true)}
                  className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Post New Demand
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {demands.map((d) => (
                  <div
                    key={d.demandId}
                    className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-2xl space-y-3 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-900">{d.commodity}</span>
                        <span className="text-[10px] font-mono text-slate-500">({d.demandId})</span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
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

        {/* TAB 4: OFFERS & NEGOTIATIONS (Real Backend Data) */}
        {activeTab === "offers" && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-lg text-slate-900">Submitted Buyer Bids & Counter Offers</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Manage direct price negotiations, farmer counter prices, and accepted trade agreements.
                  </p>
                </div>
                <button
                  onClick={loadOffersData}
                  disabled={loadingOffers}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingOffers ? "animate-spin" : ""}`} />
                  Refresh Offers
                </button>
              </div>

              <div className="space-y-3">
                {backendOffers.map((b) => (
                  <div
                    key={b._id || b.offerId}
                    className="p-5 bg-slate-50/70 border border-slate-200/80 rounded-2xl space-y-3 text-xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="font-mono text-[10px] font-bold text-slate-500">
                          {b.offerId} • Commodity: {b.commodity}
                        </span>
                        <h4 className="font-extrabold text-base text-slate-900">{b.commodity}</h4>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider self-start sm:self-auto ${
                          b.offerStatus === "ACCEPTED"
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : b.offerStatus === "COUNTERED"
                            ? b.counterBy === "BUYER"
                              ? "bg-blue-100 text-blue-900 border border-blue-200"
                              : "bg-amber-100 text-amber-900 border border-amber-300 animate-pulse"
                            : b.offerStatus === "REJECTED"
                            ? "bg-red-100 text-red-800 border border-red-200"
                            : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        }`}
                      >
                        {b.offerStatus === "COUNTERED" && b.counterBy === "BUYER"
                          ? "AWAITING FARMER RESPONSE"
                          : b.offerStatus}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-white p-3 rounded-xl border border-slate-100">
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold block">QUANTITY</span>
                        <span className="font-black text-slate-900">{b.quantityQtl} Qtl</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold block">ORIGINAL OFFER</span>
                        <span className="font-black text-slate-900">₹{b.pricePerQtl}/Qtl</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold block">
                          {b.counterPricePerQtl ? "COUNTER PRICE" : "GROSS VALUE"}
                        </span>
                        <span className="font-bold text-slate-800">
                          {b.counterPricePerQtl
                            ? `₹${b.counterPricePerQtl}/Qtl`
                            : `₹${b.grossValue?.toLocaleString("en-IN")}`}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold block">PAYMENT TERMS</span>
                        <span className="font-medium text-slate-700 truncate">{b.paymentTerms || "Escrow T+1"}</span>
                      </div>
                    </div>

                    {/* Counter Offer Actions: Farmer Countered -> Buyer responds */}
                    {b.offerStatus === "COUNTERED" && b.counterPricePerQtl && (b.counterBy === "FARMER" || !b.counterBy) && (
                      <div className="p-4 bg-amber-50/90 border border-amber-200/90 rounded-xl space-y-2.5 text-amber-950">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-extrabold text-sm">
                          <div>
                            <span className="block text-xs font-bold text-amber-800 uppercase tracking-wide">Farmer Counter Offer:</span>
                            <span className="text-base font-black text-amber-950">₹{b.counterPricePerQtl}/Qtl</span>
                            <span className="text-xs font-medium text-amber-800 ml-2">(Original: ₹{b.pricePerQtl}/Qtl)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleAcceptCounterOffer(b._id || b.offerId)}
                              disabled={actionInProgressId === b._id}
                              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-sm text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              Accept Counter (₹{b.counterPricePerQtl})
                            </button>
                            <button
                              onClick={() => {
                                setCounterModalOffer(b);
                                setBuyerCounterPrice(String(b.counterPricePerQtl));
                              }}
                              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl shadow-sm text-xs flex items-center gap-1.5 cursor-pointer"
                            >
                              <MessageSquare className="w-4 h-4" />
                              Counter Again
                            </button>
                            <button
                              onClick={() => handleRejectOffer(b._id || b.offerId)}
                              disabled={actionInProgressId === b._id}
                              className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-bold rounded-xl text-xs cursor-pointer disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                        {b.counterMessage && (
                          <p className="text-xs text-amber-800 font-medium italic border-t border-amber-200/60 pt-1.5">
                            Farmer Note: "{b.counterMessage}"
                          </p>
                        )}
                      </div>
                    )}

                    {/* Counter Offer Waiting State: Buyer Countered -> Waiting for Farmer */}
                    {b.offerStatus === "COUNTERED" && b.counterPricePerQtl && b.counterBy === "BUYER" && (
                      <div className="p-3.5 bg-blue-50/80 border border-blue-200/80 rounded-xl space-y-1.5 text-blue-900">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span>Your Revised Counter: ₹{b.counterPricePerQtl}/Qtl</span>
                          <span className="px-2.5 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-black uppercase">
                            Awaiting Farmer Action
                          </span>
                        </div>
                        <p className="text-[11px] text-blue-700 font-medium">
                          You have countered this trade. Waiting for the farmer to accept or counter.
                        </p>
                      </div>
                    )}

                    {/* Accepted Deal Confirmed Box */}
                    {b.offerStatus === "ACCEPTED" && (
                      <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2 text-emerald-800 font-bold">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Deal Confirmed at ₹{b.pricePerQtl}/Qtl • Escrow & Delivery Order Active</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => setActiveTab("purchases")}
                            className="px-3 py-1.5 rounded-xl bg-emerald-700 text-white font-bold text-[11px] hover:bg-emerald-800 shadow-xs cursor-pointer"
                          >
                            Track Delivery →
                          </button>
                          <button
                            onClick={() => setActiveTab("payments")}
                            className="px-3 py-1.5 rounded-xl bg-slate-900 text-white font-bold text-[11px] hover:bg-slate-800 shadow-xs cursor-pointer"
                          >
                            View Payment
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {backendOffers.length === 0 && (
                  <div className="text-center py-10 text-slate-400 space-y-1">
                    <DollarSign className="w-8 h-8 mx-auto opacity-50 mb-1" />
                    <p className="font-bold">No active buyer offers or bids.</p>
                    <p className="text-xs">Browse Farmer Produce Discovery to submit your first binding offer.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: PURCHASES & LOGISTICS */}
        {activeTab === "purchases" && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
              <h3 className="font-extrabold text-lg text-slate-900">Procured Deliveries & Dispatch Status</h3>
              <div className="space-y-3">
                {deliveries.map((dlv) => (
                  <div
                    key={dlv.deliveryId || dlv._id}
                    className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-2xl space-y-3 text-xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-emerald-700" />
                        <span className="font-extrabold text-sm text-slate-900">{dlv.deliveryId}</span>
                        <span className="text-slate-500 font-medium">({dlv.crop})</span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {dlv.deliveryStatus}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-white p-3 rounded-xl border border-slate-100">
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold block">QUANTITY</span>
                        <span className="font-black text-slate-900">{dlv.quantityQtl} Qtl</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold block">AGREED PRICE</span>
                        <span className="font-black text-emerald-700">₹{dlv.agreedPricePerQtl}/Qtl</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold block">ORIGIN</span>
                        <span className="font-medium text-slate-700 truncate">{dlv.origin}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold block">DESTINATION</span>
                        <span className="font-medium text-slate-700 truncate">{dlv.destination}</span>
                      </div>
                    </div>
                  </div>
                ))}

                {deliveries.length === 0 && (
                  <p className="text-center py-10 text-slate-400 font-medium">No confirmed deliveries yet.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: ESCROW & SETTLEMENTS */}
        {activeTab === "payments" && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
              <h3 className="font-extrabold text-lg text-slate-900">Escrow Account & Farmer Settlements</h3>
              <div className="space-y-3">
                {payments.map((p) => (
                  <div
                    key={p.paymentId || p._id}
                    className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-2xl space-y-3 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-emerald-700" />
                        <span className="font-extrabold text-sm text-slate-900">{p.paymentId}</span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {p.paymentStatus}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-white p-3 rounded-xl border border-slate-100">
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold block">NET PAYABLE</span>
                        <span className="font-black text-emerald-700 text-sm">₹{p.netPayable?.toLocaleString("en-IN")}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold block">PAYMENT MODE</span>
                        <span className="font-medium text-slate-700">{p.paymentMode || "Bank Transfer"}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold block">NOTES</span>
                        <span className="font-medium text-slate-700 truncate">{p.notes || "Escrow Verified"}</span>
                      </div>
                    </div>
                  </div>
                ))}

                {payments.length === 0 && (
                  <p className="text-center py-10 text-slate-400 font-medium">No payment ledger records yet.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: NOTIFICATIONS FEED */}
        {activeTab === "notifications" && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-lg text-slate-900">Real-Time Notification Feed</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Live alerts for farmer counter-offers, trade acceptance, and delivery updates.
                  </p>
                </div>
                <button
                  onClick={loadNotificationsData}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Refresh Feed
                </button>
              </div>

              <div className="space-y-3">
                {notifications.map((n) => {
                  const isUnread = n.isRead === false || n.read === false;
                  const isCounter = n.type === "COUNTER_OFFER";

                  return (
                    <div
                      key={n._id || n.notificationId}
                      onClick={async () => {
                        if (isUnread && n._id) {
                          await markNotificationReadApi(n._id);
                          loadNotificationsData();
                        }
                      }}
                      className={`p-4 rounded-2xl border transition-all text-xs space-y-2.5 cursor-pointer ${
                        isCounter && isUnread
                          ? "bg-amber-50/90 border-amber-300 shadow-md ring-2 ring-amber-400/30"
                          : isCounter
                          ? "bg-amber-50/40 border-amber-200 text-slate-800"
                          : isUnread
                          ? "bg-emerald-50/70 border-emerald-200 text-slate-900 shadow-xs"
                          : "bg-white border-slate-200 text-slate-600"
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                            {isCounter ? "🔔 Farmer Counter Offer Received" : n.title}
                          </span>
                          {isUnread && (
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              isCounter ? "bg-amber-500 text-slate-950" : "bg-emerald-700 text-white"
                            }`}>
                              NEW
                            </span>
                          )}
                          {isCounter && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                              COUNTER OFFER
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {new Date(n.createdAt).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>

                      <p className="text-slate-700 text-xs leading-relaxed font-medium">{n.message}</p>

                      {isCounter && (
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-amber-200/70">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-amber-900 font-semibold">Farmer Counter Price:</span>
                            <span className="font-black text-sm text-amber-950 bg-amber-200/80 px-2.5 py-0.5 rounded-lg border border-amber-300">
                              ₹{n.counterPrice || '3200'}/Qtl
                            </span>
                          </div>

                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (isUnread && n._id) {
                                await markNotificationReadApi(n._id);
                                loadNotificationsData();
                              }
                              setActiveTab("offers");
                            }}
                            className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer transition-all"
                          >
                            <span>View Offer & Respond</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}

                {notifications.length === 0 && (
                  <div className="text-center py-12 text-slate-400 space-y-1">
                    <Bell className="w-8 h-8 mx-auto opacity-40 mb-1" />
                    <p className="font-bold text-sm">No notifications in feed.</p>
                    <p className="text-xs">Real-time alerts will appear here when farmers counter or accept offers.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SUBMIT BID MODAL */}
      {selectedLotForBid && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="font-mono text-[10px] font-bold text-slate-400">
                  Lot: {selectedLotForBid.lotId}
                </span>
                <h3 className="font-black text-lg text-slate-900">
                  Submit Offer for {selectedLotForBid.cropName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedLotForBid(null)}
                className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitBid} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Your Offered Price (₹ / Qtl)</label>
                <input
                  type="number"
                  required
                  value={bidPrice}
                  onChange={(e) => setBidPrice(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 focus:bg-white font-black text-base text-emerald-800"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Farmer Expected: ₹{selectedLotForBid.expectedPricePerQtl}/Qtl • Lot Size: {selectedLotForBid.quantityQtl} Qtl
                </span>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Logistics Preference</label>
                <select
                  value={bidDeliveryType}
                  onChange={(e) => setBidDeliveryType(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 focus:bg-white font-medium text-xs"
                >
                  <option>Buyer Pickup (Self Logistics)</option>
                  <option>Farmer Delivery to APMC Terminal</option>
                  <option>PRISMS Partner Logistics Dispatch</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Payment & Escrow Terms</label>
                <input
                  type="text"
                  value={bidTerms}
                  onChange={(e) => setBidTerms(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 focus:bg-white font-medium text-xs"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedLotForBid(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bidSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow-sm active:scale-98 cursor-pointer"
                >
                  {bidSubmitting ? "Submitting..." : "Send Binding Offer →"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COUNTER AGAIN MODAL */}
      {counterModalOffer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-lg text-slate-900">
                  Counter Again: {counterModalOffer.commodity}
                </h3>
                <span className="font-mono text-[10px] font-bold text-slate-400">
                  {counterModalOffer.offerId}
                </span>
              </div>
              <button
                onClick={() => setCounterModalOffer(null)}
                className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBuyerCounterSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Your Revised Counter Price (₹ / Qtl)</label>
                <input
                  type="number"
                  required
                  value={buyerCounterPrice}
                  onChange={(e) => setBuyerCounterPrice(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 focus:bg-white font-black text-base text-emerald-800"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Negotiation Note to Farmer</label>
                <input
                  type="text"
                  placeholder="e.g. Can do ₹3,150/Qtl if picked up tomorrow"
                  value={buyerCounterMsg}
                  onChange={(e) => setBuyerCounterMsg(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 focus:bg-white font-medium text-xs"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCounterModalOffer(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold shadow-sm active:scale-98 cursor-pointer"
                >
                  Send Counter Offer →
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POST NEW DEMAND MODAL */}
      {newDemandModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-lg text-slate-900">Publish New Procurement Demand</h3>
              <button
                onClick={() => setNewDemandModalOpen(false)}
                className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDemand} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Commodity</label>
                  <input
                    type="text"
                    required
                    value={newCrop}
                    onChange={(e) => setNewCrop(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 focus:bg-white font-bold text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Volume (Qtl)</label>
                  <input
                    type="number"
                    required
                    value={newQty}
                    onChange={(e) => setNewQty(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 focus:bg-white font-bold text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Target Price Min (₹)</label>
                  <input
                    type="number"
                    required
                    value={newTargetMin}
                    onChange={(e) => setNewTargetMin(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 focus:bg-white font-bold text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Target Price Max (₹)</label>
                  <input
                    type="number"
                    required
                    value={newTargetMax}
                    onChange={(e) => setNewTargetMax(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 focus:bg-white font-bold text-xs"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setNewDemandModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow-sm active:scale-98 cursor-pointer"
                >
                  Publish Demand
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quality Passport Viewer Modal for Buyers */}
      {selectedLotForPassport && (
        <QualityPassportModal
          isOpen={!!selectedLotForPassport}
          onClose={() => setSelectedLotForPassport(null)}
          assessment={
            selectedLotForPassport.qualityPassport
              ? ({
                  assessmentId: selectedLotForPassport.qualityAssessmentId || selectedLotForPassport.lotId,
                  cropName: selectedLotForPassport.cropName,
                  variety: selectedLotForPassport.variety,
                  qualityScore: selectedLotForPassport.qualityScore || 85,
                  provisionalGrade: selectedLotForPassport.provisionalGrade || selectedLotForPassport.grade || "Grade A",
                  evidenceConfidence: selectedLotForPassport.evidenceConfidence || 80,
                  criticalFlags: [],
                  positiveFactors: [
                    `Standard grade declaration for ${selectedLotForPassport.cropName}`,
                    "Harvest quality declared from verified grower",
                  ],
                  riskFactors: ["Provisional assessment awaiting delivery hub inspection"],
                  passportSummary: selectedLotForPassport.qualityPassport,
                } as any)
              : null
          }
          lotId={selectedLotForPassport.lotId}
          onMakeOffer={() => {
            const lot = selectedLotForPassport;
            setSelectedLotForPassport(null);
            setSelectedLotForBid(lot);
            setBidPrice(String(lot.expectedPricePerQtl || 3000));
          }}
        />
      )}
    </div>
  );
};

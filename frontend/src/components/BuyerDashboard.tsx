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
              {unreadNotifsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {unreadNotifsCount}
                </span>
              )}
            </button>

            <button
              onClick={onSwitchToLanding}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold text-xs flex items-center gap-1.5 transition-all"
              title="Public Landing Page"
            >
              <Store className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden md:inline">Public Portal</span>
            </button>

            <button
              onClick={onLogout}
              className="px-3 py-1.5 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 font-bold text-xs flex items-center gap-1.5 transition-all"
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
                className={`px-4 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                      isActive ? "bg-white text-blue-700" : "bg-slate-200 text-slate-700"
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
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-xs font-bold uppercase tracking-wider">Available Farmer Lots</span>
                  <Package className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-2xl font-black text-slate-900">{availableLots.length} Lots</div>
                <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> Live verified lots in Maharashtra
                </p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-xs font-bold uppercase tracking-wider">Active Demands</span>
                  <Tag className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-2xl font-black text-slate-900">{demands.length} Demands</div>
                <p className="text-[11px] text-slate-500 font-medium">Procurement requirements posted</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-xs font-bold uppercase tracking-wider">Active Bids & Offers</span>
                  <DollarSign className="w-4 h-4 text-amber-600" />
                </div>
                <div className="text-2xl font-black text-slate-900">{backendOffers.length} Bids</div>
                <p className="text-[11px] text-amber-600 font-bold">
                  {backendOffers.filter((b) => b.offerStatus === "COUNTERED").length} Counter Offers Pending
                </p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-xs font-bold uppercase tracking-wider">Escrow Procurement</span>
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-2xl font-black text-slate-900">
                  ₹{payments.reduce((acc, p) => acc + (p.netPayable || 0), 0).toLocaleString("en-IN")}
                </div>
                <p className="text-[11px] text-emerald-600 font-semibold">T+1 Direct Settlement Secured</p>
              </div>
            </div>

            {/* Quick Actions & Live Stream */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Featured Available Lots */}
              <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900">Top Available Trade Lots</h3>
                    <p className="text-xs text-slate-500 font-medium">Verified farm-gate and APMC yard supply</p>
                  </div>
                  <button
                    onClick={() => setActiveTab("lots")}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    View All Lots ({availableLots.length}) <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {availableLots.slice(0, 4).map((lot) => (
                    <div
                      key={lot.lotId || lot._id}
                      className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl hover:border-blue-300 transition-all space-y-2.5 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-slate-900 text-sm">{lot.cropName}</span>
                        <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-black text-[10px]">
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
                        className="w-full py-1.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-1 shadow-sm text-xs"
                      >
                        Submit Direct Bid →
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Live Alerts Feed */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-base text-slate-900">Recent Notifications</h3>
                  <button
                    onClick={() => setActiveTab("notifications")}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700"
                  >
                    View All
                  </button>
                </div>

                <div className="space-y-3">
                  {notifications.slice(0, 4).map((n) => (
                    <div
                      key={n._id || n.notificationId}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{n.title}</span>
                        {!n.isRead && (
                          <span className="w-2 h-2 rounded-full bg-blue-600" />
                        )}
                      </div>
                      <p className="text-slate-600 text-[11px] leading-relaxed">{n.message}</p>
                    </div>
                  ))}
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
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search crop, variety, or district..."
                  value={lotSearchQuery}
                  onChange={(e) => setLotSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-xs font-medium"
                />
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
                <span className="font-bold text-slate-500 whitespace-nowrap">Filter Commodity:</span>
                {["ALL", "Onion", "Wheat", "Tomato", "Soybean", "Banana"].map((crop) => (
                  <button
                    key={crop}
                    onClick={() => setLotFilterCrop(crop)}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap ${
                      lotFilterCrop === crop
                        ? "bg-blue-600 text-white"
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
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all space-y-3.5 text-xs flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold text-slate-400">{lot.lotId}</span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                        {lot.grade || "Grade A"}
                      </span>
                    </div>

                    <h4 className="font-extrabold text-base text-slate-900">{lot.cropName}</h4>
                    <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {lot.origin || "Farm Gate"}, {lot.district || "Nashik"}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
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
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-98"
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

        {/* TAB 4: OFFERS & NEGOTIATIONS (Real Backend Data) */}
        {activeTab === "offers" && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
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
                  className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingOffers ? "animate-spin" : ""}`} />
                  Refresh Offers
                </button>
              </div>

              <div className="space-y-3">
                {backendOffers.map((b) => (
                  <div
                    key={b._id || b.offerId}
                    className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 text-xs"
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
                            ? "bg-amber-100 text-amber-800 border border-amber-200 animate-pulse"
                            : b.offerStatus === "REJECTED"
                            ? "bg-red-100 text-red-800 border border-red-200"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {b.offerStatus}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-white p-3 rounded-xl border border-slate-100">
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold block">QUANTITY</span>
                        <span className="font-black text-slate-900">{b.quantityQtl} Qtl</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold block">ORIGINAL OFFER</span>
                        <span className="font-black text-blue-700">₹{b.pricePerQtl}/Qtl</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold block">GROSS VALUE</span>
                        <span className="font-bold text-slate-700">₹{b.grossValue?.toLocaleString("en-IN")}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold block">PAYMENT TERMS</span>
                        <span className="font-medium text-slate-700 truncate">{b.paymentTerms || "Escrow T+1"}</span>
                      </div>
                    </div>

                    {/* Counter Offer Actions */}
                    {b.offerStatus === "COUNTERED" && b.counterPricePerQtl && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2 text-amber-900">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-extrabold text-sm">
                          <span>Farmer Countered at: ₹{b.counterPricePerQtl}/Qtl</span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleAcceptCounterOffer(b._id || b.offerId)}
                              disabled={actionInProgressId === b._id}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm text-xs flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Accept Counter (₹{b.counterPricePerQtl})
                            </button>
                            <button
                              onClick={() => {
                                setCounterModalOffer(b);
                                setBuyerCounterPrice(String(b.counterPricePerQtl));
                              }}
                              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shadow-sm text-xs flex items-center gap-1"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              Counter Again
                            </button>
                            <button
                              onClick={() => handleRejectOffer(b._id || b.offerId)}
                              disabled={actionInProgressId === b._id}
                              className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-800 font-bold rounded-lg text-xs"
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                        {b.counterMessage && <p className="text-xs text-amber-800">Note: {b.counterMessage}</p>}
                      </div>
                    )}
                  </div>
                ))}

                {backendOffers.length === 0 && (
                  <div className="text-center py-10 text-slate-400">
                    <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-50" />
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
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-extrabold text-lg text-slate-900">Procured Deliveries & Dispatch Status</h3>
              <div className="space-y-3">
                {deliveries.map((dlv) => (
                  <div
                    key={dlv.deliveryId || dlv._id}
                    className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 text-xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-blue-600" />
                        <span className="font-extrabold text-sm text-slate-900">{dlv.deliveryId}</span>
                        <span className="text-slate-500 font-medium">({dlv.crop})</span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-800">
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
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-extrabold text-lg text-slate-900">Escrow Account & Farmer Settlements</h3>
              <div className="space-y-3">
                {payments.map((p) => (
                  <div
                    key={p.paymentId || p._id}
                    className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-emerald-600" />
                        <span className="font-extrabold text-sm text-slate-900">{p.paymentId}</span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
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
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-lg text-slate-900">Real-Time Notification Feed</h3>
                <button
                  onClick={loadNotificationsData}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700"
                >
                  Refresh Feed
                </button>
              </div>

              <div className="space-y-2.5">
                {notifications.map((n) => (
                  <div
                    key={n._id || n.notificationId}
                    onClick={async () => {
                      if (!n.isRead && n._id) {
                        await markNotificationReadApi(n._id);
                        loadNotificationsData();
                      }
                    }}
                    className={`p-4 rounded-2xl border transition-all text-xs space-y-1.5 cursor-pointer ${
                      n.isRead
                        ? "bg-white border-slate-200 text-slate-600"
                        : "bg-blue-50/50 border-blue-200 text-slate-900 shadow-sm"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-900">{n.title}</span>
                        {!n.isRead && (
                          <span className="px-2 py-0.2 rounded-full text-[9px] font-black bg-blue-600 text-white">
                            NEW
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-slate-600 text-xs leading-relaxed">{n.message}</p>
                  </div>
                ))}

                {notifications.length === 0 && (
                  <p className="text-center py-10 text-slate-400 font-medium">No notifications in feed.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SUBMIT BID MODAL */}
      {selectedLotForBid && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95">
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
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 text-slate-500"
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
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-black text-base text-blue-700"
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
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-medium text-xs"
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
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-medium text-xs"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedLotForBid(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bidSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black shadow-md shadow-blue-500/20 active:scale-98"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95">
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
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 text-slate-500"
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
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-black text-base text-blue-700"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Negotiation Note to Farmer</label>
                <input
                  type="text"
                  placeholder="e.g. Can do ₹3,150/Qtl if picked up tomorrow"
                  value={buyerCounterMsg}
                  onChange={(e) => setBuyerCounterMsg(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-medium text-xs"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCounterModalOffer(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black shadow-md active:scale-98"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-lg text-slate-900">Publish New Procurement Demand</h3>
              <button
                onClick={() => setNewDemandModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 text-slate-500"
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
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-bold text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Volume (Qtl)</label>
                  <input
                    type="number"
                    required
                    value={newQty}
                    onChange={(e) => setNewQty(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-bold text-xs"
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
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-bold text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Target Price Max (₹)</label>
                  <input
                    type="number"
                    required
                    value={newTargetMax}
                    onChange={(e) => setNewTargetMax(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-bold text-xs"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setNewDemandModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black shadow-md shadow-blue-500/20 active:scale-98"
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

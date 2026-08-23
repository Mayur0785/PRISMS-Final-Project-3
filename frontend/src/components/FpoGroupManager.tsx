import React, { useState, useEffect, useMemo } from 'react';
import { Users, Truck, Plus, CheckCircle2, TrendingUp, ShieldCheck, ArrowRight, Layers, Sparkles, Building2, Scale, DollarSign, Award, Info } from 'lucide-react';
import {
  FPOItem,
  GroupHarvestPoolItem,
  TransportOptimizationData,
  TradeLot,
  fetchFpos,
  joinFpoApi,
  fetchPools,
  createPoolApi,
  contributeToPoolApi,
  fetchPoolTransportOptimization,
  fetchPoolMarketRecommendations,
  fetchUserLots,
} from '../lib/prisms';

interface FpoGroupManagerProps {
  lang?: 'en' | 'mr';
}

export const FpoGroupManager: React.FC<FpoGroupManagerProps> = ({ lang = 'en' }) => {
  const [fpos, setFpos] = useState<FPOItem[]>([]);
  const [pools, setPools] = useState<GroupHarvestPoolItem[]>([]);
  const [userLots, setUserLots] = useState<TradeLot[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Selected state
  const [selectedFpoId, setSelectedFpoId] = useState<string | null>(null);
  const [selectedPool, setSelectedPool] = useState<GroupHarvestPoolItem | null>(null);
  const [transportOpt, setTransportOpt] = useState<TransportOptimizationData | null>(null);
  const [marketRec, setMarketRec] = useState<any>(null);

  // Form states
  const [showCreatePoolModal, setShowCreatePoolModal] = useState<boolean>(false);
  const [poolCrop, setPoolCrop] = useState<string>('Red Onion (Nashik)');
  const [poolVariety, setPoolVariety] = useState<string>('Garwa Premium');
  const [poolGrade, setPoolGrade] = useState<string>('Grade A');

  const [showContributeModal, setShowContributeModal] = useState<boolean>(false);
  const [selectedLotId, setSelectedLotId] = useState<string>('');
  const [contribQty, setContribQty] = useState<number>(20);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [fpoList, poolList, lotsList] = await Promise.all([
      fetchFpos(),
      fetchPools(),
      fetchUserLots(),
    ]);
    setFpos(fpoList);
    setPools(poolList);
    setUserLots(lotsList);
    if (poolList.length > 0) {
      selectPool(poolList[0]);
    }
    setLoading(false);
  };

  const selectPool = async (pool: GroupHarvestPoolItem) => {
    setSelectedPool(pool);
    const [optData, recData] = await Promise.all([
      fetchPoolTransportOptimization(pool.poolId, 25),
      fetchPoolMarketRecommendations(pool.poolId),
    ]);
    setTransportOpt(optData);
    setMarketRec(recData);
  };

  const handleJoinFpo = async (fpoId: string) => {
    try {
      setStatusMessage('Joining FPO...');
      await joinFpoApi(fpoId);
      setStatusMessage('Successfully joined FPO member collective!');
      await loadData();
    } catch (err: any) {
      setStatusMessage(`Error: ${err.response?.data?.error?.message || err.message}`);
    }
  };

  const handleCreatePool = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setStatusMessage('Creating Group Harvest Pool...');
      const created = await createPoolApi({
        fpoId: selectedFpoId || 'FPO-2026-0001',
        crop: poolCrop,
        variety: poolVariety,
        grade: poolGrade,
      });
      setStatusMessage(`Pool ${created.poolId} created successfully!`);
      setShowCreatePoolModal(false);
      await loadData();
    } catch (err: any) {
      setStatusMessage(`Error: ${err.response?.data?.error?.message || err.message}`);
    }
  };

  const handleContribute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPool || !selectedLotId) return;

    try {
      setStatusMessage('Pooling trade lot into group harvest...');
      const updated = await contributeToPoolApi(selectedPool.poolId, selectedLotId, contribQty);
      setStatusMessage(`Successfully contributed ${contribQty} Qtl to Pool ${selectedPool.poolId}!`);
      setShowContributeModal(false);
      await loadData();
      selectPool(updated);
    } catch (err: any) {
      setStatusMessage(`Error: ${err.response?.data?.error?.message || err.message}`);
    }
  };

  // Farmer contribution sum calculations
  const contributionSummary = useMemo(() => {
    if (!selectedPool || !selectedPool.farmerContributions) {
      return { totalQty: 0, totalSharePercent: 0 };
    }
    const totalQty = selectedPool.farmerContributions.reduce((acc, c) => acc + (c.quantityQtl || 0), 0);
    const totalSharePercent = selectedPool.farmerContributions.reduce((acc, c) => acc + (c.contributionPercent || 0), 0);
    return {
      totalQty: totalQty || selectedPool.totalQuantityQtl || 0,
      totalSharePercent: Math.round(totalSharePercent) || 100,
    };
  }, [selectedPool]);

  // Market recommendation comparison logic
  const recommendedWinner = useMemo(() => {
    if (!marketRec || !marketRec.bestMandi || !marketRec.bestBuyer) return null;
    const mandiNet = marketRec.bestMandi.estimatedNetRealization || 0;
    const buyerNet = marketRec.bestBuyer.estimatedNetRealization || 0;

    if (buyerNet >= mandiNet) {
      return 'buyer';
    } else {
      return 'mandi';
    }
  }, [marketRec]);

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {lang === 'mr' ? 'शेतकरी गट एकत्रीकरण व सामूहिक काढणी पूल' : 'FPO Farmer Aggregation & Group Harvest Pooling'}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200">
                  Demo FPO Sandbox
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
                {lang === 'mr'
                  ? 'इतर शेतकरी सदस्यांसह माल एकत्र करा, वाहतूक खर्च कमी करा आणि घाऊक खरेदीदार प्रीमियम मिळवा.'
                  : 'Combine compatible produce lots with fellow FPO members to optimize vehicle capacities, slash logistics costs, and achieve bulk buyer price premiums.'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowCreatePoolModal(true)}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-2 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" /> Create Group Harvest Pool
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center justify-between">
          <span>{statusMessage}</span>
          <button onClick={() => setStatusMessage(null)} className="text-emerald-700 hover:text-emerald-900 font-bold">
            ×
          </button>
        </div>
      )}

      {/* STEP 1: Registered FPOs Directory */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-600" />
            1. Registered Farmer Producer Organizations (FPOs)
          </h3>
          <span className="text-xs text-slate-500 font-medium">FPO Member Directory</span>
        </div>

        {fpos.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500 bg-white border border-slate-200 rounded-2xl">
            No compatible FPOs found.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {fpos.map(fpo => (
              <div
                key={fpo.fpoId}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-slate-300 flex flex-col justify-between space-y-4 transition-all"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-extrabold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {fpo.fpoId}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-bold uppercase">
                      Demo FPO
                    </span>
                  </div>
                  <h4 className="text-base font-extrabold text-slate-900">{fpo.name}</h4>
                  <p className="text-xs text-slate-600 line-clamp-2 font-medium">{fpo.description}</p>
                  <div className="pt-2 text-xs text-slate-700 space-y-1 border-t border-slate-100 font-medium">
                    <div><strong>District:</strong> {fpo.district}, {fpo.state}</div>
                    <div><strong>Reg No:</strong> {fpo.registrationNumber}</div>
                    <div><strong>Members:</strong> <span className="font-extrabold text-slate-900">{fpo.memberCount} Farmers</span></div>
                  </div>
                </div>

                <button
                  onClick={() => handleJoinFpo(fpo.fpoId)}
                  className="w-full py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition-all shadow-2xs cursor-pointer"
                >
                  Join FPO Member Collective
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* STEP 2 & 3: Group Harvest Pools & Farmer Contributions */}
      <div className="space-y-4 pt-4 border-t border-slate-200">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-600" />
            2. Active Collective Harvest Pools
          </h3>
          <span className="text-xs text-slate-500 font-medium">Select a Pool to View Allocation</span>
        </div>

        {pools.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-600 bg-white border border-slate-200 shadow-xs rounded-2xl space-y-2">
            <div className="font-bold text-slate-800 text-sm">No active collective harvest pools</div>
            <p className="text-slate-500">Create your first group harvest pool to begin pooled selling.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Pools Selector Sidebar (4 cols) */}
            <div className="lg:col-span-4 space-y-3">
              {pools.map(pool => {
                const isSelected = selectedPool?.poolId === pool.poolId;

                return (
                  <div
                    key={pool.poolId}
                    onClick={() => selectPool(pool)}
                    className={`p-4.5 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-emerald-50/80 border-emerald-300 shadow-xs ring-2 ring-emerald-500/20'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-extrabold text-slate-900 text-sm">{pool.crop} Pool</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-extrabold uppercase border border-emerald-200">
                        {pool.poolingStatus}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 font-medium">
                      Pool ID: {pool.poolId} • Grade: {pool.grade}
                    </p>
                    <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between">
                      <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">TOTAL POOLED:</span>
                      <span className="font-black text-emerald-700 text-base">{pool.totalQuantityQtl} Qtl</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Selected Pool Detailed Dashboard (8 cols) */}
            {selectedPool && (
              <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-lg font-black text-slate-900">
                        Pool: {selectedPool.poolId} ({selectedPool.crop})
                      </h4>
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-bold uppercase">
                        Simulated Group Pool
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 font-medium">
                      Grade: {selectedPool.grade} • Variety: {selectedPool.variety} • Target: {selectedPool.targetMarket}
                    </p>
                  </div>

                  <button
                    onClick={() => setShowContributeModal(true)}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                  >
                    + Contribute Farmer Lot
                  </button>
                </div>

                {/* Prominent Total Pooled Banner */}
                <div className="bg-gradient-to-r from-slate-900 to-emerald-950 text-white rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
                      TOTAL POOLED HARVEST QUANTITY
                    </span>
                    <span className="text-2xl font-black text-white mt-0.5 block">
                      {selectedPool.totalQuantityQtl} Qtl
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-slate-300 font-medium block">
                      Active Member Contributions
                    </span>
                    <span className="text-sm font-bold text-emerald-300">
                      {selectedPool.farmerContributions.length} Farmers Joined
                    </span>
                  </div>
                </div>

                {/* STEP 3: Farmer Contributions Table & Summary */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                      3. Farmer Member Contributions & Proportional Share %
                    </h5>
                  </div>

                  {selectedPool.farmerContributions.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
                      No contributions added yet. Click "+ Contribute Farmer Lot" to pool produce.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="overflow-x-auto bg-slate-50 rounded-xl border border-slate-200">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-100 text-slate-700 border-b border-slate-200 font-bold">
                            <tr>
                              <th className="p-3 font-bold">Farmer Member</th>
                              <th className="p-3 font-bold">Quantity (Qtl)</th>
                              <th className="p-3 font-bold">Proportional Share %</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200/80">
                            {selectedPool.farmerContributions.map((c, i) => (
                              <tr key={i} className="hover:bg-slate-100/60">
                                <td className="p-3 font-bold text-slate-900">{c.farmerName || 'Farmer Member'}</td>
                                <td className="p-3 text-slate-800 font-bold">{c.quantityQtl} Qtl</td>
                                <td className="p-3 text-emerald-700 font-extrabold">{c.contributionPercent}%</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Summary bar verifying sum = 100% */}
                      <div className="bg-slate-100 p-3 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between text-xs font-bold text-slate-800">
                        <span>Total Pooled Quantity: <strong className="text-emerald-700 font-black">{contributionSummary.totalQty} Qtl</strong></span>
                        <span>Total Share: <strong className="text-emerald-700 font-black">{contributionSummary.totalSharePercent}%</strong></span>
                      </div>
                    </div>
                  )}
                </div>

                {/* STEP 4: Collective Transport Optimization & Cost Split */}
                {transportOpt && (
                  <div className="space-y-4 pt-2">
                    <h5 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                      4. Collective Transport Optimization & Savings
                    </h5>

                    <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                          <div className="text-xs text-slate-600 font-medium">Recommended Collective Vehicle</div>
                          <div className="text-base font-extrabold text-slate-900 flex items-center gap-2 mt-0.5">
                            <Truck className="w-5 h-5 text-emerald-600 shrink-0" />
                            {transportOpt.collective.recommendedVehicle}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-[11px] text-emerald-800 font-bold uppercase tracking-wider">
                            ESTIMATED GROUP SAVINGS
                          </div>
                          <div className="text-2xl font-black text-emerald-700">
                            ₹{transportOpt.totalGroupSavings.toLocaleString('en-IN')}{' '}
                            <span className="text-xs font-bold text-emerald-800">({transportOpt.savingsPercent}% saved)</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-white p-3.5 rounded-xl border border-emerald-200 text-xs shadow-2xs">
                        <div>
                          <div className="text-slate-500 font-medium">Combined Individual Cost</div>
                          <div className="text-slate-900 font-extrabold text-sm mt-0.5">₹{transportOpt.individualCombinedCost.toLocaleString('en-IN')}</div>
                        </div>
                        <div>
                          <div className="text-slate-500 font-medium">Collective Pooled Freight</div>
                          <div className="text-emerald-700 font-black text-sm mt-0.5">₹{transportOpt.collective.totalCollectiveCost.toLocaleString('en-IN')}</div>
                        </div>
                        <div>
                          <div className="text-slate-500 font-medium">Distance Radius</div>
                          <div className="text-slate-800 font-bold text-sm mt-0.5">{transportOpt.distanceKm} km</div>
                        </div>
                      </div>

                      {/* STEP 5: Proportional Transport Cost Split */}
                      {transportOpt.farmerAllocations.length > 0 && (
                        <div className="space-y-2 pt-1">
                          <div className="text-xs font-bold text-slate-800">Proportional Transport Cost Split:</div>
                          <div className="space-y-2">
                            {transportOpt.farmerAllocations.map(fa => (
                              <div key={fa.farmerId} className="flex flex-wrap items-center justify-between bg-white p-3 rounded-xl border border-slate-200 text-xs font-medium gap-2">
                                <div>
                                  <span className="text-slate-900 font-bold">{fa.farmerName}</span>{' '}
                                  <span className="text-slate-500">({fa.quantityQtl} Qtl • {fa.sharePercent}%)</span>
                                </div>
                                <div className="text-right">
                                  <span className="text-slate-700 font-medium">Share: <strong>₹{fa.allocatedCollectiveCost.toLocaleString('en-IN')}</strong></span>{' '}
                                  <span className="text-emerald-700 font-extrabold ml-2 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                    Saved ₹{fa.savings.toLocaleString('en-IN')}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* STEP 6 & 7: Group Market / Buyer Recommendation */}
                {marketRec && (
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                    <div className="flex items-center justify-between">
                      <h5 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                        <Award className="w-4 h-4 text-emerald-600" />
                        5. Group Market / Buyer Recommendation
                      </h5>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      {/* APMC Mandi Option */}
                      <div className={`p-4 rounded-xl border space-y-2 transition-all ${
                        recommendedWinner === 'mandi'
                          ? 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-500/20'
                          : 'bg-white border-slate-200'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 font-bold uppercase text-[10px]">APMC Mandi Option</span>
                          {recommendedWinner === 'mandi' && (
                            <span className="px-2 py-0.5 rounded bg-emerald-600 text-white font-extrabold text-[10px] uppercase">
                              RECOMMENDED
                            </span>
                          )}
                        </div>
                        <div className="font-extrabold text-slate-900 text-sm">{marketRec.bestMandi.mandiName}</div>
                        <div className="space-y-1 text-slate-600 pt-1 border-t border-slate-100 font-medium">
                          <div className="flex justify-between">
                            <span>Estimated Gross:</span>
                            <strong className="text-slate-900">₹{(marketRec.bestMandi.pricePerQtl * selectedPool.totalQuantityQtl).toLocaleString('en-IN')}</strong>
                          </div>
                          <div className="flex justify-between text-rose-600">
                            <span>Freight & Logistics:</span>
                            <span>-₹{(marketRec.bestMandi.transportCost || 2188).toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex justify-between text-emerald-700 font-bold pt-1 border-t border-slate-200">
                            <span>Est. Net Take-Home:</span>
                            <strong className="text-emerald-700 text-sm font-black">
                              ₹{marketRec.bestMandi.estimatedNetRealization.toLocaleString('en-IN')}
                            </strong>
                          </div>
                        </div>
                      </div>

                      {/* Direct Commercial Buyer Option */}
                      <div className={`p-4 rounded-xl border space-y-2 transition-all ${
                        recommendedWinner === 'buyer'
                          ? 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-500/20'
                          : 'bg-white border-slate-200'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 font-bold uppercase text-[10px]">Direct Commercial Buyer</span>
                          {recommendedWinner === 'buyer' && (
                            <span className="px-2 py-0.5 rounded bg-emerald-600 text-white font-extrabold text-[10px] uppercase">
                              RECOMMENDED
                            </span>
                          )}
                        </div>
                        <div className="font-extrabold text-slate-900 text-sm">{marketRec.bestBuyer.businessName}</div>
                        <div className="space-y-1 text-slate-600 pt-1 border-t border-slate-100 font-medium">
                          <div className="flex justify-between">
                            <span>Estimated Gross:</span>
                            <strong className="text-slate-900">₹{(marketRec.bestBuyer.pricePerQtl * selectedPool.totalQuantityQtl).toLocaleString('en-IN')}</strong>
                          </div>
                          <div className="flex justify-between text-emerald-700">
                            <span>Freight & Logistics:</span>
                            <span>₹0 (Buyer Pickup)</span>
                          </div>
                          <div className="flex justify-between text-emerald-700 font-bold pt-1 border-t border-slate-200">
                            <span>Est. Net Take-Home:</span>
                            <strong className="text-emerald-700 text-sm font-black">
                              ₹{marketRec.bestBuyer.estimatedNetRealization.toLocaleString('en-IN')}
                            </strong>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Recommendation Explanation Banner */}
                    <div className="bg-emerald-100/70 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-900 flex items-start gap-2 font-medium">
                      <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                      <div>
                        <strong>Why this recommendation?</strong> "Recommended because this option provides the highest estimated group net take-home after logistics and applicable deductions."
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Pool Modal */}
      {showCreatePoolModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl text-slate-900">
            <h3 className="font-extrabold text-slate-900 text-lg">Create Group Harvest Pool</h3>
            <form onSubmit={handleCreatePool} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 mb-1 font-bold">Crop Name</label>
                <input
                  type="text"
                  value={poolCrop}
                  onChange={e => setPoolCrop(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-bold focus:bg-white focus:border-emerald-600 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-bold">Variety</label>
                <input
                  type="text"
                  value={poolVariety}
                  onChange={e => setPoolVariety(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-bold focus:bg-white focus:border-emerald-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-bold">Grade</label>
                <select
                  value={poolGrade}
                  onChange={e => setPoolGrade(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-bold focus:bg-white focus:border-emerald-600 outline-none"
                >
                  <option value="Grade A">Grade A</option>
                  <option value="Grade B">Grade B</option>
                  <option value="FAQ">FAQ</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreatePoolModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs cursor-pointer"
                >
                  Create Pool
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Contribute Lot Modal */}
      {showContributeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl text-slate-900">
            <h3 className="font-extrabold text-slate-900 text-lg">Contribute Trade Lot to Pool</h3>
            <form onSubmit={handleContribute} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 mb-1 font-bold">Select Your Trade Lot</label>
                {userLots.length === 0 ? (
                  <div className="p-3 text-rose-700 bg-rose-50 rounded-xl border border-rose-200 font-medium">
                    No active trade lots found. Create a lot in "Trade Lots" tab first.
                  </div>
                ) : (
                  <select
                    value={selectedLotId}
                    onChange={e => setSelectedLotId(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-bold focus:bg-white focus:border-emerald-600 outline-none"
                    required
                  >
                    <option value="">-- Select Lot --</option>
                    {userLots.map(l => (
                      <option key={l._id} value={l._id}>
                        {l.lotId}: {l.cropName} ({l.quantityQtl} Qtl, {l.grade})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-bold">Quantity to Contribute (Qtl)</label>
                <input
                  type="number"
                  min="1"
                  value={contribQty}
                  onChange={e => setContribQty(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-bold focus:bg-white focus:border-emerald-600 outline-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowContributeModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs cursor-pointer"
                >
                  Pool Lot Quantity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { History, FileText, CheckCircle2, Filter, Search, ShieldCheck } from 'lucide-react';
import { TransactionItem, fetchUserTransactions } from '../lib/prisms';
import { TransactionSummaryModal } from './TransactionSummaryModal';
import { t } from '../lib/i18n';

export const TransactionHistory: React.FC = () => {
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedTxnId, setSelectedTxnId] = useState<string | null>(null);
  const [filterCrop, setFilterCrop] = useState<string>('');

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    setLoading(true);
    const data = await fetchUserTransactions();
    setTransactions(data);
    setLoading(false);
  };

  const filteredTransactions = transactions.filter(t => {
    if (!filterCrop) return true;
    return t.crop.toLowerCase().includes(filterCrop.toLowerCase());
  });

  const getMilestones = (status: string) => {
    const all = [
      'Lot Created',
      'Buyer Matched',
      'Offer Received',
      'Offer Accepted',
      'Delivery Planned',
      'Dispatched',
      'Delivered',
      'Payment Pending',
      'Payment Completed',
      'Transaction Completed',
    ];

    const currentMap: Record<string, number> = {
      OFFER_ACCEPTED: 4,
      IN_DELIVERY: 6,
      DELIVERED: 7,
      PAYMENT_PENDING: 8,
      COMPLETED: 10,
    };

    const count = currentMap[status] || 4;
    return all.slice(0, count);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Search */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-white">Historical Trade Transactions</h2>
            <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Read-Only Sandbox Records
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Complete milestone timeline and printable realization summary documents for all executed trades.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filterCrop}
              onChange={e => setFilterCrop(e.target.value)}
              placeholder="Filter by crop name..."
              className="pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-emerald-600 focus:bg-white w-52 font-medium"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-600">Loading historical trade transactions...</div>
      ) : filteredTransactions.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 shadow-sm rounded-2xl text-slate-600">
          No trade transactions found. Completed trades and accepted buyer offers will appear here automatically.
        </div>
      ) : (
        <div className="space-y-6">
          {filteredTransactions.map(txn => {
            const milestones = getMilestones(txn.transactionStatus);

            return (
              <div
                key={txn._id}
                className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5"
              >
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-purple-50 text-purple-700 border border-purple-200">
                      <History className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-slate-900">Transaction: {txn.transactionId}</span>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          {txn.transactionStatus}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Crop: <strong className="text-slate-900">{txn.crop} ({txn.grade})</strong> • Quantity: {txn.quantityQtl} Qtl • Agreed Price: ₹{txn.agreedPricePerQtl}/Qtl
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right mr-2">
                      <div className="text-xs text-slate-500 font-medium">Net Realization</div>
                      <div className="text-xl font-bold text-emerald-700">
                        ₹{txn.finalNetAmount.toLocaleString('en-IN')}
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedTxnId(txn.transactionId)}
                      className="px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      <FileText className="w-4 h-4" /> Summary Document
                    </button>
                  </div>
                </div>

                {/* Milestone Timeline */}
                <div>
                  <div className="text-xs font-semibold text-slate-700 mb-2">Transaction Progress Timeline:</div>
                  <div className="flex flex-wrap items-center gap-2">
                    {milestones.map((m, idx) => (
                      <React.Fragment key={m}>
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> {m}
                        </span>
                        {idx < milestones.length - 1 && <span className="text-slate-400 text-xs">→</span>}
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                  <span>Created At: {new Date(txn.createdAt).toLocaleString()}</span>
                  <span>Buyer: {txn.buyer?.businessName || txn.buyerId}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedTxnId && (
        <TransactionSummaryModal
          transactionId={selectedTxnId}
          isOpen={!!selectedTxnId}
          onClose={() => setSelectedTxnId(null)}
        />
      )}
    </div>
  );
};

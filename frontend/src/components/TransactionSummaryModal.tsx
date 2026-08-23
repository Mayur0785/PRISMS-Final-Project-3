import React, { useState, useEffect } from 'react';
import { X, Printer, FileText, CheckCircle, ShieldCheck, Download } from 'lucide-react';
import { fetchTransactionSummaryApi } from '../lib/prisms';

interface TransactionSummaryModalProps {
  transactionId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const TransactionSummaryModal: React.FC<TransactionSummaryModalProps> = ({
  transactionId,
  isOpen,
  onClose,
}) => {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (isOpen && transactionId) {
      loadSummary();
    }
  }, [isOpen, transactionId]);

  const loadSummary = async () => {
    setLoading(true);
    const data = await fetchTransactionSummaryApi(transactionId);
    setSummary(data);
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-900">
        {/* Modal Top Bar */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-slate-900 text-lg">Transaction Summary & Realization Certificate</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors flex items-center gap-1.5 text-xs font-semibold"
            >
              <Printer className="w-4 h-4" /> Print Document
            </button>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Print Printable Sheet */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50 space-y-6 text-slate-900">
          {loading ? (
            <div className="py-12 text-center text-slate-600">Generating transaction summary document...</div>
          ) : !summary ? (
            <div className="py-12 text-center text-rose-600">Failed to load transaction summary document.</div>
          ) : (
            <div className="border border-slate-200 bg-white p-6 rounded-2xl space-y-6 shadow-sm">
              {/* Certificate Header */}
              <div className="border-b border-slate-100 pb-4 text-center">
                <span className="text-xs uppercase tracking-widest text-emerald-700 font-bold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  PRISMS DEMO / SIMULATED TRANSACTION SUMMARY
                </span>
                <h2 className="text-xl font-bold text-slate-900 mt-2">Produce Trade Realization Summary</h2>
                <p className="text-xs text-slate-600 mt-1">Transaction ID: {summary.transactionId} • Date: {new Date(summary.createdAt).toLocaleDateString()}</p>
              </div>

              {/* Trade Details */}
              <div>
                <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">1. Trade Produce & Pricing</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 text-xs">
                  <div><span className="text-slate-500 font-medium">Commodity:</span> <strong className="text-slate-900">{summary.tradeDetails.commodity} ({summary.tradeDetails.variety})</strong></div>
                  <div><span className="text-slate-500 font-medium">Quality Grade:</span> <strong className="text-slate-900">{summary.tradeDetails.grade}</strong></div>
                  <div><span className="text-slate-500 font-medium">Quantity:</span> <strong className="text-slate-900">{summary.tradeDetails.quantityQtl} Qtl</strong></div>
                  <div><span className="text-slate-500 font-medium">Agreed Price:</span> <strong className="text-slate-900">₹{summary.tradeDetails.agreedPricePerQtl}/Qtl</strong></div>
                  <div><span className="text-slate-500 font-medium">Gross Value:</span> <strong className="text-emerald-700">₹{summary.tradeDetails.grossSaleValue.toLocaleString('en-IN')}</strong></div>
                  <div><span className="text-slate-500 font-medium">Status:</span> <strong className="text-blue-700">{summary.status}</strong></div>
                </div>
              </div>

              {/* Deductions Breakdown */}
              <div>
                <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">2. Cost & Logistics Deductions</h4>
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 text-xs space-y-1.5">
                  <div className="flex justify-between"><span>Direct Transport Freight:</span> <span>₹{summary.deductionsBreakdown.transportCost.toLocaleString('en-IN')}</span></div>
                  <div className="flex justify-between"><span>Handling Fee (0.5%):</span> <span>₹{summary.deductionsBreakdown.marketHandlingFee.toLocaleString('en-IN')}</span></div>
                  <div className="flex justify-between"><span>Transit Spoilage Loss (1.5%):</span> <span>₹{summary.deductionsBreakdown.spoilageCost.toLocaleString('en-IN')}</span></div>
                  <div className="flex justify-between border-t border-slate-200 pt-1.5 font-bold text-slate-900">
                    <span>Total Deductions:</span> <span className="text-rose-600">-₹{summary.deductionsBreakdown.totalDeductions.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Net Take Home */}
              <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 flex items-center justify-between">
                <div>
                  <div className="text-xs text-emerald-800 font-bold">FINAL ESTIMATED NET REALIZATION</div>
                  <div className="text-2xl font-bold text-emerald-700">₹{summary.netRealization.toLocaleString('en-IN')}</div>
                </div>
                <div className="text-right text-xs text-slate-600 font-medium">
                  <span>Buyer: {summary.buyer?.businessName}</span><br />
                  <span>District: {summary.buyer?.district}</span>
                </div>
              </div>

              <div className="text-[10px] text-center text-slate-500 border-t border-slate-100 pt-3">
                Notice: This document is a simulated transaction summary generated for PS 26132 decision support demonstration purposes.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

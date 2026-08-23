import React, { useState, useEffect } from 'react';
import { AlertCircle, Plus, CheckCircle2, Clock, ShieldAlert, FileText, Send, X } from 'lucide-react';
import { GrievanceItem, fetchUserGrievances, createGrievanceApi } from '../lib/prisms';
import { t } from '../lib/i18n';

export const GrievanceManager: React.FC = () => {
  const [grievances, setGrievances] = useState<GrievanceItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Form states
  const [category, setCategory] = useState<string>('PRICE_DISPUTE');
  const [priority, setPriority] = useState<string>('MEDIUM');
  const [description, setDescription] = useState<string>('');

  useEffect(() => {
    loadGrievances();
  }, []);

  const loadGrievances = async () => {
    setLoading(true);
    const data = await fetchUserGrievances();
    setGrievances(data);
    setLoading(false);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setStatusMessage('Please enter a description for the grievance.');
      return;
    }

    try {
      setStatusMessage('Submitting grievance ticket...');
      const created = await createGrievanceApi({
        category,
        priority,
        description,
      });
      setStatusMessage(`Grievance ticket ${created.grievanceId} created successfully!`);
      setShowCreateModal(false);
      setDescription('');
      await loadGrievances();
    } catch (err: any) {
      setStatusMessage(`Error: ${err.response?.data?.error?.message || err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-white">Disputes & Grievance Resolution Cell</h2>
            <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Demo Grievance Workflow
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Simulated dispute logging and resolution tracking for trade quality, pricing, delivery, and payment grievances.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Raise Dispute Ticket
        </button>
      </div>

      {statusMessage && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm rounded-xl flex items-center justify-between">
          <span>{statusMessage}</span>
          <button onClick={() => setStatusMessage(null)} className="text-emerald-400 hover:text-white">
            ×
          </button>
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-slate-600">Loading grievance tickets...</div>
      ) : grievances.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 shadow-sm rounded-2xl text-slate-600">
          No active dispute tickets found. Click "Raise Dispute Ticket" to lodge a simulated grievance.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {grievances.map(grv => {
            const isOpen = grv.status === 'OPEN';
            const isResolved = grv.status === 'RESOLVED';

            return (
              <div
                key={grv._id}
                className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200">
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-base">Ticket: {grv.grievanceId}</span>
                        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {grv.category.replace('_', ' ')}
                        </span>
                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200">
                          Priority: {grv.priority}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Assigned To: {grv.assignedTo || 'PRISMS APMC Grievance Cell (Simulated)'}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      isResolved
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : isOpen
                        ? 'bg-amber-50 text-amber-800 border border-amber-200'
                        : 'bg-blue-50 text-blue-800 border border-blue-200'
                    }`}
                  >
                    Status: {grv.status}
                  </span>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-sm text-slate-800">
                  <div className="text-xs text-slate-500 font-semibold mb-1">Description & Issue Details:</div>
                  <p>{grv.description}</p>
                </div>

                {grv.resolutionNote && (
                  <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 text-xs text-emerald-900">
                    <strong className="text-emerald-800 block mb-1">Resolution Note:</strong>
                    {grv.resolutionNote}
                  </div>
                )}

                <div className="text-[11px] text-slate-500 flex justify-between pt-1">
                  <span>Logged Date: {new Date(grv.createdAt).toLocaleString()}</span>
                  <span>Sandbox Dispute Ticket</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Grievance Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-600" /> Raise Dispute Ticket
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Dispute Category</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:bg-white focus:border-emerald-600"
                >
                  <option value="PRICE_DISPUTE">Price & Payment Terms Dispute</option>
                  <option value="QUANTITY_MISMATCH">Quantity Weight Mismatch</option>
                  <option value="QUALITY_DISPUTE">Produce Quality Grade Dispute</option>
                  <option value="DELIVERY_DELAY">Delivery & Logistics Delay</option>
                  <option value="PAYMENT_DELAY">Payment Release Delay</option>
                  <option value="OTHER">Other Trade Dispute</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Priority Level</label>
                <select
                  value={priority}
                  onChange={e => setPriority(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:bg-white focus:border-emerald-600"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Detailed Description</label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Describe the trade issue, weight discrepancy, quality claim, or payment delay..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:bg-white focus:border-emerald-600"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" /> Submit Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

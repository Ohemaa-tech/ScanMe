import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/authApi';
import { useAuthStore } from '../store/authStore';
import {
  UserPlus, Users, CheckCircle2, AlertTriangle,
  Loader2, ShieldCheck, Eye, EyeOff, Power, RefreshCw,
} from 'lucide-react';

const EMPTY_FORM = { username: '', email: '', password: '', fullName: '' };

export default function WorkersPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (user && user.role !== 'Owner') navigate('/scan', { replace: true });
  }, [user, navigate]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [toast, setToast] = useState(null);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchWorkers = async () => {
    setLoading(true);
    try {
      const data = await authApi.getWorkers();
      setWorkers(Array.isArray(data) ? data : []);
    } catch (err) {
      showToast('Failed to load worker accounts', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'Owner') {
      fetchWorkers();
    }
  }, [user]);

  const handleCreateWorker = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      await authApi.registerWorker(formData);
      setIsModalOpen(false);
      setFormData(EMPTY_FORM);
      showToast(`Worker "${formData.username}" created successfully`);
      fetchWorkers();
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.title ||
        'Failed to create worker account';
      setFormError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (workerId, currentStatus, username) => {
    setTogglingId(workerId);
    try {
      const updated = await authApi.toggleWorkerStatus(workerId);
      setWorkers((prev) =>
        prev.map((w) => (w.id === workerId ? { ...w, isActive: updated.isActive } : w))
      );
      showToast(`Worker "${username}" is now ${updated.isActive ? 'Active' : 'Inactive'}`);
    } catch (err) {
      showToast('Failed to update worker status', 'error');
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="space-y-5 text-slate-900">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-2xl ${toast.type === 'error' ? 'bg-red-600' : 'bg-slate-900'}`}>
          {toast.type === 'error' ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5" /> Worker Accounts
          </h2>
          <p className="text-xs text-slate-500">Manage your store's cashier and worker logins</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchWorkers}
            className="flex items-center gap-1.5 text-xs font-semibold border border-neutral-200 px-3 py-2.5 rounded-xl hover:bg-neutral-100 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
          <button
            onClick={() => { setIsModalOpen(true); setFormData(EMPTY_FORM); setFormError(null); }}
            className="flex items-center gap-2 bg-black hover:bg-neutral-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md transition-all"
          >
            <UserPlus className="w-4 h-4" /> Add Worker
          </button>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-bold text-slate-700">Worker Account Permissions</p>
          <p className="text-xs text-slate-500 mt-0.5">
            Workers can: scan barcodes, manage cart, complete sales, view inventory and alerts.
            Workers cannot: manage products, restock inventory, view analytics, or create other accounts.
          </p>
        </div>
      </div>

      {/* Created Workers List */}
      {loading ? (
        <div className="flex items-center justify-center py-20 gap-3 text-neutral-400">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-sm">Loading worker accounts...</span>
        </div>
      ) : workers.length > 0 ? (
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden">
          <div className="px-5 py-3 border-b border-neutral-100 bg-neutral-50 flex items-center justify-between">
            <h3 className="text-xs font-bold text-neutral-600 uppercase tracking-wider">Registered Workers ({workers.length})</h3>
          </div>
          <div className="divide-y divide-neutral-100">
            {workers.map((w) => (
              <div key={w.id} className="flex items-center justify-between px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 text-white rounded-xl flex items-center justify-center font-extrabold text-sm ${w.isActive ? 'bg-black' : 'bg-neutral-400'}`}>
                    {(w.fullName || w.username || 'W')[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-sm text-slate-900">{w.fullName || w.username}</p>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${w.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-100 text-neutral-500'}`}>
                        {w.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-400">@{w.username} · {w.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleStatus(w.id, w.isActive, w.username)}
                    disabled={togglingId === w.id}
                    className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border transition-colors ${
                      w.isActive
                        ? 'border-amber-200 text-amber-700 hover:bg-amber-50'
                        : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                    }`}
                  >
                    {togglingId === w.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        <Power className="w-3 h-3" />
                        {w.isActive ? 'Deactivate' : 'Activate'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-20 text-neutral-400">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">No workers registered yet</p>
          <p className="text-xs mt-1">Click "Add Worker" to create a cashier account</p>
        </div>
      )}

      {/* Create Worker Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-neutral-200">
              <h3 className="text-base font-extrabold text-slate-900">Create Worker Account</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-xl hover:bg-neutral-100 text-neutral-500">✕</button>
            </div>

            <form onSubmit={handleCreateWorker} className="p-6 space-y-4">
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-2.5 rounded-xl flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" /> {formError}
                </div>
              )}

              {[
                { label: 'Full Name', key: 'fullName', type: 'text', placeholder: 'e.g. Kwame Mensah', required: true },
                { label: 'Username', key: 'username', type: 'text', placeholder: 'e.g. kwame_cashier', required: true },
                { label: 'Email Address', key: 'email', type: 'email', placeholder: 'worker@shop.com', required: true },
              ].map(({ label, key, type, placeholder, required }) => (
                <div key={key}>
                  <label className="text-xs font-semibold text-neutral-700 block mb-1.5">{label}</label>
                  <input
                    type={type}
                    required={required}
                    value={formData[key]}
                    onChange={(e) => setFormData((prev) => ({ ...prev, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-black transition-all"
                  />
                </div>
              ))}

              <div>
                <label className="text-xs font-semibold text-neutral-700 block mb-1.5">Password (min 6 chars)</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={formData.password}
                    onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                    placeholder="Minimum 6 characters"
                    className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 pr-10 text-sm focus:outline-none focus:border-black transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 border border-neutral-200 text-sm font-bold py-3 rounded-2xl hover:bg-neutral-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-black hover:bg-neutral-800 text-white text-sm font-bold py-3 rounded-2xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</>
                    : <><UserPlus className="w-4 h-4" /> Create Worker</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


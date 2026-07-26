import React, { useState, useEffect, useCallback } from 'react';
import { alertsApi } from '../api/alertsApi';
import {
  AlertCircle, AlertTriangle, CheckCircle2, Check,
  RotateCw, Bell, Loader2,
} from 'lucide-react';

const POLL_INTERVAL = 30000; // 30 seconds

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchAlerts = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await alertsApi.getAlerts();
      setAlerts(Array.isArray(data) ? data : []);
    } catch {
      if (!silent) showToast('Failed to load alerts', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
    // 30s polling
    const interval = setInterval(() => fetchAlerts(true), POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  const handleMarkRead = async (id) => {
    try {
      await alertsApi.markRead(id);
      setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, isRead: true } : a));
      showToast('Alert marked as read');
    } catch {
      showToast('Failed to mark alert', 'error');
    }
  };

  const handleMarkAllRead = async () => {
    const unread = alerts.filter((a) => !a.isRead);
    try {
      await Promise.all(unread.map((a) => alertsApi.markRead(a.id)));
      setAlerts((prev) => prev.map((a) => ({ ...a, isRead: true })));
      showToast(`Marked ${unread.length} alerts as read`);
    } catch {
      showToast('Failed to mark all read', 'error');
    }
  };

  const filtered = alerts.filter((a) => {
    if (filter === 'unread') return !a.isRead;
    if (filter === 'read') return a.isRead;
    return true;
  });

  const unreadCount = alerts.filter((a) => !a.isRead).length;

  const severityStyle = (alert) => {
    if (alert.isRead) return 'border-neutral-200 bg-white opacity-60';
    if (alert.alertType === 'OutOfStock') return 'border-red-200 bg-red-50';
    return 'border-amber-200 bg-amber-50';
  };

  const alertIcon = (alert) => {
    if (alert.alertType === 'OutOfStock') return <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />;
    return <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />;
  };

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
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
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Bell className="w-5 h-5" /> Alerts
            </h2>
            <p className="text-xs text-slate-500">
              {unreadCount > 0 ? `${unreadCount} unread alert${unreadCount > 1 ? 's' : ''}` : 'All caught up'}
              {' '}· Auto-refreshes every 30s
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button onClick={handleMarkAllRead} className="text-xs font-bold text-neutral-600 border border-neutral-200 px-3 py-2 rounded-xl hover:bg-neutral-100 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" /> Mark All Read
            </button>
          )}
          <button onClick={() => fetchAlerts()} className="text-xs font-semibold border border-neutral-200 px-3 py-2 rounded-xl hover:bg-neutral-100 flex items-center gap-1.5">
            <RotateCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {[
          { value: 'all', label: `All (${alerts.length})` },
          { value: 'unread', label: `Unread (${unreadCount})` },
          { value: 'read', label: `Read (${alerts.length - unreadCount})` },
        ].map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              filter === value ? 'bg-black text-white' : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Alert List */}
      {loading ? (
        <div className="flex items-center justify-center py-20 gap-3 text-neutral-400">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-sm">Loading alerts...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-neutral-400">
          <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">No alerts to show</p>
          <p className="text-xs mt-1">Low-stock alerts will appear here automatically</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((alert) => (
            <div
              key={alert.id}
              className={`rounded-2xl border p-4 flex items-start justify-between gap-4 transition-all ${severityStyle(alert)}`}
            >
              <div className="flex items-start gap-3">
                {alertIcon(alert)}
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      alert.alertType === 'OutOfStock' ? 'bg-red-200 text-red-800' : 'bg-amber-200 text-amber-800'
                    }`}>
                      {alert.alertType === 'OutOfStock' ? 'Out of Stock' : 'Low Stock'}
                    </span>
                    {!alert.isRead && (
                      <span className="w-2 h-2 bg-black rounded-full inline-block" title="Unread" />
                    )}
                  </div>
                  <p className="font-bold text-sm text-slate-900 mt-1">{alert.productName}</p>
                  <p className="text-xs text-slate-600 mt-0.5">{alert.message}</p>
                  <p className="text-[11px] text-neutral-400 mt-1">{timeAgo(alert.createdAt)}</p>
                </div>
              </div>
              {!alert.isRead && (
                <button
                  onClick={() => handleMarkRead(alert.id)}
                  className="shrink-0 inline-flex items-center gap-1.5 text-[11px] font-bold border border-neutral-300 bg-white px-3 py-1.5 rounded-xl hover:bg-neutral-100 transition-colors"
                >
                  <Check className="w-3 h-3" /> Mark Read
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

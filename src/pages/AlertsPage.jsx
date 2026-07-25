import React, { useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Check,
  RotateCw,
  MoreVertical,
  Sliders,
  Box,
} from 'lucide-react';

const INITIAL_ALERTS = [
  {
    id: 1,
    productName: 'Artisan Coffee Beans (Dark Roast - 1kg)',
    sku: 'PRD-CFB-001',
    currentQty: 0,
    threshold: 15,
    severity: 'critical',
    timeAgo: '5 mins ago',
    isRead: false,
  },
  {
    id: 2,
    productName: 'Organic Soy Milk (12pk Case)',
    sku: 'PRD-SOY-002',
    currentQty: 4,
    threshold: 10,
    severity: 'warning',
    timeAgo: '2 hours ago',
    isRead: false,
  },
  {
    id: 3,
    productName: 'Paper Takeout Bags (Small - 500ct)',
    sku: 'PRD-[#BAG-003]',
    currentQty: 0,
    threshold: 50,
    severity: 'critical',
    timeAgo: '4 hours ago',
    isRead: false,
  },
  {
    id: 4,
    productName: 'Biodegradable Straws (Box of 1000)',
    sku: 'PRD-STR-004',
    currentQty: 215,
    threshold: 200,
    severity: 'read',
    timeAgo: 'Yesterday',
    isRead: true,
    statusText: 'Awaiting delivery',
  },
];

export default function AlertsPage() {
  const [alerts, setAlerts] = useState(INITIAL_ALERTS);
  const [activeTab, setActiveTab] = useState('all'); // all, unread, critical
  const [toastMessage, setToastMessage] = useState(null);

  const handleMarkAsRead = (id) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, isRead: true } : a))
    );
    showToast('Alert marked as read');
  };

  const handleMarkAllRead = () => {
    setAlerts((prev) => prev.map((a) => ({ ...a, isRead: true })));
    showToast('All alerts marked as read');
  };

  const handleRestock = (productName) => {
    showToast(`Restock order initiated for ${productName}`);
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const filteredAlerts = alerts.filter((a) => {
    if (activeTab === 'unread') return !a.isRead;
    if (activeTab === 'critical') return a.severity === 'critical';
    return true;
  });

  const unreadCount = alerts.filter((a) => !a.isRead).length;
  const criticalCount = alerts.filter((a) => a.severity === 'critical').length;

  return (
    <div className="space-y-6 pb-28 text-slate-900">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 animate-bounce">
          <div className="bg-slate-900 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-2xl border border-neutral-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Top Header Row & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">Inventory Alerts</h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Manage low stock notifications and critical product shortages.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleMarkAllRead}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-neutral-300 bg-white text-slate-800 hover:bg-slate-50 font-bold text-xs shadow-xs transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Mark All Read</span>
          </button>

          <button
            onClick={() => showToast('Refreshed stock alert logs')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-colors"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs Header Bar */}
      <div className="border-b border-neutral-200 flex items-center gap-6 text-xs font-bold">
        <button
          onClick={() => setActiveTab('all')}
          className={`py-3 relative flex items-center gap-2 transition-colors ${
            activeTab === 'all'
              ? 'text-slate-900 border-b-2 border-slate-900'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <span>All Alerts ({alerts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('unread')}
          className={`py-3 relative flex items-center gap-2 transition-colors ${
            activeTab === 'unread'
              ? 'text-slate-900 border-b-2 border-slate-900'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <span>Unread ({unreadCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('critical')}
          className={`py-3 relative flex items-center gap-2 transition-colors ${
            activeTab === 'critical'
              ? 'text-red-600 border-b-2 border-red-600'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <span>Critical</span>
          <span className="w-4 h-4 rounded-full bg-red-600 text-white text-[10px] font-extrabold flex items-center justify-center">
            {criticalCount}
          </span>
        </button>
      </div>

      {/* Alerts List Container */}
      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 border border-neutral-200 text-center shadow-xs space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <h4 className="font-bold text-base text-slate-900">No alerts found</h4>
            <p className="text-xs text-slate-500">All inventory items are operating within healthy thresholds.</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`bg-white rounded-2xl p-4 sm:p-5 border border-neutral-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all ${
                alert.severity === 'critical'
                  ? 'border-l-4 border-l-red-600'
                  : alert.severity === 'warning'
                  ? 'border-l-4 border-l-amber-500'
                  : 'bg-slate-50/70 border-l-4 border-l-slate-300'
              }`}
            >
              {/* Left Side: Icon, Badge & Details */}
              <div className="flex items-start gap-4 flex-1 min-w-0">
                {/* Status Icon Badge */}
                <div className="mt-0.5">
                  {alert.severity === 'critical' && (
                    <div className="w-10 h-10 rounded-full bg-red-100 border border-red-200 text-red-600 flex items-center justify-center shrink-0 shadow-xs">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    </div>
                  )}
                  {alert.severity === 'warning' && (
                    <div className="w-10 h-10 rounded-full bg-amber-100 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0 shadow-xs">
                      <AlertTriangle className="w-5 h-5 text-amber-700" />
                    </div>
                  )}
                  {alert.severity === 'read' && (
                    <div className="w-10 h-10 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0 shadow-xs">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {alert.severity === 'critical' && (
                      <span className="bg-red-600 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider">
                        CRITICAL
                      </span>
                    )}
                    {alert.severity === 'warning' && (
                      <span className="bg-amber-500 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider">
                        WARNING
                      </span>
                    )}
                    {alert.severity === 'read' && (
                      <span className="bg-slate-100 text-slate-600 border border-slate-200 text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                        READ
                      </span>
                    )}
                    <span className="text-[11px] text-slate-400 font-medium">
                      {alert.timeAgo}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900 leading-snug truncate">
                    {alert.productName}
                  </h3>

                  <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-600 pt-0.5">
                    <span className="flex items-center gap-1 font-bold text-slate-900">
                      <Box className="w-3.5 h-3.5 text-slate-400" />
                      Current:{' '}
                      <strong
                        className={`font-extrabold ${
                          alert.currentQty === 0
                            ? 'text-red-600'
                            : alert.currentQty <= alert.threshold
                            ? 'text-amber-600'
                            : 'text-slate-900'
                        }`}
                      >
                        {alert.currentQty} units
                      </strong>
                    </span>
                    <span className="flex items-center gap-1 text-slate-500">
                      <Sliders className="w-3.5 h-3.5 text-slate-400" />
                      Threshold: {alert.threshold} units
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Side: Actions or Status */}
              <div className="flex items-center gap-3 self-end sm:self-center shrink-0 pt-2 sm:pt-0">
                {!alert.isRead && (
                  <button
                    onClick={() => handleMarkAsRead(alert.id)}
                    className="text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors px-2 py-1"
                  >
                    Mark as Read
                  </button>
                )}

                {alert.severity === 'critical' && (
                  <button
                    onClick={() => handleRestock(alert.productName)}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs px-4 py-2 rounded-xl shadow-md transition-colors"
                  >
                    Restock Now
                  </button>
                )}

                {alert.severity === 'warning' && (
                  <button
                    onClick={() => showToast(`Edit threshold for ${alert.productName}`)}
                    className="bg-white border border-neutral-300 text-slate-800 hover:bg-slate-100 font-bold text-xs px-4 py-2 rounded-xl shadow-xs transition-colors"
                  >
                    Edit Threshold
                  </button>
                )}

                {alert.statusText && (
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                    <span>{alert.statusText}</span>
                    <button className="text-slate-400 hover:text-slate-800 p-1">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

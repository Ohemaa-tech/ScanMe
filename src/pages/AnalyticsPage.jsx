import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../utils/formatCurrency';
import { analyticsApi } from '../api/analyticsApi';
import { useAuthStore } from '../store/authStore';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
} from 'recharts';
import {
  TrendingUp, ShoppingBag, DollarSign, Lightbulb,
  ArrowUpRight, PackageX, Loader2, AlertCircle, RefreshCw,
} from 'lucide-react';

export default function AnalyticsPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  // Redirect workers
  useEffect(() => {
    if (user && user.role !== 'Owner') navigate('/scan', { replace: true });
  }, [user, navigate]);

  const [overview, setOverview] = useState(null);
  const [topSellers, setTopSellers] = useState([]);
  const [slowMovers, setSlowMovers] = useState([]);
  const [revenueTrend, setRevenueTrend] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('daily');

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [ov, ts, sm, rt, recs] = await Promise.all([
        analyticsApi.getOverview(),
        analyticsApi.getTopSellers({ count: 5 }),
        analyticsApi.getSlowMovers({ count: 5 }),
        analyticsApi.getRevenueTrends({ period }),
        analyticsApi.getRecommendations(),
      ]);
      setOverview(ov);
      setTopSellers(Array.isArray(ts) ? ts : []);
      setSlowMovers(Array.isArray(sm) ? sm : []);
      setRevenueTrend(Array.isArray(rt) ? rt : []);
      setRecommendations(Array.isArray(recs) ? recs : []);
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (user?.role === 'Owner') fetchAll(); }, [period]);

  const maxRevenue = Math.max(...revenueTrend.map((d) => d.revenue), 1);

  const recPriorityColor = (priority) => {
    if (priority === 'High') return 'border-red-200 bg-red-50 text-red-800';
    if (priority === 'Low') return 'border-emerald-200 bg-emerald-50 text-emerald-800';
    return 'border-amber-200 bg-amber-50 text-amber-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 gap-3 text-neutral-400">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span>Loading analytics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4 text-neutral-500">
        <AlertCircle className="w-12 h-12 text-red-400" />
        <p className="text-sm font-medium">{error}</p>
        <button onClick={fetchAll} className="text-xs font-bold bg-black text-white px-4 py-2.5 rounded-xl hover:bg-neutral-800">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Analytics Dashboard</h2>
          <p className="text-xs text-slate-500">Owner-only business intelligence</p>
        </div>
        <button onClick={fetchAll} className="flex items-center gap-2 text-xs font-semibold border border-neutral-200 px-3 py-2 rounded-xl hover:bg-neutral-100 transition-colors">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Overview Cards */}
      {overview && (
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4">
          {[
            { label: 'Total Revenue', value: formatCurrency(overview.totalRevenue), icon: <DollarSign className="w-5 h-5 text-emerald-500" />, bg: 'bg-emerald-50 border-emerald-200' },
            { label: 'Total Sales', value: overview.totalSalesCount.toLocaleString(), icon: <ShoppingBag className="w-5 h-5 text-blue-500" />, bg: 'bg-blue-50 border-blue-200' },
            { label: 'Active Products', value: overview.totalActiveProducts, icon: <TrendingUp className="w-5 h-5 text-purple-500" />, bg: 'bg-purple-50 border-purple-200' },
            { label: 'Low Stock', value: overview.lowStockCount, icon: <ArrowUpRight className="w-5 h-5 text-amber-500" />, bg: 'bg-amber-50 border-amber-200' },
            { label: 'Out of Stock', value: overview.outOfStockCount, icon: <PackageX className="w-5 h-5 text-red-500" />, bg: 'bg-red-50 border-red-200' },
          ].map(({ label, value, icon, bg }) => (
            <div key={label} className={`rounded-2xl border p-4 ${bg}`}>
              <div className="flex items-center justify-between mb-2">{icon}</div>
              <div className="text-xl font-extrabold text-slate-900">{value}</div>
              <div className="text-[11px] font-semibold text-neutral-500 mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Revenue Trend Chart */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h3 className="text-sm font-bold text-slate-900">Revenue Trend</h3>
          <div className="flex gap-2">
            {['daily', 'weekly', 'monthly'].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all capitalize ${period === p ? 'bg-black text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
        {revenueTrend.length === 0 ? (
          <div className="text-center py-12 text-neutral-400 text-sm">No sales data for this period</div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={revenueTrend.map((d) => ({ label: d.periodLabel, revenue: d.revenue, count: d.transactionCount }))}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#000000" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#000000" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(1)}k`} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '12px' }}
                formatter={(v) => [formatCurrency(v), 'Revenue']}
                labelStyle={{ fontWeight: 'bold', color: '#111' }}
              />
              <Area type="monotone" dataKey="revenue" stroke="#000000" strokeWidth={2} fill="url(#revenueGradient)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Sellers */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" /> Top Sellers
          </h3>
          {topSellers.length === 0 ? (
            <p className="text-xs text-neutral-400 text-center py-8">No sales data yet</p>
          ) : (
            <div className="space-y-3">
              {topSellers.map((item, idx) => {
                const pct = (item.totalRevenue / (topSellers[0]?.totalRevenue || 1)) * 100;
                return (
                  <div key={item.productId} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800 truncate max-w-[70%]">
                        <span className="text-neutral-400 mr-1.5">#{idx + 1}</span>{item.productName}
                      </span>
                      <span className="font-extrabold font-mono text-slate-900">{formatCurrency(item.totalRevenue)}</span>
                    </div>
                    <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                      <div className="h-full bg-black rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-[10px] text-neutral-400">{item.totalQuantitySold} units sold · {item.category}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Slow Movers */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <PackageX className="w-4 h-4 text-amber-500" /> Slow Movers
          </h3>
          {slowMovers.length === 0 ? (
            <p className="text-xs text-neutral-400 text-center py-8">No slow movers detected</p>
          ) : (
            <div className="space-y-3">
              {slowMovers.map((item) => (
                <div key={item.productId} className="flex items-center justify-between p-3 rounded-xl bg-amber-50 border border-amber-100">
                  <div>
                    <p className="font-semibold text-sm text-slate-900">{item.productName}</p>
                    <p className="text-[11px] text-neutral-500">
                      {item.currentStock} in stock · {item.daysStagnant}d stagnant
                      {item.lastSaleDate && ` · Last sold ${new Date(item.lastSaleDate).toLocaleDateString()}`}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full">{item.category}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* AI Recommendations */}
      {recommendations.length > 0 && (
        <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-yellow-500" /> AI Recommendations
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {recommendations.map((rec) => (
              <div key={rec.id} className={`rounded-xl border p-4 space-y-1 ${recPriorityColor(rec.priority)}`}>
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${recPriorityColor(rec.priority)}`}>
                    {rec.priority}
                  </span>
                  <span className="text-[10px] font-semibold opacity-70">{rec.type}</span>
                </div>
                <p className="text-sm font-bold">{rec.title}</p>
                {rec.productName && <p className="text-xs opacity-80">{rec.productName}</p>}
                <p className="text-xs opacity-70">{rec.message}</p>
                {rec.suggestedAction && (
                  <p className="text-[11px] font-semibold opacity-90 italic">→ {rec.suggestedAction}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

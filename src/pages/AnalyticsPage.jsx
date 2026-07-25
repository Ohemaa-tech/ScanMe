import React, { useState } from 'react';
import { formatCurrency } from '../utils/formatCurrency';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import {
  TrendingUp,
  ShoppingBag,
  DollarSign,
  Lightbulb,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  FileText,
  AlertOctagon,
  PackageX,
} from 'lucide-react';

// Sample chart data for Weekly/Monthly Sales Trend
const SALES_TREND_DATA = [
  { day: 'Mon', current: 4200, previous: 3800 },
  { day: 'Tue', current: 4800, previous: 4100 },
  { day: 'Wed', current: 3900, previous: 3700 },
  { day: 'Thu', current: 5400, previous: 4900 },
  { day: 'Fri', current: 7200, previous: 6100 },
  { day: 'Sat', current: 9100, previous: 8200 },
  { day: 'Sun', current: 8310, previous: 7400 },
];

const BEST_SELLERS = [
  { name: 'Premium Arabica Coffee (240g)', sales: 652, pct: 100 },
  { name: 'Artisan Sourdough Loaf', sales: 384, pct: 60 },
  { name: 'Green Matcha Latte Powder', sales: 295, pct: 45 },
  { name: 'Himalayan Sea Salt Caramel', sales: 188, pct: 30 },
  { name: 'Sparkling Water (Pack of 6)', sales: 120, pct: 20 },
];

const SLOW_MOVERS = [
  { item: 'Canned Artichokes', stock: 42, lastSale: '24d ago' },
  { item: 'Frozen Acai Pulp', stock: 12, lastSale: '18d ago' },
  { item: 'Truffle Infused Oil', stock: 5, lastSale: '32d ago' },
  { item: 'Rye Crispbread', stock: 19, lastSale: '41d ago' },
  { item: 'Elderflower Syrup', stock: 8, lastSale: '62d ago' },
];

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('week'); // today, week, month, custom
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="space-y-6 pb-28 text-slate-900">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 animate-bounce">
          <div className="bg-slate-900 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-2xl border border-neutral-800 flex items-center gap-2">
            <FileText className="w-4 h-4 text-white" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Top Header Row & Time Range Selection */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">Business Intelligence</h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Real-time performance metrics for Store #1042
          </p>
        </div>

        {/* Time Range Pills */}
        <div className="flex items-center bg-white border border-neutral-200 p-1 rounded-xl shadow-xs self-start sm:self-auto text-xs font-bold">
          {['today', 'week', 'month'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1.5 rounded-lg capitalize transition-all ${
                timeRange === range
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {range}
            </button>
          ))}
          <button
            onClick={() => showToast('Custom date picker opened')}
            className="flex items-center gap-1 px-3 py-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all"
          >
            <span>Custom</span>
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
          </button>
        </div>
      </div>

      {/* Top Summary KPI Cards Row (3 Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Total Sales */}
        <div className="bg-white rounded-2xl p-5 border border-neutral-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-900 flex items-center justify-center font-bold">
              <DollarSign className="w-5 h-5 text-slate-900" />
            </div>
            <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-slate-900 bg-neutral-100 border border-neutral-200 px-2.5 py-0.5 rounded-full">
              <ArrowUpRight className="w-3 h-3 text-slate-900" />
              +12.4% vs LW
            </span>
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              TOTAL SALES
            </span>
            <span className="text-2xl font-extrabold text-slate-900 font-mono">
              {formatCurrency(42910.00)}
            </span>
          </div>
        </div>

        {/* Card 2: Total Orders */}
        <div className="bg-white rounded-2xl p-5 border border-neutral-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-900 flex items-center justify-center font-bold">
              <ShoppingBag className="w-5 h-5 text-slate-900" />
            </div>
            <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-slate-600 bg-neutral-100 border border-neutral-200 px-2.5 py-0.5 rounded-full">
              <ArrowDownRight className="w-3 h-3 text-slate-500" />
              -2.1% vs LW
            </span>
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              TOTAL ORDERS
            </span>
            <span className="text-2xl font-extrabold text-slate-900 font-mono">
              1,284
            </span>
          </div>
        </div>

        {/* Card 3: Average Order Value */}
        <div className="bg-white rounded-2xl p-5 border border-neutral-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-900 flex items-center justify-center font-bold">
              <TrendingUp className="w-5 h-5 text-slate-900" />
            </div>
            <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-slate-900 bg-neutral-100 border border-neutral-200 px-2.5 py-0.5 rounded-full">
              <ArrowUpRight className="w-3 h-3 text-slate-900" />
              +4.8% vs LW
            </span>
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              AVERAGE ORDER VALUE
            </span>
            <span className="text-2xl font-extrabold text-slate-900 font-mono">
              {formatCurrency(33.42)}
            </span>
          </div>
        </div>
      </div>

      {/* Middle Grid: Sales Trend Line Chart (Left) & Intelligence Insights (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        
        {/* Left 2 Columns: Monthly Sales Trend Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 sm:p-6 border border-neutral-200 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h3 className="text-base font-bold text-slate-900">Monthly Sales Trend</h3>
            
            {/* Chart Legend */}
            <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-slate-900 inline-block" />
                <span>Current Period</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-slate-300 inline-block" />
                <span>Previous Period</span>
              </div>
            </div>
          </div>

          {/* Recharts Line/Area Chart */}
          <div className="w-full h-64 sm:h-72 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={SALES_TREND_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0F172A" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#0F172A" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `GH₵${v}`} />
                <Tooltip
                  formatter={(value) => [formatCurrency(value), 'Sales']}
                  contentStyle={{ backgroundColor: '#0F172A', borderRadius: '12px', border: 'none', color: '#FFFFFF', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="previous" stroke="#CBD5E1" strokeWidth={2} strokeDasharray="4 4" fill="none" />
                <Area type="monotone" dataKey="current" stroke="#0F172A" strokeWidth={3} fillOpacity={1} fill="url(#colorCurrent)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right 1 Column: Intelligence Insights Card */}
        <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl space-y-5 flex flex-col justify-between border border-slate-800">
          <div className="space-y-4">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-white" />
              <span>Intelligence Insights</span>
            </h3>

            {/* Insight 1: Peak Hour Alert */}
            <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700 space-y-1.5 text-xs">
              <span className="font-bold text-white uppercase tracking-wider text-[10px] block">
                Peak Hour Alert
              </span>
              <p className="text-slate-300 leading-relaxed">
                Traffic usually spikes between <strong>12:30–14:00</strong>. Recommend staffing 2 extra terminals minimum.
              </p>
            </div>

            {/* Insight 2: Bundle Opportunity */}
            <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700 space-y-1.5 text-xs">
              <span className="font-bold text-white uppercase tracking-wider text-[10px] block">
                Bundle Opportunity
              </span>
              <p className="text-slate-300 leading-relaxed">
                Customers frequently buy <strong>Organic Coffee</strong> with <strong>Butter Croissants</strong>. Consider a breakfast combo deal.
              </p>
            </div>
          </div>

          {/* View Full Report Button */}
          <button
            onClick={() => showToast('Full AI Intelligence Report exported')}
            className="w-full bg-white hover:bg-neutral-200 text-black font-extrabold py-3 px-4 rounded-xl text-xs shadow-md transition-colors"
          >
            View Full Report
          </button>
        </div>

      </div>

      {/* Bottom Section: Top 10 Best Sellers (Left) & Slow Movers (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left 2 Columns: Top 10 Best Sellers */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 sm:p-6 border border-neutral-200 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900">Top 10 Best Sellers</h3>

          <div className="space-y-3.5 pt-1">
            {BEST_SELLERS.map((item, idx) => (
              <div key={idx} className="space-y-1 text-xs">
                <div className="flex justify-between font-semibold text-slate-800">
                  <span className="truncate">{item.name}</span>
                  <span className="font-mono font-bold text-slate-900 shrink-0">{item.sales} sold</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-slate-900 h-full rounded-full transition-all duration-500"
                    style={{ width: `${item.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 1 Column: Slow Movers Table */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-neutral-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">Slow Movers</h3>
            <PackageX className="w-4 h-4 text-slate-400" />
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="grid grid-cols-3 font-bold uppercase tracking-wider text-[10px] text-slate-400 pb-1 border-b border-slate-100">
              <span className="col-span-1">ITEM</span>
              <span className="text-center">IN STOCK</span>
              <span className="text-right">LAST SALE</span>
            </div>

            {SLOW_MOVERS.map((row, idx) => (
              <div key={idx} className="grid grid-cols-3 items-center py-1.5 border-b border-slate-50">
                <span className="font-semibold text-slate-800 truncate pr-1">{row.item}</span>
                <span className="text-center font-mono font-bold text-slate-900">{row.stock}</span>
                <span className="text-right font-mono text-slate-500">{row.lastSale}</span>
              </div>
            ))}
          </div>

          <button
            onClick={() => showToast('Clearance discount module opened')}
            className="w-full mt-2 py-2.5 px-3 rounded-xl border border-neutral-300 text-slate-800 hover:bg-slate-50 font-bold text-xs flex items-center justify-center gap-1 transition-colors"
          >
            <span>Manage Clearance &gt;</span>
          </button>
        </div>

      </div>
    </div>
  );
}

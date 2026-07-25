import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Scan,
  ShoppingCart,
  Package,
  Bell,
  BarChart3,
  Boxes,
  Store,
} from 'lucide-react';
import { useCartStore } from '../store/cartStore';

export default function Navbar() {
  const location = useLocation();
  const itemCount = useCartStore((state) => state.getItemCount());
  // Placeholder active alert badge count
  const unreadAlertCount = 2;

  const NAV_ITEMS = [
    { label: 'Scan', path: '/scan', icon: Scan },
    { label: 'Checkout', path: '/checkout', icon: ShoppingCart, badge: itemCount },
    { label: 'Inventory', path: '/inventory', icon: Package },
    { label: 'Alerts', path: '/alerts', icon: Bell, alertBadge: unreadAlertCount },
    { label: 'Analytics', path: '/analytics', icon: BarChart3 },
    { label: 'Products', path: '/products', icon: Boxes },
  ];

  return (
    <>
      {/* DESKTOP LEFT SIDEBAR (lg:flex) */}
      <aside className="hidden lg:flex flex-col w-64 bg-slate-900 border-r border-slate-800 text-slate-300 min-h-screen fixed left-0 top-0 z-30">
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center gap-3 border-b border-slate-800 bg-slate-950/50">
          <div className="w-9 h-9 rounded-xl bg-black flex items-center justify-center text-white shadow-md">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-base text-white tracking-tight leading-none">SmartScan POS</h1>
            <span className="text-[10px] text-neutral-400 font-medium tracking-wider uppercase">Retail Terminal v1.0</span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-white text-black font-bold shadow-md'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5 shrink-0" />
                  <span>{item.label}</span>
                </div>
                {item.badge > 0 && (
                  <span className="bg-white text-black font-bold text-xs px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
                {item.alertBadge > 0 && !item.badge && (
                  <span className="bg-red-500 text-white font-bold text-xs px-2 py-0.5 rounded-full animate-pulse">
                    {item.alertBadge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer Info */}
        <div className="p-4 border-t border-slate-800 text-xs text-slate-500 flex items-center justify-between">
          <span>Status: Online</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        </div>
      </aside>

      {/* MOBILE BOTTOM NAVIGATION BAR (lg:hidden) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 z-40 text-slate-400 px-2 py-1.5 flex items-center justify-around shadow-2xl">
        {NAV_ITEMS.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl text-[11px] font-medium transition-all relative ${
                  isActive ? 'text-white font-bold' : 'hover:text-slate-200'
                }`
              }
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-emerald-500 text-slate-950 font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
                {item.alertBadge > 0 && !item.badge && (
                  <span className="absolute -top-1 -right-1 bg-red-500 w-2.5 h-2.5 rounded-full border-2 border-slate-900 animate-pulse" />
                )}
              </div>
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </>
  );
}

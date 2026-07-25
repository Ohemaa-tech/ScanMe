import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Scan,
  ShoppingCart,
  Package,
  Bell,
  BarChart3,
  Boxes,
  HelpCircle,
  LogOut,
} from 'lucide-react';
import { useCartStore } from '../store/cartStore';

export default function Sidebar() {
  const location = useLocation();
  const itemCount = useCartStore((state) => state.getItemCount());
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
      {/* DESKTOP SIDEBAR (lg:flex) */}
      <aside className="hidden lg:flex flex-col w-56 bg-neutral-50 border-r border-neutral-200 text-slate-900 min-h-[calc(100vh-3.5rem)] sticky top-14">
        {/* Navigation Items */}
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-black text-white shadow-md'
                      : 'text-neutral-600 hover:text-black hover:bg-neutral-200/60'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-neutral-500'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge > 0 && (
                  <span className={`font-bold text-[10px] px-2 py-0.5 rounded-full ${isActive ? 'bg-white text-black' : 'bg-black text-white'}`}>
                    {item.badge}
                  </span>
                )}
                {item.alertBadge > 0 && !item.badge && (
                  <span className={`font-bold text-[10px] px-2 py-0.5 rounded-full border ${isActive ? 'border-white text-white' : 'border-neutral-300 text-neutral-700 bg-neutral-200'}`}>
                    {item.alertBadge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Sidebar Footer: Support & Logout */}
        <div className="p-3 border-t border-neutral-200 space-y-1 text-xs text-neutral-500">
          <button className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl hover:bg-neutral-200/60 font-semibold text-neutral-700 transition-colors">
            <HelpCircle className="w-4 h-4 text-neutral-400" />
            <span>Support</span>
          </button>
          <button className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl hover:bg-red-50 text-neutral-700 hover:text-red-600 font-semibold transition-colors">
            <LogOut className="w-4 h-4 text-neutral-400" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* MOBILE BOTTOM NAVIGATION BAR (lg:hidden) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 z-50 text-neutral-600 px-2 py-1.5 flex items-center justify-around shadow-2xl">
        {NAV_ITEMS.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl text-[10px] font-bold transition-all relative ${
                  isActive ? 'text-black font-extrabold' : 'hover:text-neutral-900'
                }`
              }
            >
              <div className="relative">
                <Icon className="w-4 h-4" />
                {item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-black text-white font-bold text-[9px] w-4 h-4 rounded-full flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
                {item.alertBadge > 0 && !item.badge && (
                  <span className="absolute -top-1 -right-1 bg-black w-2.5 h-2.5 rounded-full border-2 border-white" />
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

import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Scan, ShoppingCart, Package, Bell, BarChart3,
  Boxes, Users, HelpCircle, LogOut,
} from 'lucide-react';
import useCart from '../hooks/useCart';
import useAuth from '../hooks/useAuth';
import AlertBadge from './AlertBadge';
import { alertsApi } from '../api/alertsApi';

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isOwner, logout } = useAuth();
  const { totalItemCount } = useCart();
  const [unreadAlertCount, setUnreadAlertCount] = useState(0);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Poll alert badge count every 30s
  useEffect(() => {
    const fetchBadge = async () => {
      try {
        const data = await alertsApi.getBadgeCount();
        setUnreadAlertCount(data?.count ?? 0);
      } catch {}
    };
    fetchBadge();
    const interval = setInterval(fetchBadge, 30000);
    return () => clearInterval(interval);
  }, []);

  const NAV_ITEMS = [
    { label: 'Scan', path: '/scan', icon: Scan },
    { label: 'Checkout', path: '/checkout', icon: ShoppingCart, badge: totalItemCount },
    { label: 'Inventory', path: '/inventory', icon: Package },
    { label: 'Alerts', path: '/alerts', icon: Bell, alertBadge: unreadAlertCount },
    ...(isOwner ? [
      { label: 'Analytics', path: '/analytics', icon: BarChart3 },
      { label: 'Products', path: '/products', icon: Boxes },
      { label: 'Workers', path: '/workers', icon: Users },
    ] : []),
  ];

  return (
    <>
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden lg:flex flex-col w-56 bg-neutral-50 border-r border-neutral-200 text-slate-900 min-h-[calc(100vh-3.5rem)] sticky top-14">
        {/* User Badge */}
        {user && (
          <div className="px-4 pt-4 pb-2">
            <div className="flex items-center gap-2.5 bg-white border border-neutral-200 rounded-xl px-3 py-2.5">
              <div className="w-7 h-7 bg-black text-white rounded-lg flex items-center justify-center font-extrabold text-xs shrink-0">
                {(user.fullName || user.username || 'U')[0].toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">{user.fullName || user.username}</p>
                <p className="text-[10px] text-neutral-400">{user.role}</p>
              </div>
            </div>
          </div>
        )}

        {/* Nav Items */}
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
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
                {({ isActive }) => (
                  <>
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
                      <AlertBadge count={item.alertBadge} />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-neutral-200 space-y-1">
          <button className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl hover:bg-neutral-200/60 font-semibold text-xs text-neutral-700 transition-colors">
            <HelpCircle className="w-4 h-4 text-neutral-400" />
            <span>Support</span>
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl hover:bg-red-50 text-neutral-700 hover:text-red-600 font-semibold text-xs transition-colors"
          >
            <LogOut className="w-4 h-4 text-neutral-400 hover:text-red-600" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* MOBILE BOTTOM NAV */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 z-50 text-neutral-600 px-3 py-1.5 flex items-center gap-2 overflow-x-auto scrollbar-none shadow-2xl">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-[10px] font-bold transition-all shrink-0 relative ${
                  isActive ? 'text-black font-extrabold bg-neutral-100' : 'hover:text-neutral-900'
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
                  <span className="absolute -top-1 -right-1">
                    <AlertBadge count={item.alertBadge} />
                  </span>
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


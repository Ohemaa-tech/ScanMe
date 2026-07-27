import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Settings, User, LogOut } from 'lucide-react';
import useAuth from '../hooks/useAuth';

export default function Header({ searchInput, setSearchInput }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();


  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-14 bg-white text-slate-900 border-b border-neutral-200 px-4 sm:px-6 flex items-center justify-between fixed top-0 left-0 right-0 z-40 shadow-sm" style={{transform:'translateZ(0)',willChange:'transform'}}>
      {/* Left: Brand Logo & Title */}
      <div className="flex items-center gap-2.5">
        <img src="/logo.png" alt="SwiftScan" className="w-8 h-8 rounded-lg object-cover shadow-sm border border-neutral-200" />
        <h1 className="font-extrabold text-lg text-black tracking-tight">SwiftScan</h1>
      </div>

      {/* Middle: Global Search Input */}
      <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Global Search (Products, SKU, Orders)..."
            value={searchInput || ''}
            onChange={(e) => setSearchInput && setSearchInput(e.target.value)}
            className="w-full bg-neutral-100 border border-neutral-200 text-black text-xs rounded-xl pl-9 pr-4 py-2 placeholder-neutral-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
          />
        </div>
      </div>

      {/* Right: Status Indicator & User Menu */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Terminal Status Badge */}
        <div className="hidden sm:flex items-center gap-2 bg-neutral-100 border border-neutral-200 px-3 py-1 rounded-full text-xs text-neutral-700">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-black opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-black"></span>
          </span>
          <span className="font-semibold text-[11px] text-black">Terminal 01</span>
        </div>

        {/* Settings Icon */}
        <button className="p-2 text-neutral-600 hover:text-black hover:bg-neutral-100 rounded-lg transition-colors">
          <Settings className="w-4 h-4" />
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-2 pl-2 border-l border-neutral-200">
          <div className="w-7 h-7 rounded-full bg-black flex items-center justify-center text-white border border-neutral-300">
            <User className="w-4 h-4" />
          </div>
          <div className="hidden xl:flex flex-col text-left">
            <span className="text-xs font-bold text-black leading-none">{user?.fullName || 'Store Owner'}</span>
            <span className="text-[10px] text-neutral-500 font-medium">{user?.role || 'Owner'}</span>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          title="Logout"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs transition-all border border-red-200/60"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}

import React from 'react';
import { Search, Settings, User } from 'lucide-react';

export default function Header({ searchInput, setSearchInput }) {
  return (
    <header className="h-14 bg-white text-slate-900 border-b border-neutral-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40 shadow-xs">
      {/* Left: Brand Logo & Title */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center text-white font-extrabold shadow-sm">
          <span className="text-sm">⚡</span>
        </div>
        <h1 className="font-extrabold text-lg text-black tracking-tight">SwiftPOS</h1>
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
      <div className="flex items-center gap-3 sm:gap-4">
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
          <span className="hidden xl:inline text-xs font-bold text-black">Store Owner</span>
        </div>
      </div>
    </header>
  );
}

import React from 'react';

/**
 * Navbar alert notification count badge component.
 */
export default function AlertBadge({ count }) {
  if (!count || count <= 0) return null;

  return (
    <span className="inline-flex items-center justify-center px-1.5 py-0.5 min-w-[18px] h-[18px] text-[10px] font-black text-white bg-red-600 rounded-full shadow-xs animate-pulse">
      {count > 99 ? '99+' : count}
    </span>
  );
}

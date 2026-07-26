import React from 'react';

/**
 * Stock status color badge component.
 * Accept either `status` ('OK' | 'Low' | 'Out') or `baseStock` and `threshold`.
 */
export default function StockBadge({ status, baseStock, threshold }) {
  let resolvedStatus = status;

  if (!resolvedStatus && baseStock !== undefined) {
    if (baseStock <= 0) {
      resolvedStatus = 'Out';
    } else if (threshold !== undefined && baseStock <= threshold) {
      resolvedStatus = 'Low';
    } else {
      resolvedStatus = 'OK';
    }
  }

  const styles = {
    OK: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    Low: 'bg-amber-100 text-amber-800 border-amber-200',
    Out: 'bg-red-100 text-red-800 border-red-200',
  };

  const labels = {
    OK: 'In Stock',
    Low: 'Low Stock',
    Out: 'Out of Stock',
  };

  const currentStyle = styles[resolvedStatus] || styles.OK;
  const currentLabel = labels[resolvedStatus] || resolvedStatus || 'In Stock';

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider border ${currentStyle}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {currentLabel}
    </span>
  );
}

import React from 'react';

/**
 * Packaging unit selection pill toggle component (Dual-unit: Single vs Bulk).
 * 
 * @param {Object} props
 * @param {Array} props.units Array of product units (e.g., [{ id, unitName, price, conversionFactor }])
 * @param {number|string} props.selectedUnitId Currently active unit ID
 * @param {Function} props.onSelect Callback when a unit pill is clicked
 * @param {string} [props.size] Pill size ('sm' | 'md')
 */
export default function UnitSelectorPill({ units = [], selectedUnitId, onSelect, size = 'md' }) {
  if (!units || units.length === 0) return null;

  const isSmall = size === 'sm';

  return (
    <div className="inline-flex items-center gap-1.5 p-1 bg-neutral-100 rounded-xl border border-neutral-200/80">
      {units.map((unit) => {
        const isSelected = String(unit.id) === String(selectedUnitId);
        return (
          <button
            key={unit.id}
            type="button"
            onClick={() => onSelect && onSelect(unit)}
            className={`transition-all rounded-lg font-bold flex items-center gap-1 ${
              isSmall ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1.5 text-xs'
            } ${
              isSelected
                ? 'bg-black text-white shadow-xs'
                : 'text-neutral-600 hover:text-black hover:bg-neutral-200/60'
            }`}
          >
            <span>{unit.unitName}</span>
            <span className={isSelected ? 'text-neutral-300' : 'text-neutral-400'}>
              ${Number(unit.price).toFixed(2)}
            </span>
          </button>
        );
      })}
    </div>
  );
}

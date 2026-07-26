import React, { useState } from 'react';
import { X } from 'lucide-react';

/**
 * Restock modal dialog component for Shop Owners.
 * 
 * @param {Object} props
 * @param {Object} props.item Item object to restock ({ productId, productName, units: [...] })
 * @param {Function} props.onClose Callback to close the modal
 * @param {Function} props.onRestock Callback to trigger restock action (item, unitId, quantity)
 * @param {boolean} [props.loading] Loading state
 */
export default function RestockModal({ item, onClose, onRestock, loading }) {
  const [unitId, setUnitId] = useState('');
  const [quantity, setQuantity] = useState(1);

  if (!item) return null;

  const selectedUnit = item.units?.find((u) => String(u.id) === String(unitId));
  const conversionFactor = selectedUnit ? selectedUnit.conversionFactor : 1;
  const addedBaseUnits = Number(quantity) * conversionFactor;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (quantity < 1) return;
    onRestock({
      productId: item.productId || item.id,
      productUnitId: unitId ? Number(unitId) : null,
      quantityRestocked: Number(quantity),
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-neutral-200">
          <h3 className="text-base font-extrabold text-slate-900">Restock: {item.productName || item.name}</h3>
          <button type="button" onClick={onClose} className="p-2 hover:bg-neutral-100 rounded-xl transition-colors">
            <X className="w-5 h-5 text-neutral-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-bold text-neutral-700 block mb-1.5">Select Packaging Unit (optional)</label>
            <select
              value={unitId}
              onChange={(e) => setUnitId(e.target.value)}
              className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-black bg-white"
            >
              <option value="">Base units directly</option>
              {item.units?.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.unitName} (×{u.conversionFactor} base units each)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-neutral-700 block mb-1.5">Quantity to Restock</label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-black font-mono"
            />
            {unitId && selectedUnit && (
              <p className="text-[11px] text-neutral-500 mt-1.5">
                = <span className="font-bold text-black font-mono">{addedBaseUnits}</span> base units will be added to stock
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-neutral-200 font-bold text-sm py-3 rounded-2xl hover:bg-neutral-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || quantity < 1}
              className="flex-1 bg-black text-white font-bold text-sm py-3 rounded-2xl hover:bg-neutral-800 disabled:opacity-50 transition-colors shadow-sm"
            >
              {loading ? 'Restocking...' : 'Confirm Restock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

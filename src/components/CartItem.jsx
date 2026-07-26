import React from 'react';
import { Minus, Plus, Trash2, Package } from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency';

/**
 * Extracted CartItem component for cart rows in Checkout & Scan view.
 * 
 * @param {Object} props
 * @param {Object} props.item Cart item object
 * @param {Function} props.onUpdateQty Callback to update item quantity (productUnitId, newQty)
 * @param {Function} props.onRemove Callback to remove item from cart (productUnitId)
 */
export default function CartItem({ item, onUpdateQty, onRemove }) {
  if (!item) return null;

  return (
    <div className="bg-white rounded-2xl p-4 border border-neutral-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      {/* Thumbnail + Product Info */}
      <div className="flex items-center gap-3.5 flex-1 min-w-0">
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden border border-neutral-200 shrink-0 bg-neutral-100 flex items-center justify-center">
          {item.imageUrl ? (
            <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />
          ) : (
            <Package className="w-6 h-6 text-neutral-300" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="font-bold text-sm text-slate-900 truncate">{item.productName}</h4>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Unit: <span className="font-semibold text-slate-600">{item.unitName}</span>
            {item.conversionFactor > 1 && (
              <span className="ml-1 text-neutral-400">({item.conversionFactor} base units)</span>
            )}
          </p>
          <p className="text-xs font-semibold text-slate-600 mt-1 font-mono">
            {formatCurrency(item.price)} each
          </p>
        </div>
      </div>

      {/* Qty Stepper + Line Total + Remove */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center bg-neutral-100 border border-neutral-200 rounded-xl p-1">
          <button
            type="button"
            onClick={() => onUpdateQty && onUpdateQty(item.productUnitId, item.quantity - 1)}
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-white text-black font-bold hover:bg-neutral-200 transition-colors"
          >
            <Minus className="w-3 h-3" />
          </button>
          <span className="w-9 text-center font-mono font-bold text-black text-sm">{item.quantity}</span>
          <button
            type="button"
            onClick={() => onUpdateQty && onUpdateQty(item.productUnitId, item.quantity + 1)}
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-white text-black font-bold hover:bg-neutral-200 transition-colors"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
        <span className="font-extrabold text-sm text-black font-mono w-20 text-right">
          {formatCurrency(item.price * item.quantity)}
        </span>
        <button
          type="button"
          onClick={() => onRemove && onRemove(item.productUnitId)}
          className="text-neutral-400 hover:text-red-500 transition-colors p-1"
          title="Remove item"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

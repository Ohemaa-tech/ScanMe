import React, { useState } from 'react';
import { Scan, Loader2 } from 'lucide-react';
import { productsApi } from '../api/productsApi';

/**
 * Auto-fill helper component for external barcode lookup during product creation.
 * 
 * @param {Object} props
 * @param {Function} props.onAutoFill Callback with retrieved product data
 * @param {Function} [props.onError] Optional error callback
 */
export default function ProductAutoFillModal({ onAutoFill, onError }) {
  const [barcode, setBarcode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLookup = async () => {
    const trimmed = barcode.trim();
    if (!trimmed) return;
    setLoading(true);
    try {
      const result = await productsApi.lookupExternal(trimmed);
      if (onAutoFill) {
        onAutoFill({
          barcode: trimmed,
          productName: result.productName,
          brand: result.brand,
          category: result.category,
          imageUrl: result.imageUrl,
          suggestedPrice: result.suggestedPrice,
        });
      }
      setBarcode('');
    } catch (err) {
      if (onError) onError('No external data found for this barcode');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-4 space-y-2">
      <p className="text-xs font-bold text-neutral-700 flex items-center gap-1.5">
        <Scan className="w-3.5 h-3.5" /> Auto-fill from Barcode
      </p>
      <div className="flex gap-2">
        <input
          type="text"
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
          placeholder="Enter or scan barcode to auto-fill details..."
          className="flex-1 bg-white border border-neutral-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-black font-mono"
        />
        <button
          type="button"
          onClick={handleLookup}
          disabled={loading || !barcode.trim()}
          className="bg-black text-white text-xs font-bold px-4 py-2 rounded-xl disabled:opacity-40 hover:bg-neutral-800 transition-colors flex items-center gap-1"
        >
          {loading ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Looking...</span>
            </>
          ) : (
            'Lookup'
          )}
        </button>
      </div>
    </div>
  );
}

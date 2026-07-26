import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import BarcodeScanner from '../components/BarcodeScanner';
import { productsApi } from '../api/productsApi';
import { useCartStore } from '../store/cartStore';
import { formatCurrency } from '../utils/formatCurrency';
import {
  ShoppingCart, Minus, Plus, Trash2, ArrowRight,
  PackageCheck, Tag, CheckCircle2, AlertTriangle, Package,
} from 'lucide-react';

export default function ScanPage() {
  const navigate = useNavigate();
  const { addItem, items, removeItem, clearCart, getTotal, getItemCount, switchUnit } = useCartStore();

  // scannedProduct: full ProductResponseDto { id, name, imageUrl, units: [], currentBaseStock, ... }
  const [scannedProduct, setScannedProduct] = useState(null);
  // selectedUnit: the ProductUnitResponseDto that was scanned / selected
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [scanQty, setScanQty] = useState(1);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [recentScans, setRecentScans] = useState([]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleBarcodeScan = useCallback(async (barcode) => {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      // Returns ProductUnitResponseDto: { id, productId, unitName, barcode, conversionFactor, price, isDefault }
      // Backend also enriches it with product info — let's fetch the full product
      const unit = await productsApi.getByBarcode(barcode);
      // Fetch the full product to get name, image, all units
      const product = await productsApi.getById(unit.productId);

      setScannedProduct(product);
      setSelectedUnit(unit);
      setScanQty(1);

      setRecentScans((prev) => [
        { barcode, productName: product.name, unitName: unit.unitName, price: unit.price },
        ...prev.slice(0, 4),
      ]);
      showToast(`Scanned: ${product.name} (${unit.unitName})`);
    } catch (err) {
      const detail = err?.response?.data?.detail || 'Barcode not found in catalog';
      setError(detail);
      showToast(detail, 'error');
    } finally {
      setLoading(false);
    }
  }, [loading]);

  const handleAddToCart = () => {
    if (!scannedProduct || !selectedUnit) return;
    for (let i = 0; i < scanQty; i++) {
      addItem(scannedProduct, selectedUnit);
    }
    showToast(`Added ${scanQty}× ${scannedProduct.name} (${selectedUnit.unitName})`);
    setScanQty(1);
  };

  const stockStatus = scannedProduct?.currentBaseStock ?? 0;

  return (
    <div className="space-y-5 pb-28 text-slate-900">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-bounce">
          <div className={`text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 ${toast.type === 'error' ? 'bg-red-600' : 'bg-slate-900'}`}>
            {toast.type === 'error'
              ? <AlertTriangle className="w-4 h-4" />
              : <CheckCircle2 className="w-4 h-4" />}
            <span>{toast.msg}</span>
          </div>
        </div>
      )}

      {/* Barcode Scanner */}
      <div className="w-full">
        <BarcodeScanner onScan={handleBarcodeScan} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        {/* Scanned Product Card */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-neutral-200 shadow-sm space-y-4">
          {loading && (
            <div className="flex items-center gap-3 text-neutral-500 text-sm py-6 justify-center">
              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
              <span>Looking up barcode...</span>
            </div>
          )}

          {!loading && !scannedProduct && (
            <div className="text-center py-10 text-neutral-400">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">Scan a barcode to get started</p>
              <p className="text-xs mt-1">Product details will appear here</p>
            </div>
          )}

          {!loading && scannedProduct && selectedUnit && (
            <>
              <div className="flex flex-col sm:flex-row gap-4 items-start">
                {/* Image */}
                <div className="w-24 h-24 sm:w-28 sm:h-28 bg-neutral-100 rounded-xl overflow-hidden border border-neutral-200 shrink-0 flex items-center justify-center">
                  {scannedProduct.imageUrl
                    ? <img src={scannedProduct.imageUrl} alt={scannedProduct.name} className="w-full h-full object-cover" />
                    : <Package className="w-10 h-10 text-neutral-300" />}
                </div>

                {/* Details */}
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono text-neutral-500 uppercase tracking-wider">
                      {scannedProduct.category || 'General'}
                    </span>
                    <div className="text-right">
                      <span className="text-2xl font-extrabold text-black font-mono">
                        {formatCurrency(selectedUnit.price)}
                      </span>
                      <span className="text-[11px] text-neutral-400 block">per {selectedUnit.unitName}</span>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-black leading-tight">{scannedProduct.name}</h3>

                  {scannedProduct.brand && (
                    <p className="text-xs text-neutral-500">Brand: {scannedProduct.brand}</p>
                  )}

                  {/* Stock badge */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${stockStatus > 0 ? 'bg-black text-white' : 'bg-red-100 text-red-700'}`}>
                      <PackageCheck className="w-3 h-3" />
                      {stockStatus > 0 ? `${stockStatus} ${scannedProduct.baseUnitName}s in stock` : 'Out of stock'}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-neutral-700 bg-neutral-100 border border-neutral-200 px-2.5 py-0.5 rounded-full">
                      <Tag className="w-3 h-3 text-neutral-500" />
                      {scannedProduct.category || 'General'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Dual-Unit Selector Pills */}
              {scannedProduct.units && scannedProduct.units.length > 1 && (
                <div className="pt-2">
                  <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-2">Select Unit</p>
                  <div className="flex flex-wrap gap-2">
                    {scannedProduct.units.map((unit) => (
                      <button
                        key={unit.id}
                        onClick={() => setSelectedUnit(unit)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                          selectedUnit.id === unit.id
                            ? 'bg-black text-white border-black'
                            : 'bg-white text-neutral-700 border-neutral-300 hover:border-black'
                        }`}
                      >
                        {unit.unitName} — {formatCurrency(unit.price)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Stepper + Add to Cart */}
              <div className="pt-3 border-t border-neutral-100 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3">
                <div className="flex items-center bg-neutral-100 border border-neutral-200 rounded-xl p-1 shrink-0">
                  <button
                    onClick={() => setScanQty(Math.max(1, scanQty - 1))}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-white shadow-xs text-black font-bold hover:bg-neutral-200"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-10 text-center font-mono font-bold text-black text-sm">{scanQty}</span>
                  <button
                    onClick={() => setScanQty(scanQty + 1)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-white shadow-xs text-black font-bold hover:bg-neutral-200"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={stockStatus === 0}
                  className="flex-1 bg-black hover:bg-neutral-800 disabled:opacity-40 text-white font-extrabold py-2.5 px-5 rounded-xl text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>Add to Cart</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Recent Scans */}
        <div className="bg-white rounded-2xl p-5 border border-neutral-200 shadow-sm space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500">LAST SCANNED</h4>
          <div className="space-y-2.5">
            {recentScans.length === 0 && (
              <p className="text-xs text-neutral-400 text-center py-4">No scans yet</p>
            )}
            {recentScans.map((scan, i) => (
              <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs">
                <div>
                  <p className="font-bold text-black">{scan.productName}</p>
                  <p className="text-[10px] text-neutral-500 font-mono">
                    {scan.unitName} | {formatCurrency(scan.price)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 z-30 shadow-2xl px-4 sm:px-8 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 bg-neutral-100 border border-neutral-200 px-3.5 py-2 rounded-xl">
            <ShoppingCart className="w-4 h-4 text-black" />
            <div>
              <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider block">CART</span>
              <span className="text-xs font-extrabold text-black">{getItemCount()} Items</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div>
              <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider block">SUBTOTAL</span>
              <span className="text-lg font-extrabold text-black font-mono">{formatCurrency(getTotal())}</span>
            </div>
            {getItemCount() > 0 && (
              <button onClick={clearCart} className="text-xs font-semibold text-neutral-500 hover:text-black flex items-center gap-1 underline">
                <Trash2 className="w-3.5 h-3.5" />
                <span>Void</span>
              </button>
            )}
          </div>

          <button
            onClick={() => navigate('/checkout')}
            disabled={getItemCount() === 0}
            className="bg-black hover:bg-neutral-800 disabled:opacity-40 text-white font-extrabold px-6 py-3 rounded-xl text-sm transition-all shadow-lg flex items-center gap-2 ml-auto"
          >
            <span>Checkout</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

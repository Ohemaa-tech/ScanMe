import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';
import { salesApi } from '../api/salesApi';
import { formatCurrency } from '../utils/formatCurrency';
import {
  ShoppingCart, Minus, Plus, Trash2, CheckCircle2,
  CreditCard, Banknote, Smartphone, Scan, Package,
  AlertTriangle, ArrowLeft,
} from 'lucide-react';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, updateQty, removeItem, clearCart, getTotal, getItemCount } = useCartStore();

  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [notes, setNotes] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastSale, setLastSale] = useState(null);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  const subtotal = getTotal();
  const taxRate = 0.05;
  const taxAmount = subtotal * taxRate;
  const grandTotal = subtotal + taxAmount;

  const handleCompleteSale = async () => {
    if (items.length === 0) return;
    setLoading(true);
    setApiError(null);
    try {
      const payload = {
        items: items.map((item) => ({
          productUnitId: item.productUnitId,
          quantity: item.quantity,
        })),
        paymentMethod,
        notes: notes || null,
      };
      const sale = await salesApi.completeSale(payload);
      setLastSale(sale);
      setShowSuccessModal(true);
    } catch (err) {
      const detail =
        err?.response?.data?.detail ||
        err?.response?.data?.title ||
        'Failed to complete sale. Please try again.';
      setApiError(detail);
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = () => {
    clearCart();
    setShowSuccessModal(false);
    setLastSale(null);
    navigate('/scan');
  };

  const PAYMENT_OPTIONS = [
    { value: 'Cash', label: 'Cash', icon: Banknote },
    { value: 'Card', label: 'Card', icon: CreditCard },
    { value: 'Mobile Money', label: 'Mobile Money', icon: Smartphone },
  ];

  return (
    <div className="space-y-6 pb-28 text-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Checkout</h2>
          <p className="text-xs sm:text-sm text-slate-500">Review cart and complete sale</p>
        </div>
        <button
          onClick={() => navigate('/scan')}
          className="inline-flex items-center gap-2 text-xs font-semibold bg-slate-900 text-white px-4 py-2 rounded-xl hover:bg-slate-800 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Scan</span>
        </button>
      </div>

      {/* API Error Banner */}
      {apiError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{apiError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* LEFT: Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between bg-white px-5 py-3.5 rounded-2xl border border-neutral-200 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-slate-700" />
              <span>Cart ({getItemCount()} items)</span>
            </h3>
            {items.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear Cart
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 border border-neutral-200 text-center shadow-xs space-y-3">
              <ShoppingCart className="w-12 h-12 text-slate-300 mx-auto" />
              <h4 className="text-lg font-bold text-slate-800">Your cart is empty</h4>
              <p className="text-xs text-slate-500">Scan product barcodes to add items.</p>
              <button
                onClick={() => navigate('/scan')}
                className="mt-2 inline-flex items-center gap-2 bg-slate-900 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md hover:bg-slate-800"
              >
                <Scan className="w-4 h-4" />
                Go to Scanner
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.productUnitId}
                  className="bg-white rounded-2xl p-4 border border-neutral-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  {/* Thumbnail + Info */}
                  <div className="flex items-center gap-3.5 flex-1 min-w-0">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden border border-neutral-200 shrink-0 bg-neutral-100 flex items-center justify-center">
                      {item.imageUrl
                        ? <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />
                        : <Package className="w-6 h-6 text-neutral-300" />}
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

                  {/* Qty stepper + line total + remove */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="flex items-center bg-neutral-100 border border-neutral-200 rounded-xl p-1">
                      <button
                        onClick={() => updateQty(item.productUnitId, item.quantity - 1)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-white text-black font-bold hover:bg-neutral-200"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-9 text-center font-mono font-bold text-black text-sm">{item.quantity}</span>
                      <button
                        onClick={() => updateQty(item.productUnitId, item.quantity + 1)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-white text-black font-bold hover:bg-neutral-200"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <span className="font-extrabold text-sm text-black font-mono w-20 text-right">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                    <button
                      onClick={() => removeItem(item.productUnitId)}
                      className="text-neutral-400 hover:text-red-500 transition-colors p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT: Order Summary + Payment */}
        <div className="space-y-4">
          {/* Order Summary */}
          <div className="bg-white rounded-2xl p-5 border border-neutral-200 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900">Order Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="font-mono font-semibold">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Tax (5%)</span>
                <span className="font-mono font-semibold">{formatCurrency(taxAmount)}</span>
              </div>
              <div className="border-t border-neutral-200 pt-2 flex justify-between text-slate-900 font-extrabold text-base">
                <span>Total</span>
                <span className="font-mono">{formatCurrency(grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-white rounded-2xl p-5 border border-neutral-200 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Payment Method</h3>
            <div className="space-y-2">
              {PAYMENT_OPTIONS.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setPaymentMethod(value)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-semibold transition-all ${
                    paymentMethod === value
                      ? 'bg-black text-white border-black'
                      : 'bg-white text-slate-700 border-neutral-200 hover:border-slate-400'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-2xl p-5 border border-neutral-200 shadow-xs space-y-2">
            <h3 className="text-sm font-bold text-slate-900">Notes (optional)</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Cashier notes..."
              rows={2}
              className="w-full bg-neutral-50 border border-neutral-200 text-sm text-slate-900 rounded-xl px-3 py-2.5 focus:outline-none focus:border-slate-400 resize-none placeholder:text-neutral-400"
            />
          </div>

          {/* Complete Sale Button */}
          <button
            onClick={handleCompleteSale}
            disabled={items.length === 0 || loading}
            className="w-full bg-black hover:bg-neutral-800 disabled:opacity-40 text-white font-extrabold py-4 px-6 rounded-2xl text-sm transition-all shadow-lg flex items-center justify-center gap-2"
          >
            {loading
              ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Processing...</>
              : <><CheckCircle2 className="w-5 h-5" /> Complete Sale — {formatCurrency(grandTotal)}</>}
          </button>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && lastSale && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl space-y-5 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-9 h-9 text-green-600" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-slate-900">Sale Complete!</h3>
              <p className="text-xs text-slate-500 mt-1">Transaction #{lastSale.id} recorded</p>
            </div>
            <div className="bg-neutral-50 rounded-2xl p-4 text-left space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Total Charged</span>
                <span className="font-extrabold font-mono text-black">{formatCurrency(lastSale.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Payment</span>
                <span className="font-semibold">{lastSale.paymentMethod}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Items</span>
                <span className="font-semibold">{lastSale.items?.length || 0} line items</span>
              </div>
            </div>
            <button
              onClick={handleFinish}
              className="w-full bg-black hover:bg-neutral-800 text-white font-extrabold py-3.5 px-6 rounded-2xl text-sm transition-all shadow-md"
            >
              New Sale
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

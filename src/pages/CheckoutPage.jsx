import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';
import { formatCurrency } from '../utils/formatCurrency';
import {
  ShoppingCart,
  Minus,
  Plus,
  Trash2,
  CheckCircle2,
  FileText,
  PauseCircle,
  ShieldCheck,
  UserPlus,
  CreditCard,
  Banknote,
  Smartphone,
  Scan,
} from 'lucide-react';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const items = useCartStore((state) => state.items);
  const updateQty = useCartStore((state) => state.updateQty);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clearCart);
  const getTotal = useCartStore((state) => state.getTotal);
  const getItemCount = useCartStore((state) => state.getItemCount);

  const [paymentMethod, setPaymentMethod] = useState('cash'); // cash, momo, card
  const [momoProvider, setMomoProvider] = useState('MTN MoMo');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastSaleReceipt, setLastSaleReceipt] = useState(null);

  // Calculations (5% Tax Rate in Ghana POS setup)
  const subtotal = getTotal();
  const taxRate = 0.05;
  const taxAmount = subtotal * taxRate;
  const grandTotal = subtotal + taxAmount;

  const handleCompleteSale = () => {
    if (items.length === 0) return;

    const receipt = {
      id: `INV-${Math.floor(100000 + Math.random() * 900000)}`,
      date: new Date().toLocaleString('en-GB'),
      items: [...items],
      subtotal,
      taxAmount,
      grandTotal,
      paymentMethod: paymentMethod === 'momo' ? `MoMo (${momoProvider})` : paymentMethod.toUpperCase(),
      customer: selectedCustomer || 'Walk-in Customer',
    };

    setLastSaleReceipt(receipt);
    setShowSuccessModal(true);
  };

  const handleFinishReceipt = () => {
    clearCart();
    setShowSuccessModal(false);
    navigate('/scan');
  };

  return (
    <div className="space-y-6 pb-28 text-slate-900">
      {/* Top Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Checkout</h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Store #1042 — Complete sales transaction and issue receipt
          </p>
        </div>

        <button
          onClick={() => navigate('/scan')}
          className="inline-flex items-center gap-2 text-xs font-semibold bg-slate-900 text-white px-4 py-2 rounded-xl hover:bg-slate-800 transition-colors shadow-sm"
        >
          <Scan className="w-3.5 h-3.5" />
          <span>Scan More Items</span>
        </button>
      </div>

      {/* Main Checkout Viewport: Cart List (Left) & Order Summary (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* LEFT 2 COLUMNS: Shopping Cart List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Cart Section Header */}
          <div className="flex items-center justify-between bg-white px-5 py-3.5 rounded-2xl border border-neutral-200 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-slate-700" />
              <span>Shopping Cart ({getItemCount()} items)</span>
            </h3>

            {items.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Cart</span>
              </button>
            )}
          </div>

          {/* Empty Cart State */}
          {items.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 border border-neutral-200 text-center shadow-xs space-y-3">
              <ShoppingCart className="w-12 h-12 text-slate-300 mx-auto" />
              <h4 className="text-lg font-bold text-slate-800">Your cart is empty</h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Scan product barcodes or search catalog items to populate checkout cart.
              </p>
              <button
                onClick={() => navigate('/scan')}
                className="mt-2 inline-flex items-center gap-2 bg-slate-900 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md hover:bg-slate-800 transition-all"
              >
                <Scan className="w-4 h-4" />
                <span>Go to Barcode Scanner</span>
              </button>
            </div>
          ) : (
            /* Cart Items Table List */
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl p-4 border border-neutral-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all hover:border-slate-300"
                >
                  {/* Left: Thumbnail & Details */}
                  <div className="flex items-center gap-3.5 flex-1 min-w-0">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover border border-neutral-200 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-sm text-slate-900 truncate leading-snug">
                        {item.name}
                      </h4>
                      <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                        SKU: {item.sku || `PRD-${item.id}`}
                      </p>
                      <p className="text-xs font-semibold text-slate-600 mt-1 font-mono">
                        Unit: {formatCurrency(item.price)}
                      </p>
                    </div>
                  </div>

                  {/* Center: Stepper */}
                  <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                    <div className="flex items-center bg-slate-100 border border-slate-200 rounded-xl p-1">
                      <button
                        onClick={() => updateQty(item.id, item.quantity - 1)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-white shadow-xs text-slate-800 font-bold hover:bg-slate-200"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-9 text-center font-mono font-bold text-slate-900 text-xs">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQty(item.id, item.quantity + 1)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-white shadow-xs text-slate-800 font-bold hover:bg-slate-200"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Line Total */}
                    <div className="text-right w-24">
                      <span className="text-xs text-slate-400 block font-normal text-[10px] uppercase">
                        Line Total
                      </span>
                      <span className="text-sm sm:text-base font-extrabold text-slate-900 font-mono">
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                    </div>

                    {/* Delete Item */}
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-slate-400 hover:text-red-600 p-1.5 transition-colors rounded-lg hover:bg-red-50"
                      title="Remove Item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT 1 COLUMN: Order Summary Card */}
        <div className="bg-white rounded-2xl p-6 border border-neutral-200 shadow-sm space-y-5 sticky top-20">
          <h3 className="text-lg font-bold text-slate-900 border-b border-neutral-100 pb-3">
            Order Summary
          </h3>

          {/* Amount Breakdown */}
          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between text-slate-600">
              <span>Subtotal</span>
              <span className="font-mono font-semibold text-slate-900">{formatCurrency(subtotal)}</span>
            </div>

            <div className="flex items-center justify-between text-slate-600">
              <span>Tax (5% VAT)</span>
              <span className="font-mono font-semibold text-slate-900">{formatCurrency(taxAmount)}</span>
            </div>

            <div className="pt-3 border-t border-neutral-200 flex items-center justify-between text-base">
              <span className="font-bold text-slate-900">Grand Total</span>
              <span className="font-extrabold text-slate-900 font-mono text-xl">
                {formatCurrency(grandTotal)}
              </span>
            </div>
          </div>

          {/* Payment Method Selector (Cash, MoMo, Card) */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
              Payment Method
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`py-2 px-2 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                  paymentMethod === 'cash'
                    ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                    : 'border-neutral-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Banknote className="w-4 h-4" />
                <span>Cash</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('momo')}
                className={`py-2 px-2 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                  paymentMethod === 'momo'
                    ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                    : 'border-neutral-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>Mobile Money</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`py-2 px-2 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                  paymentMethod === 'card'
                    ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                    : 'border-neutral-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Card</span>
              </button>
            </div>

            {/* MoMo Provider Selector Sub-options */}
            {paymentMethod === 'momo' && (
              <div className="pt-2 flex gap-2">
                {['MTN MoMo', 'Telecel Cash', 'AT Money'].map((provider) => (
                  <button
                    key={provider}
                    type="button"
                    onClick={() => setMomoProvider(provider)}
                    className={`flex-1 py-1.5 px-2 rounded-lg border text-[11px] font-semibold transition-colors ${
                      momoProvider === provider
                        ? 'bg-amber-100 border-amber-400 text-slate-900 font-bold'
                        : 'bg-white border-neutral-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {provider}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Primary CTA: Complete Sale Button */}
          <button
            onClick={handleCompleteSale}
            disabled={items.length === 0}
            className={`w-full py-3.5 px-6 rounded-xl font-extrabold text-sm sm:text-base transition-all shadow-lg flex items-center justify-center gap-2 ${
              items.length > 0
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                : 'bg-neutral-200 text-neutral-400 cursor-not-allowed shadow-none'
            }`}
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>Complete Sale ({formatCurrency(grandTotal)})</span>
          </button>

          {/* Secondary Actions: Quote & Hold */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button className="py-2.5 px-3 rounded-xl border border-neutral-200 bg-slate-50 text-slate-700 hover:bg-slate-100 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>Quote</span>
            </button>
            <button className="py-2.5 px-3 rounded-xl border border-neutral-200 bg-slate-50 text-slate-700 hover:bg-slate-100 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors">
              <PauseCircle className="w-3.5 h-3.5 text-slate-500" />
              <span>Hold Sale</span>
            </button>
          </div>

          {/* Customer Loyalty Section Card */}
          <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-200 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <ShieldCheck className="w-4 h-4 text-slate-900" />
              <span>Customer Loyalty</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Search customer account to apply member rewards or points discounts.
            </p>
            <button className="inline-flex items-center gap-1 font-bold text-slate-900 hover:underline text-[11px]">
              <UserPlus className="w-3.5 h-3.5" />
              <span>Select Customer &gt;</span>
            </button>
          </div>
        </div>

      </div>

      {/* SUCCESS SALE RECEIPT MODAL */}
      {showSuccessModal && lastSaleReceipt && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-neutral-200 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-extrabold text-slate-900">Sale Completed Successfully!</h3>
              <p className="text-xs text-slate-500 font-mono">Invoice #{lastSaleReceipt.id}</p>
            </div>

            {/* Receipt Summary Box */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2.5 text-xs font-mono">
              <div className="flex justify-between text-slate-500 border-b border-slate-200 pb-2">
                <span>Date: {lastSaleReceipt.date}</span>
                <span>{lastSaleReceipt.paymentMethod}</span>
              </div>

              {/* Line Items */}
              <div className="space-y-1.5 py-1">
                {lastSaleReceipt.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-slate-800">
                    <span className="truncate max-w-[200px]">
                      {item.quantity}x {item.name}
                    </span>
                    <span className="font-semibold">{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-200 space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span>{formatCurrency(lastSaleReceipt.subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>VAT (5%)</span>
                  <span>{formatCurrency(lastSaleReceipt.taxAmount)}</span>
                </div>
                <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-1 border-t border-slate-300">
                  <span>TOTAL PAID</span>
                  <span>{formatCurrency(lastSaleReceipt.grandTotal)}</span>
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="space-y-2 pt-1">
              <button
                onClick={handleFinishReceipt}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold py-3 px-4 rounded-xl text-xs sm:text-sm transition-colors shadow-md flex items-center justify-center gap-2"
              >
                <span>Print Receipt & Next Sale</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

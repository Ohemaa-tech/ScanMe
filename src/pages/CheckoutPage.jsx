import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useCart from '../hooks/useCart';
import CartItem from '../components/CartItem';
import { salesApi } from '../api/salesApi';
import { formatCurrency } from '../utils/formatCurrency';
import {
  ShoppingCart, Trash2, CheckCircle2,
  CreditCard, Banknote, Smartphone, Scan,
  AlertTriangle, ArrowLeft, Printer, Download,
} from 'lucide-react';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, updateQty, removeItem, clearCart, totalAmount, totalItemCount } = useCart();
  const receiptRef = useRef(null);

  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [notes, setNotes] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastSale, setLastSale] = useState(null);
  const [receiptItems, setReceiptItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  const subtotal = totalAmount;
  const taxRate = 0.05;
  const taxAmount = subtotal * taxRate;
  const grandTotal = subtotal + taxAmount;

  const handleCompleteSale = async () => {
    if (items.length === 0) return;
    setLoading(true);
    setApiError(null);
    // Capture cart snapshot for receipt before clearing
    const cartSnapshot = items.map((item) => ({
      name: item.productName,
      unitName: item.unitName,
      quantity: item.quantity,
      price: item.price,
      lineTotal: item.price * item.quantity,
    }));
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
      setReceiptItems(cartSnapshot);
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

  const handlePrint = () => {
    const receiptHtml = receiptRef.current?.innerHTML;
    if (!receiptHtml) return;
    const win = window.open('', '_blank', 'width=400,height=700');
    win.document.write(`
      <html><head><title>SwiftScan Receipt</title>
      <style>
        body { font-family: 'Courier New', monospace; font-size: 12px; margin: 0; padding: 16px; color: #000; }
        .line { border-top: 1px dashed #999; margin: 8px 0; }
        .row { display: flex; justify-content: space-between; margin: 4px 0; }
        .bold { font-weight: bold; }
        .center { text-align: center; }
        .logo { font-size: 18px; font-weight: bold; }
        @media print { body { margin: 0; } }
      </style></head>
      <body>${receiptHtml}</body></html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 300);
  };

  const PAYMENT_OPTIONS = [
    { value: 'Cash', label: 'Cash', icon: Banknote },
    { value: 'Card', label: 'Card', icon: CreditCard },
    { value: 'Mobile Money', label: 'Mobile Money', icon: Smartphone },
  ];

  const now = new Date();
  const receiptDate = now.toLocaleDateString('en-GH', { day: '2-digit', month: 'short', year: 'numeric' });
  const receiptTime = now.toLocaleTimeString('en-GH', { hour: '2-digit', minute: '2-digit' });

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
              <span>Cart ({totalItemCount} items)</span>
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
                <CartItem
                  key={item.productUnitId}
                  item={item}
                  onUpdateQty={updateQty}
                  onRemove={removeItem}
                />
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

      {/* Receipt / Success Modal */}
      {showSuccessModal && lastSale && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-sm shadow-2xl flex flex-col max-h-[90dvh]">
            {/* Modal Header */}
            <div className="px-6 pt-5 pb-3 border-b border-neutral-200 shrink-0 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                </div>
                <h3 className="text-base font-extrabold text-slate-900">Sale Complete!</h3>
              </div>
              <span className="text-xs text-slate-400">#{lastSale.id}</span>
            </div>

            {/* Scrollable Receipt */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {/* Printable Receipt Content */}
              <div ref={receiptRef} className="font-mono text-xs text-black space-y-3">
                <div className="center text-center">
                  <div className="logo text-lg font-black">⚡ SwiftScan POS</div>
                  <div>{receiptDate} · {receiptTime}</div>
                  <div>Receipt #{lastSale.id}</div>
                </div>
                <div className="line border-t border-dashed border-neutral-300 my-2" />

                {receiptItems.map((item, i) => (
                  <div key={i} className="space-y-0.5">
                    <div className="font-bold">{item.name}</div>
                    <div className="row flex justify-between">
                      <span className="text-neutral-500">{item.unitName} × {item.quantity}</span>
                      <span>{formatCurrency(item.lineTotal)}</span>
                    </div>
                  </div>
                ))}

                <div className="line border-t border-dashed border-neutral-300 my-2" />
                <div className="row flex justify-between"><span>Subtotal</span><span>{formatCurrency(lastSale.totalAmount / 1.05)}</span></div>
                <div className="row flex justify-between"><span>Tax (5%)</span><span>{formatCurrency(lastSale.totalAmount - lastSale.totalAmount / 1.05)}</span></div>
                <div className="line border-t border-dashed border-neutral-300 my-2" />
                <div className="row flex justify-between bold font-bold text-sm"><span>TOTAL</span><span>{formatCurrency(lastSale.totalAmount)}</span></div>
                <div className="row flex justify-between"><span>Payment</span><span>{lastSale.paymentMethod}</span></div>
                <div className="line border-t border-dashed border-neutral-300 my-2" />
                <div className="center text-center text-neutral-400 text-[10px]">Thank you for shopping with us!<br />Powered by SwiftScan POS</div>
              </div>
            </div>

            {/* Actions */}
            <div className="px-4 pb-5 pt-3 border-t border-neutral-200 shrink-0 space-y-2">
              <button
                onClick={handlePrint}
                className="w-full flex items-center justify-center gap-2 border border-neutral-200 text-sm font-bold py-3 rounded-2xl hover:bg-neutral-50 transition-colors"
              >
                <Printer className="w-4 h-4" />
                Print Receipt
              </button>
              <button
                onClick={handleFinish}
                className="w-full bg-black hover:bg-neutral-800 text-white text-sm font-extrabold py-3 rounded-2xl transition-colors shadow-md"
              >
                New Sale
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

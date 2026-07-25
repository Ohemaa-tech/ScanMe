import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BarcodeScanner from '../components/BarcodeScanner';
import { productsApi } from '../api/productsApi';
import { useCartStore } from '../store/cartStore';
import { formatCurrency } from '../utils/formatCurrency';
import {
  ShoppingCart,
  Minus,
  Plus,
  FileText,
  Printer,
  Trash2,
  ArrowRight,
  PackageCheck,
  Tag,
  CheckCircle2,
} from 'lucide-react';

export default function ScanPage() {
  const navigate = useNavigate();
  const addItem = useCartStore((state) => state.addItem);
  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clearCart);
  const getTotal = useCartStore((state) => state.getTotal);
  const getItemCount = useCartStore((state) => state.getItemCount);

  const [activeProduct, setActiveProduct] = useState({
    id: 101,
    name: 'Premium Ergonomic Stylus Pro',
    sku: 'PRD-STLU-001',
    barcode: '8901234567890',
    price: 129.00,
    tax: 10.40,
    category: 'Electronics',
    stock: 45,
    imageUrl: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=200&auto=format&fit=crop&q=80',
  });

  const [scanQty, setScanQty] = useState(1);
  const [toastMessage, setToastMessage] = useState(null);

  const [recentItems, setRecentItems] = useState([
    { id: 201, name: 'Wireless Keyboard', qty: 1, price: 49.99 },
    { id: 202, name: 'Type-C Power Hub', qty: 1, price: 35.00 },
  ]);

  const handleBarcodeScan = async (barcode) => {
    try {
      const product = await productsApi.getByBarcode(barcode);
      if (product) {
        setActiveProduct({
          ...product,
          sku: product.sku || `SKU-${barcode.slice(-6)}`,
          tax: (product.price * 0.08).toFixed(2),
          imageUrl: product.imageUrl || 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=200&auto=format&fit=crop&q=80',
        });
        setScanQty(1);

        setRecentItems((prev) => [
          { id: product.id, name: product.name, qty: 1, price: product.price },
          ...prev.slice(0, 4),
        ]);

        showToast(`Scanned: ${product.name}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddToCart = () => {
    if (!activeProduct) return;
    for (let i = 0; i < scanQty; i++) {
      addItem(activeProduct);
    }
    showToast(`Added ${scanQty}x ${activeProduct.name} to cart`);
    setScanQty(1);
  };

  const handleRemoveRecent = (id) => {
    setRecentItems((prev) => prev.filter((item) => item.id !== id));
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="space-y-5 pb-28 text-slate-900">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 animate-bounce">
          <div className="bg-slate-900 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-2xl border border-neutral-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-white" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Top Section: Video Scanner */}
      <div className="w-full">
        <BarcodeScanner onScan={handleBarcodeScan} />
      </div>

      {/* Middle Grid: Product Card (Left) & Last Scanned Card (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        {/* Left 2 Columns: Scanned Product Info Card */}
        {activeProduct && (
          <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-neutral-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              {/* Product Thumbnail Image */}
              <div className="w-24 h-24 sm:w-28 sm:h-28 bg-neutral-100 rounded-xl overflow-hidden border border-neutral-200 shrink-0 flex items-center justify-center">
                <img
                  src={activeProduct.imageUrl}
                  alt={activeProduct.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Product Details */}
              <div className="flex-1 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-mono text-neutral-500 uppercase tracking-wider">
                    SKU: {activeProduct.sku}
                  </span>
                  <div className="text-right">
                    <span className="text-2xl font-extrabold text-black font-mono">
                      {formatCurrency(activeProduct.price)}
                    </span>
                    <span className="text-[11px] text-neutral-400 block font-normal">
                      + {formatCurrency(activeProduct.tax)} Tax
                    </span>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-black leading-tight">
                  {activeProduct.name}
                </h3>

                {/* Status Badges */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-white bg-black px-2.5 py-0.5 rounded-full">
                    <PackageCheck className="w-3 h-3 text-white" />
                    In Stock ({activeProduct.stock} units)
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-neutral-700 bg-neutral-100 border border-neutral-200 px-2.5 py-0.5 rounded-full">
                    <Tag className="w-3 h-3 text-neutral-500" />
                    {activeProduct.category}
                  </span>
                </div>
              </div>
            </div>

            {/* Stepper + Add Note + Add to Cart Row */}
            <div className="pt-3 border-t border-neutral-100 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3">
              {/* Stepper */}
              <div className="flex items-center bg-neutral-100 border border-neutral-200 rounded-xl p-1 shrink-0">
                <button
                  onClick={() => setScanQty(Math.max(1, scanQty - 1))}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-white shadow-xs text-black font-bold hover:bg-neutral-200"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-10 text-center font-mono font-bold text-black text-sm">
                  {scanQty}
                </span>
                <button
                  onClick={() => setScanQty(scanQty + 1)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-white shadow-xs text-black font-bold hover:bg-neutral-200"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Add Note Button */}
              <button className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 transition-colors">
                <FileText className="w-3.5 h-3.5 text-neutral-500" />
                <span>Add Note</span>
              </button>

              {/* Add to Cart Button (Solid Black) */}
              <button
                onClick={handleAddToCart}
                className="flex-1 bg-black hover:bg-neutral-800 text-white font-extrabold py-2.5 px-5 rounded-xl text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2"
              >
                <ShoppingCart className="w-4 h-4 text-white" />
                <span>Add to Cart</span>
              </button>
            </div>
          </div>
        )}

        {/* Right 1 Column: Last Scanned Items Card */}
        <div className="bg-white rounded-2xl p-5 border border-neutral-200 shadow-sm space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
            LAST SCANNED
          </h4>

          {/* List of Recent Items */}
          <div className="space-y-2.5">
            {recentItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs"
              >
                <div>
                  <p className="font-bold text-black">{item.name}</p>
                  <p className="text-[10px] text-neutral-500 font-mono">
                    QTY: 0{item.qty} | {formatCurrency(item.price)}
                  </p>
                </div>
                <button
                  onClick={() => handleRemoveRecent(item.id)}
                  className="text-neutral-400 hover:text-black p-1 transition-colors"
                  title="Remove"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Print Price Tag Action Button */}
          <button className="w-full bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-black font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors">
            <Printer className="w-4 h-4" />
            <span>Print Price Tag</span>
          </button>
        </div>
      </div>

      {/* Full Width Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 z-30 shadow-2xl px-4 sm:px-8 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          {/* Left: Cart Count Pill */}
          <div className="flex items-center gap-3 bg-neutral-100 border border-neutral-200 px-3.5 py-2 rounded-xl">
            <ShoppingCart className="w-4 h-4 text-black" />
            <div>
              <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider block">
                CURRENT CART
              </span>
              <span className="text-xs font-extrabold text-black">
                0{getItemCount()} Items
              </span>
            </div>
          </div>

          {/* Middle: Estimated Subtotal */}
          <div className="flex items-center gap-4">
            <div>
              <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider block">
                ESTIMATED SUBTOTAL
              </span>
              <span className="text-lg font-extrabold text-black font-mono">
                {formatCurrency(getTotal())}
              </span>
            </div>

            {/* Void Order Link */}
            {getItemCount() > 0 && (
              <button
                onClick={clearCart}
                className="text-xs font-semibold text-neutral-500 hover:text-black flex items-center gap-1 underline"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Void Order</span>
              </button>
            )}
          </div>

          {/* Right: Proceed to Checkout CTA */}
          <button
            onClick={() => navigate('/checkout')}
            className="bg-black hover:bg-neutral-800 text-white font-extrabold px-6 py-3 rounded-xl text-sm transition-all shadow-lg flex items-center gap-2 ml-auto"
          >
            <span>Proceed to Checkout</span>
            <ArrowRight className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}

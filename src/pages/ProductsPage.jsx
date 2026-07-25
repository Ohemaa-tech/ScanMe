import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../utils/formatCurrency';
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  X,
  Scan,
  Boxes,
  ChevronLeft,
  ChevronRight,
  Barcode as BarcodeIcon,
} from 'lucide-react';

const INITIAL_CATALOG = [
  {
    id: 1,
    name: 'Mechanical Keyboard K2',
    sku: 'PROD-0821',
    barcode: '890123456789',
    category: 'Electronics',
    price: 89.00,
    stock: 42,
    threshold: 10,
    imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 2,
    name: 'Ergonomic Mouse',
    sku: 'PROD-4412',
    barcode: '890998877005',
    category: 'Electronics',
    price: 45.50,
    stock: 5,
    threshold: 10,
    imageUrl: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 3,
    name: 'A4 Printing Paper (500s)',
    sku: 'PROD-2010',
    barcode: '710023344558',
    category: 'Stationery',
    price: 12.00,
    stock: 120,
    threshold: 20,
    imageUrl: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 4,
    name: 'Wireless Bluetooth Headset',
    sku: 'PROD-9011',
    barcode: '890112233445',
    category: 'Electronics',
    price: 135.00,
    stock: 18,
    threshold: 5,
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=150&auto=format&fit=crop&q=80',
  },
];

export default function ProductsPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState(INITIAL_CATALOG);
  const [searchTerm, setSearchTerm] = useState('');
  const [toastMessage, setToastMessage] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // New product form state
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    category: 'Electronics',
    price: '',
    stock: '',
    threshold: '10',
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleOpenCreateModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      sku: `PROD-${Math.floor(1000 + Math.random() * 9000)}`,
      barcode: `890${Math.floor(100000000 + Math.random() * 900000000)}`,
      category: 'Electronics',
      price: '',
      stock: '',
      threshold: '10',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku,
      barcode: product.barcode,
      category: product.category,
      price: product.price.toString(),
      stock: product.stock.toString(),
      threshold: product.threshold.toString(),
    });
    setIsModalOpen(true);
  };

  const handleSaveProduct = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.price) {
      showToast('Please fill in required product name and price');
      return;
    }

    if (editingProduct) {
      // Update existing
      setProducts((prev) =>
        prev.map((p) =>
          p.id === editingProduct.id
            ? {
                ...p,
                name: formData.name,
                sku: formData.sku,
                barcode: formData.barcode,
                category: formData.category,
                price: parseFloat(formData.price) || 0,
                stock: parseInt(formData.stock) || 0,
                threshold: parseInt(formData.threshold) || 10,
              }
            : p
        )
      );
      showToast(`Updated product: ${formData.name}`);
    } else {
      // Create new
      const newProduct = {
        id: Date.now(),
        name: formData.name,
        sku: formData.sku,
        barcode: formData.barcode,
        category: formData.category,
        price: parseFloat(formData.price) || 0,
        stock: parseInt(formData.stock) || 0,
        threshold: parseInt(formData.threshold) || 10,
        imageUrl: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=150&auto=format&fit=crop&q=80',
      };
      setProducts((prev) => [newProduct, ...prev]);
      showToast(`Added new product: ${formData.name}`);
    }

    setIsModalOpen(false);
  };

  const handleDeleteProduct = (id, name) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    showToast(`Deleted product: ${name}`);
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.barcode.includes(searchTerm)
  );

  // Aggregated Inventory Values
  const totalValue = products.reduce((sum, p) => sum + p.price * p.stock, 124502.40);
  const lowStockCount = products.filter((p) => p.stock <= p.threshold).length + 12;

  return (
    <div className="space-y-6 pb-28 text-slate-900">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 animate-bounce">
          <div className="bg-slate-900 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-2xl border border-neutral-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Top Header Row & Action Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">Products</h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Manage your catalog, stock levels, and pricing.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-md transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Product</span>
        </button>
      </div>

      {/* Top Summary Metric Cards (2 Cards matching POS Product Catalog design) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
        {/* Card 1 (Left 2/3 width): Total Inventory Value */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-neutral-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              TOTAL INVENTORY VALUE
            </span>
            <span className="text-3xl font-extrabold text-slate-900 font-mono">
              {formatCurrency(totalValue)}
            </span>
            <div className="flex items-center gap-1 text-xs font-semibold text-slate-600 pt-1">
              <TrendingUp className="w-3.5 h-3.5 text-slate-900" />
              <span>+2.4% vs last month</span>
            </div>
          </div>

          {/* Decorative Capsule Bars */}
          <div className="hidden sm:flex items-end gap-2 h-16">
            <div className="w-4 h-10 rounded-full bg-slate-200" />
            <div className="w-4 h-14 rounded-full bg-slate-900" />
            <div className="w-4 h-12 rounded-full bg-slate-700" />
          </div>
        </div>

        {/* Card 2 (Right 1/3 width): Low Stock Items Card */}
        <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              LOW STOCK ITEMS
            </span>
            <span className="text-3xl font-extrabold text-white font-mono">
              {lowStockCount}
            </span>
            <button
              onClick={() => navigate('/alerts')}
              className="text-xs font-bold text-white hover:underline block pt-1"
            >
              View Critical Items &gt;
            </button>
          </div>
          <AlertTriangle className="w-8 h-8 text-white shrink-0" />
        </div>
      </div>

      {/* Main Catalog Table Container */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
        {/* Search Bar */}
        <div className="p-4 sm:p-5 border-b border-neutral-100 flex items-center justify-between">
          <div className="relative w-full max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-neutral-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Product Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-neutral-200 uppercase text-[10px] font-bold text-slate-500 tracking-wider">
              <tr>
                <th className="py-3.5 px-4 sm:px-6">PRODUCT</th>
                <th className="py-3.5 px-4 font-mono">BARCODE</th>
                <th className="py-3.5 px-4">CATEGORY</th>
                <th className="py-3.5 px-4">PRICE</th>
                <th className="py-3.5 px-4">STOCK</th>
                <th className="py-3.5 px-4 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 font-medium">
              {filteredProducts.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                  {/* Product Thumbnail & Name */}
                  <td className="py-3.5 px-4 sm:px-6">
                    <div className="flex items-center gap-3">
                      <img
                        src={p.imageUrl}
                        alt={p.name}
                        className="w-10 h-10 rounded-lg object-cover border border-neutral-200 shrink-0"
                      />
                      <div>
                        <p className="font-bold text-slate-900 leading-snug">{p.name}</p>
                        <p className="text-[10px] font-mono text-slate-400">ID: {p.sku}</p>
                      </div>
                    </div>
                  </td>

                  {/* Barcode */}
                  <td className="py-3.5 px-4 font-mono text-slate-600">{p.barcode}</td>

                  {/* Category Pill */}
                  <td className="py-3.5 px-4">
                    <span className="bg-slate-100 border border-slate-200 text-slate-700 px-2.5 py-0.5 rounded-full text-[11px] font-semibold">
                      {p.category}
                    </span>
                  </td>

                  {/* Price (GH₵) */}
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900 text-sm">
                    {formatCurrency(p.price)}
                  </td>

                  {/* Stock Pill */}
                  <td className="py-3.5 px-4">
                    {p.stock <= p.threshold ? (
                      <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 font-bold px-2.5 py-0.5 rounded-full text-[10px]">
                        ▲ {p.stock} low stock
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold px-2.5 py-0.5 rounded-full text-[10px]">
                        ▶ {p.stock} in stock
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleOpenEditModal(p)}
                        className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Edit Product"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(p.id, p.name)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Table Footer with Pagination */}
        <div className="p-4 bg-slate-50/60 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <span>Showing 3 of 124 products</span>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 border border-neutral-200 rounded-xl bg-white text-slate-600 hover:bg-slate-100 font-semibold disabled:opacity-50">
              Previous
            </button>
            <button className="px-3 py-1.5 border border-neutral-200 rounded-xl bg-white text-slate-600 hover:bg-slate-100 font-semibold">
              Next
            </button>
          </div>
        </div>
      </div>

      {/* CREATE / EDIT PRODUCT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-neutral-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h3 className="font-extrabold text-base text-slate-900">
                {editingProduct ? 'Edit Catalog Product' : 'Add New Catalog Product'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-800 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mechanical Keyboard K2"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-50 border border-neutral-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">SKU ID</label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full bg-slate-50 border border-neutral-200 rounded-xl px-3 py-2 text-slate-900 font-mono focus:outline-none focus:border-slate-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Barcode</label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={formData.barcode}
                      onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                      className="w-full bg-slate-50 border border-neutral-200 rounded-xl px-3 py-2 text-slate-900 font-mono focus:outline-none focus:border-slate-900"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          barcode: `890${Math.floor(100000000 + Math.random() * 900000000)}`,
                        }));
                        showToast('Barcode auto-generated');
                      }}
                      className="p-2 bg-slate-100 border border-slate-200 rounded-xl hover:bg-slate-200 text-slate-700 shrink-0"
                      title="Generate Barcode"
                    >
                      <BarcodeIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-slate-50 border border-neutral-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-slate-900"
                  >
                    <option value="Electronics">Electronics</option>
                    <option value="Stationery">Stationery</option>
                    <option value="Beverages">Beverages</option>
                    <option value="Accessories">Accessories</option>
                    <option value="Supplies">Supplies</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Price (GH₵) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="89.00"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full bg-slate-50 border border-neutral-200 rounded-xl px-3 py-2 text-slate-900 font-mono focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Initial Stock Qty</label>
                  <input
                    type="number"
                    placeholder="42"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full bg-slate-50 border border-neutral-200 rounded-xl px-3 py-2 text-slate-900 font-mono focus:outline-none focus:border-slate-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Low Stock Alert Threshold</label>
                  <input
                    type="number"
                    placeholder="10"
                    value={formData.threshold}
                    onChange={(e) => setFormData({ ...formData, threshold: e.target.value })}
                    className="w-full bg-slate-50 border border-neutral-200 rounded-xl px-3 py-2 text-slate-900 font-mono focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-neutral-200 text-slate-700 font-bold hover:bg-slate-50 transition-colors text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold transition-colors text-xs shadow-md"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

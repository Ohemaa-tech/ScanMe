import React, { useState } from 'react';
import { formatCurrency } from '../utils/formatCurrency';
import {
  Search,
  Filter,
  Download,
  Save,
  Edit3,
  Box,
  AlertTriangle,
  AlertCircle,
  TrendingUp,
  CheckCircle2,
  Plus,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';

// Sample inventory data matching the POS - Inventory Management screenshot
const INITIAL_INVENTORY = [
  {
    id: 1,
    name: 'Nebula Phone Pro',
    sku: 'PRD-NBL-010',
    barcode: '89020987102',
    category: 'Electronics',
    quantity: 45,
    threshold: 10,
    unitCost: 850.00,
    imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 2,
    name: 'Arctic Spring Water 500ml',
    sku: 'PRD-WTR-011',
    barcode: '89020987652',
    category: 'Beverages',
    quantity: 4,
    threshold: 20,
    unitCost: 3.50,
    imageUrl: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 3,
    name: 'SonicWave Headphones',
    sku: 'PRD-HDP-012',
    barcode: '89073105652',
    category: 'Electronics',
    quantity: 18,
    threshold: 5,
    unitCost: 195.00,
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 4,
    name: 'Minimalist Ceramic Mug',
    sku: 'PRD-MUG-013',
    barcode: '70010908112',
    category: 'Homeware',
    quantity: 0,
    threshold: 12,
    unitCost: 25.00,
    imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 5,
    name: 'Organic Almond Milk 1L',
    sku: 'PRD-MLK-014',
    barcode: '70010957872',
    category: 'Beverages',
    quantity: 120,
    threshold: 30,
    unitCost: 22.00,
    imageUrl: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=150&auto=format&fit=crop&q=80',
  },
];

export default function InventoryPage() {
  const [products, setProducts] = useState(INITIAL_INVENTORY);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [toastMessage, setToastMessage] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Helper to determine status pill
  const getStockStatus = (qty, threshold) => {
    if (qty === 0) return { label: 'Out of Stock', type: 'danger' };
    if (qty <= threshold) return { label: 'Low Stock', type: 'warning' };
    return { label: 'In Stock', type: 'success' };
  };

  // Inline quantity editing update
  const handleQtyChange = (id, newQty) => {
    const val = Math.max(0, parseInt(newQty) || 0);
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, quantity: val } : p))
    );
  };

  // Inline threshold update
  const handleThresholdChange = (id, newThreshold) => {
    const val = Math.max(0, parseInt(newThreshold) || 0);
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, threshold: val } : p))
    );
  };

  const handleSaveChanges = () => {
    showToast('Inventory stock updates saved successfully!');
  };

  const handleExportCSV = () => {
    const headers = 'ID,Name,SKU,Barcode,Category,Quantity,Threshold,UnitCost\n';
    const rows = products
      .map((p) => `${p.id},"${p.name}",${p.sku},${p.barcode},${p.category},${p.quantity},${p.threshold},${p.unitCost}`)
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory_store1042_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    showToast('Inventory CSV exported');
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Filtering logic
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.barcode.includes(searchTerm);

    const matchesCategory =
      selectedCategory === 'All' || p.category === selectedCategory;

    const statusObj = getStockStatus(p.quantity, p.threshold);
    const matchesStatus =
      selectedStatus === 'All' || statusObj.label === selectedStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Aggregated Summary Metrics
  const totalSKUs = 1284;
  const lowStockCount = products.filter((p) => p.quantity > 0 && p.quantity <= p.threshold).length + 10;
  const outOfStockCount = products.filter((p) => p.quantity === 0).length + 2;
  const totalStockValue = products.reduce((sum, p) => sum + p.quantity * p.unitCost, 42800);

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

      {/* Top Header Row & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">Inventory Management</h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Live stock levels across Store #1042
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-neutral-300 bg-white text-slate-700 hover:bg-slate-50 font-bold text-xs shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleSaveChanges}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Changes</span>
          </button>
        </div>
      </div>

      {/* Main Inventory Card Container */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
        {/* Search & Filter Controls Toolbar */}
        <div className="p-4 sm:p-5 border-b border-neutral-100 flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Search Input */}
          <div className="relative w-full md:flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, barcode, or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-neutral-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:bg-white transition-all"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex items-center gap-2.5 w-full md:w-auto overflow-x-auto">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-slate-900"
            >
              <option value="All">All Categories</option>
              <option value="Electronics">Electronics</option>
              <option value="Beverages">Beverages</option>
              <option value="Homeware">Homeware</option>
              <option value="Accessories">Accessories</option>
              <option value="Supplies">Supplies</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-slate-900"
            >
              <option value="All">All Statuses</option>
              <option value="In Stock">In Stock</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Out of Stock">Out of Stock</option>
            </select>

            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('All');
                setSelectedStatus('All');
              }}
              className="p-2 border border-neutral-200 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors"
              title="Reset Filters"
            >
              <Filter className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Inventory Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-neutral-200 uppercase text-[10px] font-bold text-slate-500 tracking-wider">
              <tr>
                <th className="py-3 px-4 sm:px-6">PRODUCT NAME</th>
                <th className="py-3 px-4 font-mono">BARCODE</th>
                <th className="py-3 px-4">CATEGORY</th>
                <th className="py-3 px-4 text-center">QTY</th>
                <th className="py-3 px-4 text-center">THRESHOLD</th>
                <th className="py-3 px-4 text-center">STATUS</th>
                <th className="py-3 px-4 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 font-medium">
              {filteredProducts.map((p) => {
                const status = getStockStatus(p.quantity, p.threshold);
                return (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Product Name & SKU */}
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.imageUrl}
                          alt={p.name}
                          className="w-10 h-10 rounded-lg object-cover border border-neutral-200 shrink-0"
                        />
                        <div>
                          <p className="font-bold text-slate-900 leading-snug">{p.name}</p>
                          <p className="text-[10px] font-mono text-slate-400">
                            SKU: {p.sku} | Unit: {formatCurrency(p.unitCost)}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Barcode */}
                    <td className="py-3.5 px-4 font-mono text-slate-600">{p.barcode}</td>

                    {/* Category */}
                    <td className="py-3.5 px-4">
                      <span className="bg-slate-100 border border-slate-200 text-slate-700 px-2.5 py-0.5 rounded-full text-[11px] font-semibold">
                        {p.category}
                      </span>
                    </td>

                    {/* QTY (Inline Editable) */}
                    <td className="py-3.5 px-4 text-center">
                      <input
                        type="number"
                        min="0"
                        value={p.quantity}
                        onChange={(e) => handleQtyChange(p.id, e.target.value)}
                        className={`w-14 text-center font-mono font-bold text-xs py-1 rounded-lg border text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 ${
                          p.quantity === 0
                            ? 'bg-red-50 border-red-300 text-red-700 font-extrabold'
                            : p.quantity <= p.threshold
                            ? 'bg-amber-50 border-amber-300 text-amber-800'
                            : 'bg-white border-neutral-200'
                        }`}
                      />
                    </td>

                    {/* Threshold */}
                    <td className="py-3.5 px-4 text-center">
                      <input
                        type="number"
                        min="0"
                        value={p.threshold}
                        onChange={(e) => handleThresholdChange(p.id, e.target.value)}
                        className="w-14 text-center font-mono text-xs py-1 rounded-lg border border-neutral-200 bg-white text-slate-700 focus:outline-none focus:border-slate-900"
                      />
                    </td>

                    {/* Status Pill */}
                    <td className="py-3.5 px-4 text-center">
                      {status.type === 'success' && (
                        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold px-2.5 py-0.5 rounded-full text-[10px]">
                          <CheckCircle2 className="w-3 h-3" /> In Stock
                        </span>
                      )}
                      {status.type === 'warning' && (
                        <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 font-bold px-2.5 py-0.5 rounded-full text-[10px]">
                          <AlertTriangle className="w-3 h-3" /> Low Stock
                        </span>
                      )}
                      {status.type === 'danger' && (
                        <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 border border-red-200 font-bold px-2.5 py-0.5 rounded-full text-[10px]">
                          <AlertCircle className="w-3 h-3" /> Out of Stock
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setEditingProduct(p)}
                        className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Edit Details"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Table Footer with Pagination */}
        <div className="p-4 bg-slate-50/60 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <span>Showing 1-5 of 24 products</span>
          <div className="flex items-center gap-1">
            <button className="p-1.5 border border-neutral-200 rounded-lg bg-white text-slate-400 hover:text-slate-800 disabled:opacity-50">
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button className="w-7 h-7 font-bold text-xs bg-slate-900 text-white rounded-lg flex items-center justify-center shadow-xs">
              1
            </button>
            <button className="w-7 h-7 font-medium text-xs hover:bg-slate-200/60 rounded-lg flex items-center justify-center">
              2
            </button>
            <button className="w-7 h-7 font-medium text-xs hover:bg-slate-200/60 rounded-lg flex items-center justify-center">
              3
            </button>
            <button className="p-1.5 border border-neutral-200 rounded-lg bg-white text-slate-600 hover:bg-slate-100">
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Summary Metric Cards Row (4 Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total SKU Count */}
        <div className="bg-white rounded-2xl p-4 border border-neutral-200 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
            <Box className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              TOTAL SKU COUNT
            </span>
            <span className="text-lg font-extrabold text-slate-900 font-mono">
              {totalSKUs.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white rounded-2xl p-4 border border-neutral-200 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              LOW STOCK ALERTS
            </span>
            <span className="text-lg font-extrabold text-amber-700 font-mono">
              {lowStockCount}
            </span>
          </div>
        </div>

        {/* Out of Stock */}
        <div className="bg-white rounded-2xl p-4 border border-neutral-200 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 border border-red-200 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              OUT OF STOCK
            </span>
            <span className="text-lg font-extrabold text-red-700 font-mono">
              {outOfStockCount}
            </span>
          </div>
        </div>

        {/* Est. Stock Value */}
        <div className="bg-white rounded-2xl p-4 border border-neutral-200 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              EST. STOCK VALUE
            </span>
            <span className="text-lg font-extrabold text-slate-900 font-mono">
              {formatCurrency(totalStockValue)}
            </span>
          </div>
        </div>
      </div>

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-neutral-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">Edit Product Details</h3>
              <button
                onClick={() => setEditingProduct(null)}
                className="text-slate-400 hover:text-slate-800 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Product Name</label>
                <input
                  type="text"
                  value={editingProduct.name}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, name: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-neutral-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">SKU</label>
                  <input
                    type="text"
                    value={editingProduct.sku}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, sku: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-neutral-200 rounded-xl px-3 py-2 text-slate-900 font-mono focus:outline-none focus:border-slate-900"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Barcode</label>
                  <input
                    type="text"
                    value={editingProduct.barcode}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, barcode: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-neutral-200 rounded-xl px-3 py-2 text-slate-900 font-mono focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Unit Cost (GH₵)</label>
                  <input
                    type="number"
                    value={editingProduct.unitCost}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        unitCost: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-slate-50 border border-neutral-200 rounded-xl px-3 py-2 text-slate-900 font-mono focus:outline-none focus:border-slate-900"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Category</label>
                  <input
                    type="text"
                    value={editingProduct.category}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, category: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-neutral-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                onClick={() => setEditingProduct(null)}
                className="flex-1 py-2.5 rounded-xl border border-neutral-200 text-slate-700 font-bold hover:bg-slate-50 transition-colors text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setProducts((prev) =>
                    prev.map((p) => (p.id === editingProduct.id ? editingProduct : p))
                  );
                  setEditingProduct(null);
                  showToast('Product updated');
                }}
                className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-colors text-xs shadow-md"
              >
                Save Product
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { formatCurrency } from '../utils/formatCurrency';
import { productsApi } from '../api/productsApi';
import useAuth from '../hooks/useAuth';
import StockBadge from '../components/StockBadge';
import ProductAutoFillModal from '../components/ProductAutoFillModal';
import {
  Plus, Search, Edit3, Trash2, X,
  Boxes, ChevronLeft, ChevronRight, AlertTriangle,
  CheckCircle2, Package, Loader2,
} from 'lucide-react';

const EMPTY_FORM = {
  name: '', baseUnitName: 'Piece', category: '', brand: '',
  description: '', imageUrl: '', initialBaseStock: 0, lowStockThreshold: 10,
  units: [{ unitName: 'Single', barcode: '', conversionFactor: 1, price: '', isDefault: true }],
};

export default function ProductsPage() {
  const { isOwner } = useAuth();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const PER_PAGE = 8;

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await productsApi.getAll({ search: searchTerm || undefined });
      setProducts(Array.isArray(data) ? data : []);
    } catch {
      showToast('Failed to load products', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);
  useEffect(() => {
    const t = setTimeout(fetchProducts, 400);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormData(EMPTY_FORM);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = async (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      baseUnitName: product.baseUnitName || 'Piece',
      category: product.category || '',
      brand: product.brand || '',
      description: product.description || '',
      imageUrl: product.imageUrl || '',
      initialBaseStock: product.currentBaseStock || 0,
      lowStockThreshold: product.lowStockThreshold || 10,
      units: product.units?.length
        ? product.units.map((u) => ({
            unitName: u.unitName, barcode: u.barcode,
            conversionFactor: u.conversionFactor, price: u.price, isDefault: u.isDefault,
          }))
        : EMPTY_FORM.units,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleAutoFillData = (data) => {
    setFormData((prev) => ({
      ...prev,
      name: data.productName || prev.name,
      brand: data.brand || prev.brand,
      category: data.category || prev.category,
      imageUrl: data.imageUrl || prev.imageUrl,
      units: prev.units.map((u, i) =>
        i === 0 ? { ...u, barcode: data.barcode, price: data.suggestedPrice || u.price } : u
      ),
    }));
    showToast('Product details auto-filled!');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      const payload = {
        name: formData.name,
        baseUnitName: formData.baseUnitName,
        category: formData.category || null,
        brand: formData.brand || null,
        description: formData.description || null,
        imageUrl: formData.imageUrl || null,
        initialBaseStock: Number(formData.initialBaseStock),
        lowStockThreshold: Number(formData.lowStockThreshold),
        units: formData.units.map((u) => ({
          unitName: u.unitName,
          barcode: u.barcode,
          conversionFactor: Number(u.conversionFactor),
          price: Number(u.price),
          isDefault: u.isDefault,
        })),
      };
      if (editingProduct) {
        await productsApi.update(editingProduct.id, payload);
        showToast('Product updated');
      } else {
        await productsApi.create(payload);
        showToast('Product created');
      }
      setIsModalOpen(false);
      fetchProducts();
    } catch (err) {
      setFormError(err?.response?.data?.detail || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await productsApi.remove(id);
      showToast('Product deleted');
      fetchProducts();
    } catch {
      showToast('Failed to delete product', 'error');
    }
  };

  const addUnit = () => {
    setFormData((prev) => ({
      ...prev,
      units: [...prev.units, { unitName: '', barcode: '', conversionFactor: 1, price: '', isDefault: false }],
    }));
  };

  const removeUnit = (idx) => {
    setFormData((prev) => ({ ...prev, units: prev.units.filter((_, i) => i !== idx) }));
  };

  const updateUnit = (idx, field, value) => {
    setFormData((prev) => ({
      ...prev,
      units: prev.units.map((u, i) => (i === idx ? { ...u, [field]: value } : u)),
    }));
  };

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.category || '').toLowerCase().includes(searchTerm.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div className="space-y-5 text-slate-900">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-2xl ${toast.type === 'error' ? 'bg-red-600' : 'bg-slate-900'}`}>
          {toast.type === 'error' ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Product Catalog</h2>
          <p className="text-xs text-slate-500">{products.length} active products</p>
        </div>
        {isOwner && (
          <button onClick={openCreateModal} className="flex items-center gap-2 bg-black hover:bg-neutral-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md transition-all">
            <Plus className="w-4 h-4" /> Add Product
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
          placeholder="Search products..."
          className="w-full bg-white border border-neutral-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-black transition-all"
        />
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20 gap-3 text-neutral-400">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-sm">Loading products...</span>
        </div>
      ) : paged.length === 0 ? (
        <div className="text-center py-20 text-neutral-400">
          <Boxes className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">{searchTerm ? 'No products match your search' : 'No products yet'}</p>
          {isOwner && !searchTerm && <p className="text-xs mt-1">Click "Add Product" to create your first product</p>}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {paged.map((p) => (
            <div key={p.id} className="bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden hover:shadow-md transition-all">
              <div className="h-36 bg-neutral-100 flex items-center justify-center overflow-hidden">
                {p.imageUrl
                  ? <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                  : <Package className="w-10 h-10 text-neutral-300" />}
              </div>
              <div className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-bold text-sm text-slate-900 leading-tight">{p.name}</h4>
                  <StockBadge baseStock={p.currentBaseStock} threshold={p.lowStockThreshold} />
                </div>
                <p className="text-xs text-neutral-500">{p.category || '—'} {p.brand ? `· ${p.brand}` : ''}</p>
                <div className="flex flex-wrap gap-1.5">
                  {p.units?.map((u) => (
                    <span key={u.id} className="text-[10px] font-semibold bg-neutral-100 border border-neutral-200 px-2 py-0.5 rounded-full">
                      {u.unitName}: {formatCurrency(u.price)}
                    </span>
                  ))}
                </div>
                <p className="text-[11px] text-neutral-500">Stock: {p.currentBaseStock ?? 0} {p.baseUnitName}s</p>
                {isOwner && (
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => openEditModal(p)} className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold border border-neutral-200 py-2 rounded-xl hover:bg-neutral-100 transition-colors">
                      <Edit3 className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button onClick={() => handleDelete(p.id, p.name)} className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold border border-red-100 text-red-600 py-2 rounded-xl hover:bg-red-50 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-xl border border-neutral-200 disabled:opacity-40 hover:bg-neutral-100">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-semibold text-neutral-600">Page {page} / {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 rounded-xl border border-neutral-200 disabled:opacity-40 hover:bg-neutral-100">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl my-8">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-neutral-200">
              <h3 className="text-base font-extrabold text-slate-900">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-xl hover:bg-neutral-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-5">
              {/* External Barcode Lookup Component */}
              {!editingProduct && (
                <ProductAutoFillModal
                  onAutoFill={handleAutoFillData}
                  onError={(err) => showToast(err, 'error')}
                />
              )}


              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-2.5 rounded-xl flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" /> {formError}
                </div>
              )}

              {/* Basic Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: 'Product Name *', key: 'name', required: true, full: true },
                  { label: 'Base Unit Name', key: 'baseUnitName', placeholder: 'Piece, Bottle, Kg...' },
                  { label: 'Category', key: 'category' },
                  { label: 'Brand', key: 'brand' },
                  { label: 'Image URL', key: 'imageUrl', full: true },
                  { label: 'Initial Base Stock', key: 'initialBaseStock', type: 'number' },
                  { label: 'Low Stock Threshold', key: 'lowStockThreshold', type: 'number' },
                ].map(({ label, key, required, full, type = 'text', placeholder }) => (
                  <div key={key} className={full ? 'sm:col-span-2' : ''}>
                    <label className="text-xs font-semibold text-neutral-700 block mb-1">{label}</label>
                    <input
                      type={type}
                      required={required}
                      value={formData[key]}
                      onChange={(e) => setFormData((prev) => ({ ...prev, [key]: e.target.value }))}
                      placeholder={placeholder}
                      className="w-full border border-neutral-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-black"
                    />
                  </div>
                ))}
              </div>

              {/* Packaging Units */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-neutral-700">Packaging Units (Barcodes)</p>
                  <button type="button" onClick={addUnit} className="text-xs font-bold text-black underline">+ Add Unit</button>
                </div>
                {formData.units.map((unit, idx) => (
                  <div key={idx} className="bg-neutral-50 border border-neutral-200 rounded-2xl p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-semibold text-neutral-600 block mb-1">Unit Name</label>
                        <input value={unit.unitName} onChange={(e) => updateUnit(idx, 'unitName', e.target.value)} placeholder="e.g. Single, Carton of 24" className="w-full border border-neutral-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-black" required />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-neutral-600 block mb-1">Barcode</label>
                        <input value={unit.barcode} onChange={(e) => updateUnit(idx, 'barcode', e.target.value)} placeholder="Scan or enter barcode" className="w-full border border-neutral-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-black" required />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-neutral-600 block mb-1">Conversion Factor</label>
                        <input type="number" min="1" value={unit.conversionFactor} onChange={(e) => updateUnit(idx, 'conversionFactor', e.target.value)} className="w-full border border-neutral-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-black" required />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-neutral-600 block mb-1">Price</label>
                        <input type="number" step="0.01" min="0" value={unit.price} onChange={(e) => updateUnit(idx, 'price', e.target.value)} placeholder="0.00" className="w-full border border-neutral-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-black" required />
                      </div>
                    </div>
                    {formData.units.length > 1 && (
                      <button type="button" onClick={() => removeUnit(idx)} className="text-xs text-red-500 hover:text-red-700 font-semibold">Remove unit</button>
                    )}
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 border border-neutral-200 text-sm font-bold py-3 rounded-2xl hover:bg-neutral-100 transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 bg-black hover:bg-neutral-800 text-white text-sm font-bold py-3 rounded-2xl transition-colors disabled:opacity-50">
                  {saving ? 'Saving...' : editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

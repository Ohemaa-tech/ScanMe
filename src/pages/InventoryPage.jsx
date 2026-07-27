import React, { useState, useEffect } from 'react';
import { formatCurrency } from '../utils/formatCurrency';
import { inventoryApi } from '../api/inventoryApi';
import useAuth from '../hooks/useAuth';
import StockBadge from '../components/StockBadge';
import RestockModal from '../components/RestockModal';
import {
  Search, Box, AlertTriangle, AlertCircle,
  CheckCircle2, Plus, ChevronLeft, ChevronRight,
  X, Loader2, RefreshCw,
} from 'lucide-react';

export default function InventoryPage({ globalSearch = '' }) {
  const { isOwner } = useAuth();

  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(globalSearch);

  useEffect(() => {
    setSearchTerm(globalSearch);
  }, [globalSearch]);

  const [statusFilter, setStatusFilter] = useState('');
  const [toast, setToast] = useState(null);
  const [page, setPage] = useState(1);
  const PER_PAGE = 8;

  // Restock modal
  const [restockItem, setRestockItem] = useState(null);
  const [restockLoading, setRestockLoading] = useState(false);

  // Threshold edit
  const [editThresholdItem, setEditThresholdItem] = useState(null);
  const [newThreshold, setNewThreshold] = useState('');
  const [thresholdLoading, setThresholdLoading] = useState(false);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const data = await inventoryApi.getInventory({
        search: searchTerm || undefined,
        status: statusFilter || undefined,
      });
      setInventory(Array.isArray(data) ? data : []);
    } catch {
      showToast('Failed to load inventory', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInventory(); }, [statusFilter]);
  useEffect(() => {
    const t = setTimeout(fetchInventory, 400);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const handleRestockSubmit = async (restockData) => {
    setRestockLoading(true);
    try {
      await inventoryApi.restock(restockData);
      showToast(`Restocked ${restockItem?.productName || 'product'} successfully`);
      setRestockItem(null);
      fetchInventory();
    } catch (err) {
      showToast(err?.response?.data?.detail || 'Restock failed', 'error');
    } finally {
      setRestockLoading(false);
    }
  };

  const handleUpdateThreshold = async () => {
    if (!editThresholdItem) return;
    setThresholdLoading(true);
    try {
      await inventoryApi.adjustStock(editThresholdItem.productId, {
        lowStockThreshold: Number(newThreshold),
      });
      showToast('Low stock threshold updated');
      setEditThresholdItem(null);
      fetchInventory();
    } catch {
      showToast('Failed to update threshold', 'error');
    } finally {
      setThresholdLoading(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(inventory.length / PER_PAGE));
  const paged = inventory.slice((page - 1) * PER_PAGE, page * PER_PAGE);

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
          <h2 className="text-xl font-bold text-slate-900">Inventory</h2>
          <p className="text-xs text-slate-500">{inventory.length} products tracked</p>
        </div>
        <button onClick={fetchInventory} className="flex items-center gap-2 text-xs font-semibold border border-neutral-200 px-3 py-2 rounded-xl hover:bg-neutral-100 transition-colors">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
            placeholder="Search inventory..."
            className="w-full bg-white border border-neutral-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-black"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="bg-white border border-neutral-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-black"
        >
          <option value="">All Status</option>
          <option value="ok">OK</option>
          <option value="low">Low Stock</option>
          <option value="out">Out of Stock</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'OK', status: 'OK', color: 'text-emerald-700 bg-emerald-50 border-emerald-200', icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" /> },
          { label: 'Low Stock', status: 'LowStock', color: 'text-amber-700 bg-amber-50 border-amber-200', icon: <AlertTriangle className="w-5 h-5 text-amber-500" /> },
          { label: 'Out of Stock', status: 'OutOfStock', color: 'text-red-700 bg-red-50 border-red-200', icon: <AlertCircle className="w-5 h-5 text-red-500" /> },
        ].map(({ label, status, color, icon }) => {
          const count = inventory.filter((i) => i.stockStatus === status).length;
          return (
            <div key={status} className={`rounded-2xl border p-3 flex items-center gap-3 ${color}`}>
              {icon}
              <div>
                <div className="text-xl font-extrabold">{count}</div>
                <div className="text-[10px] font-bold uppercase tracking-wider">{label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20 gap-3 text-neutral-400">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-sm">Loading inventory...</span>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50 text-[11px] text-neutral-500 font-bold uppercase tracking-wider">
                  <th className="text-left px-5 py-3">Product</th>
                  <th className="text-right px-4 py-3">Base Stock</th>
                  <th className="text-right px-4 py-3">Threshold</th>
                  <th className="text-center px-4 py-3">Status</th>
                  {isOwner && <th className="text-center px-4 py-3">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {paged.length === 0 ? (
                  <tr>
                    <td colSpan={isOwner ? 5 : 4} className="text-center py-16 text-neutral-400">
                      <Box className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p className="text-xs">No inventory records found</p>
                    </td>
                  </tr>
                ) : paged.map((item) => (
                  <tr key={item.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-bold text-slate-900 text-sm">{item.productName}</p>
                      <p className="text-[11px] text-neutral-400">Base unit: {item.baseUnitName}</p>
                      {item.units?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {item.units.map((u) => (
                            <span key={u.id} className="text-[9px] font-semibold bg-neutral-100 px-1.5 py-0.5 rounded-full">
                              {u.unitName} (×{u.conversionFactor})
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-900">
                      {item.quantity.toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5 text-right text-neutral-600">
                      <div className="flex items-center justify-end gap-2">
                        {item.lowStockThreshold}
                        {isOwner && (
                          <button
                            onClick={() => { setEditThresholdItem(item); setNewThreshold(String(item.lowStockThreshold)); }}
                            className="text-[10px] text-neutral-400 hover:text-black underline"
                          >
                            Edit
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <StockBadge status={item.stockStatus === 'OutOfStock' ? 'Out' : item.stockStatus === 'LowStock' ? 'Low' : 'OK'} />
                    </td>
                    {isOwner && (
                      <td className="px-4 py-3.5 text-center">
                        <button
                          onClick={() => setRestockItem(item)}
                          className="inline-flex items-center gap-1.5 text-xs font-bold bg-black text-white px-3 py-1.5 rounded-xl hover:bg-neutral-800 transition-colors"
                        >
                          <Plus className="w-3 h-3" /> Restock
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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

      {/* Restock Modal */}
      {restockItem && (
        <RestockModal
          item={restockItem}
          onClose={() => setRestockItem(null)}
          onRestock={handleRestockSubmit}
          loading={restockLoading}
        />
      )}


      {/* Threshold Edit Modal */}
      {editThresholdItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-neutral-200">
              <h3 className="text-base font-extrabold">Edit Threshold</h3>
              <button onClick={() => setEditThresholdItem(null)} className="p-2 hover:bg-neutral-100 rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-neutral-600">{editThresholdItem.productName}</p>
              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1.5">Low Stock Threshold (base units)</label>
                <input
                  type="number"
                  min="0"
                  value={newThreshold}
                  onChange={(e) => setNewThreshold(e.target.value)}
                  className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-black"
                />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setEditThresholdItem(null)} className="flex-1 border border-neutral-200 font-bold text-sm py-3 rounded-2xl hover:bg-neutral-100">Cancel</button>
                <button
                  onClick={handleUpdateThreshold}
                  disabled={thresholdLoading}
                  className="flex-1 bg-black text-white font-bold text-sm py-3 rounded-2xl hover:bg-neutral-800 disabled:opacity-50"
                >
                  {thresholdLoading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

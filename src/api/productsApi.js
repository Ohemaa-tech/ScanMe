import axiosClient from './axiosClient';

// Mock product catalog for fallback when offline / during dev
const MOCK_PRODUCTS = [
  {
    id: 1,
    name: 'Pro Mechanical Keyboard',
    sku: 'PRD-KBD-001',
    barcode: '8901234567890',
    price: 129.00,
    category: 'Hardware',
    stock: 24,
    lowStockThreshold: 5,
    imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 2,
    name: 'Wireless Laser Scanner',
    sku: 'PRD-SCN-002',
    barcode: '8901234567891',
    price: 85.00,
    category: 'Hardware',
    stock: 12,
    lowStockThreshold: 3,
    imageUrl: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 3,
    name: 'Thermal Receipt Rolls (x10)',
    sku: 'PRD-PPR-003',
    barcode: '8901234567892',
    price: 12.50,
    category: 'Supplies',
    stock: 150,
    lowStockThreshold: 20,
    imageUrl: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 4,
    name: 'Security Tag Detacher',
    sku: 'PRD-SEC-004',
    barcode: '8901234567893',
    price: 45.00,
    category: 'Accessories',
    stock: 8,
    lowStockThreshold: 2,
    imageUrl: 'https://images.unsplash.com/photo-1563770660941-20978e870e26?w=200&auto=format&fit=crop&q=80',
  },
];

export const productsApi = {
  getByBarcode: async (barcode) => {
    try {
      return await axiosClient.get(`/products/barcode/${barcode}`);
    } catch (err) {
      console.warn('API lookup failed, checking mock catalog for barcode:', barcode);
      const found = MOCK_PRODUCTS.find((p) => p.barcode === barcode);
      if (found) return found;
      return {
        id: Date.now(),
        name: `Scanned Item (${barcode})`,
        sku: `SKU-${barcode.slice(-6)}`,
        barcode,
        price: 55.00,
        category: 'General',
        stock: 15,
        lowStockThreshold: 3,
        imageUrl: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=200&auto=format&fit=crop&q=80',
      };
    }
  },

  getAll: async (params) => {
    try {
      return await axiosClient.get('/products', { params });
    } catch {
      return MOCK_PRODUCTS;
    }
  },

  create: async (data) => {
    return await axiosClient.post('/products', data);
  },

  update: async (id, data) => {
    return await axiosClient.put(`/products/${id}`, data);
  },

  remove: async (id) => {
    return await axiosClient.delete(`/products/${id}`);
  },
};

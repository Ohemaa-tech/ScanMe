import { create } from 'zustand';

// Pre-seeded initial cart items matching user's POS Checkout design screenshot
const INITIAL_CART_ITEMS = [
  {
    id: 1,
    name: 'Pro Mechanical Keyboard',
    sku: 'PRD-KBD-001',
    barcode: '8901234567890',
    price: 129.00,
    quantity: 1,
    category: 'Hardware',
    imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 2,
    name: 'Wireless Laser Scanner',
    sku: 'PRD-SCN-002',
    barcode: '8901234567891',
    price: 85.00,
    quantity: 2,
    category: 'Hardware',
    imageUrl: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 3,
    name: 'Thermal Receipt Rolls (x10)',
    sku: 'PRD-PPR-003',
    barcode: '8901234567892',
    price: 12.50,
    quantity: 1,
    category: 'Supplies',
    imageUrl: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 4,
    name: 'Security Tag Detacher',
    sku: 'PRD-SEC-004',
    barcode: '8901234567893',
    price: 45.00,
    quantity: 1,
    category: 'Accessories',
    imageUrl: 'https://images.unsplash.com/photo-1563770660941-20978e870e26?w=200&auto=format&fit=crop&q=80',
  },
];

export const useCartStore = create((set, get) => ({
  items: INITIAL_CART_ITEMS,

  addItem: (product) => {
    set((state) => {
      const existingIndex = state.items.findIndex((item) => item.id === product.id);
      if (existingIndex > -1) {
        const updatedItems = [...state.items];
        updatedItems[existingIndex] = {
          ...updatedItems[existingIndex],
          quantity: updatedItems[existingIndex].quantity + 1,
        };
        return { items: updatedItems };
      } else {
        return {
          items: [
            ...state.items,
            {
              id: product.id,
              name: product.name,
              sku: product.sku || `SKU-${product.id}`,
              barcode: product.barcode,
              price: Number(product.price),
              quantity: 1,
              category: product.category || 'General',
              stock: product.stock,
              imageUrl: product.imageUrl || 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=200&auto=format&fit=crop&q=80',
            },
          ],
        };
      }
    });
  },

  removeItem: (productId) => {
    set((state) => ({
      items: state.items.filter((item) => item.id !== productId),
    }));
  },

  updateQty: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(productId);
      return;
    }
    set((state) => ({
      items: state.items.map((item) =>
        item.id === productId ? { ...item, quantity: Number(quantity) } : item
      ),
    }));
  },

  clearCart: () => set({ items: [] }),

  // Computed Selectors
  getTotal: () => {
    return get().items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  },

  getItemCount: () => {
    return get().items.reduce((sum, item) => sum + item.quantity, 0);
  },
}));

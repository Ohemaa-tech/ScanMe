import { create } from 'zustand';

// Cart item shape (dual-unit aware):
// { productId, productUnitId, productName, unitName, price, conversionFactor, quantity, imageUrl }

export const useCartStore = create((set, get) => ({
  items: [],

  // Add product unit to cart. productUnit comes from GET /api/products/barcode/{barcode}
  // or from unit selection on a ProductResponseDto
  addItem: (product, productUnit) => {
    // product: { id, name, imageUrl, ... }
    // productUnit: { id, unitName, price, conversionFactor, productId, ... }
    const unitId = productUnit?.id ?? product.id;
    set((state) => {
      const existingIndex = state.items.findIndex((item) => item.productUnitId === unitId);
      if (existingIndex > -1) {
        const updated = [...state.items];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + 1,
        };
        return { items: updated };
      }
      return {
        items: [
          ...state.items,
          {
            productId: product.id ?? productUnit?.productId,
            productUnitId: unitId,
            productName: product.name,
            unitName: productUnit?.unitName ?? 'Single',
            price: Number(productUnit?.price ?? product.price ?? 0),
            conversionFactor: productUnit?.conversionFactor ?? 1,
            quantity: 1,
            imageUrl: product.imageUrl || null,
          },
        ],
      };
    });
  },

  removeItem: (productUnitId) => {
    set((state) => ({
      items: state.items.filter((item) => item.productUnitId !== productUnitId),
    }));
  },

  updateQty: (productUnitId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(productUnitId);
      return;
    }
    set((state) => ({
      items: state.items.map((item) =>
        item.productUnitId === productUnitId ? { ...item, quantity: Number(quantity) } : item
      ),
    }));
  },

  // Switch a cart item's unit (e.g. Single → Carton) from product.units[]
  switchUnit: (productUnitId, newProductUnit) => {
    set((state) => ({
      items: state.items.map((item) =>
        item.productUnitId === productUnitId
          ? {
              ...item,
              productUnitId: newProductUnit.id,
              unitName: newProductUnit.unitName,
              price: Number(newProductUnit.price),
              conversionFactor: newProductUnit.conversionFactor,
            }
          : item
      ),
    }));
  },

  clearCart: () => set({ items: [] }),

  getTotal: () =>
    get().items.reduce((sum, item) => sum + item.price * item.quantity, 0),

  getItemCount: () =>
    get().items.reduce((sum, item) => sum + item.quantity, 0),
}));

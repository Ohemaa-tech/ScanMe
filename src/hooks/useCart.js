import { useCartStore } from '../store/cartStore';

/**
 * Custom hook wrapping Zustand Cart Store state and helper calculations.
 */
export function useCart() {
  const items = useCartStore((state) => state.items);
  const addItem = useCartStore((state) => state.addItem);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQty = useCartStore((state) => state.updateQty);
  const switchUnit = useCartStore((state) => state.switchUnit);
  const clearCart = useCartStore((state) => state.clearCart);

  const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalItemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const isEmpty = items.length === 0;

  return {
    items,
    totalAmount,
    totalItemCount,
    isEmpty,
    addItem,
    removeItem,
    updateQty,
    switchUnit,
    clearCart,
  };
}

export default useCart;

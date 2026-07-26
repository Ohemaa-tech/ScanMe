import axiosClient from './axiosClient';

export const inventoryApi = {
  // GET /api/inventory?search=&status=low|out|ok
  getInventory: (params) => axiosClient.get('/inventory', { params }),

  // GET /api/inventory/{productId}
  getByProductId: (productId) => axiosClient.get(`/inventory/${productId}`),

  // POST /api/inventory/restock — { productId, productUnitId?, quantityRestocked }
  restock: (data) => axiosClient.post('/inventory/restock', data),

  // PATCH /api/inventory/{productId} — { quantity?, lowStockThreshold? }
  adjustStock: (productId, data) => axiosClient.patch(`/inventory/${productId}`, data),
};

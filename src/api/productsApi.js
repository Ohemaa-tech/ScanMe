import axiosClient from './axiosClient';

export const productsApi = {
  // GET /api/products/barcode/{barcode}
  // Returns ProductUnitResponseDto with productId info embedded
  getByBarcode: (barcode) => axiosClient.get(`/products/barcode/${barcode}`),

  // GET /api/products?search=&category=
  getAll: (params) => axiosClient.get('/products', { params }),

  // GET /api/products/{id}
  getById: (id) => axiosClient.get(`/products/${id}`),

  // GET /api/products/lookup-external/{barcode} (Owner only)
  lookupExternal: (barcode) => axiosClient.get(`/products/lookup-external/${barcode}`),

  // POST /api/products (Owner only)
  create: (data) => axiosClient.post('/products', data),

  // PUT /api/products/{id} (Owner only)
  update: (id, data) => axiosClient.put(`/products/${id}`, data),

  // DELETE /api/products/{id} (Owner only)
  remove: (id) => axiosClient.delete(`/products/${id}`),
};

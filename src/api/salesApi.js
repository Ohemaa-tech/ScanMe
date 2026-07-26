import axiosClient from './axiosClient';

export const salesApi = {
  // POST /api/sales — items: [{productUnitId, quantity}], paymentMethod, notes?
  completeSale: (payload) => axiosClient.post('/sales', payload),

  // GET /api/sales?from=&to=&page=
  getSales: (params) => axiosClient.get('/sales', { params }),

  // GET /api/sales/{id}
  getSaleById: (id) => axiosClient.get(`/sales/${id}`),
};

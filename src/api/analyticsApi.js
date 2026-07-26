import axiosClient from './axiosClient';

export const analyticsApi = {
  // GET /api/analytics/overview → { totalRevenue, totalSalesCount, totalActiveProducts, lowStockCount, outOfStockCount }
  getOverview: () => axiosClient.get('/analytics/overview'),

  // GET /api/analytics/top-sellers?count=5&from=&to=
  getTopSellers: (params) => axiosClient.get('/analytics/top-sellers', { params }),

  // GET /api/analytics/slow-movers?count=5&daysThreshold=30
  getSlowMovers: (params) => axiosClient.get('/analytics/slow-movers', { params }),

  // GET /api/analytics/revenue-trends?period=daily&from=&to=
  getRevenueTrends: (params) => axiosClient.get('/analytics/revenue-trends', { params }),

  // GET /api/analytics/recommendations
  getRecommendations: () => axiosClient.get('/analytics/recommendations'),
};

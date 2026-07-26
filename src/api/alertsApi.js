import axiosClient from './axiosClient';

export const alertsApi = {
  // GET /api/alerts → AlertResponseDto[]
  getAlerts: () => axiosClient.get('/alerts'),

  // GET /api/alerts/badge → { count }
  getBadgeCount: () => axiosClient.get('/alerts/badge'),

  // PATCH /api/alerts/{id}/read → 204
  markRead: (id) => axiosClient.patch(`/alerts/${id}/read`),
};

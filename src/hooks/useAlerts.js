import { useState, useEffect, useCallback } from 'react';
import { alertsApi } from '../api/alertsApi';

const DEFAULT_POLL_INTERVAL = 30000; // 30s

/**
 * Custom hook to poll and manage low-stock alerts.
 * @param {number} pollIntervalMs 
 */
export function useAlerts(pollIntervalMs = DEFAULT_POLL_INTERVAL) {
  const [alerts, setAlerts] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAlerts = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await alertsApi.getAlerts();
      const list = Array.isArray(data) ? data : [];
      setAlerts(list);
      setUnreadCount(list.filter((a) => !a.isRead).length);
      setError(null);
    } catch (err) {
      if (!silent) setError(err?.message || 'Failed to fetch alerts');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  const markRead = async (alertId) => {
    try {
      await alertsApi.markRead(alertId);
      setAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, isRead: true } : a))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark alert as read:', err);
    }
  };

  const markAllRead = async () => {
    const unread = alerts.filter((a) => !a.isRead);
    try {
      await Promise.all(unread.map((a) => alertsApi.markRead(a.id)));
      setAlerts((prev) => prev.map((a) => ({ ...a, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all alerts as read:', err);
    }
  };

  useEffect(() => {
    fetchAlerts();
    if (pollIntervalMs > 0) {
      const interval = setInterval(() => fetchAlerts(true), pollIntervalMs);
      return () => clearInterval(interval);
    }
  }, [fetchAlerts, pollIntervalMs]);

  return {
    alerts,
    unreadCount,
    loading,
    error,
    refresh: fetchAlerts,
    markRead,
    markAllRead,
  };
}

export default useAlerts;

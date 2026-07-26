/**
 * Helper to calculate relative time (e.g. "just now", "5m ago", "2h ago", "3d ago")
 * @param {string|Date|number} dateStr 
 * @returns {string}
 */
export function timeAgo(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const diff = Date.now() - date.getTime();
  if (isNaN(diff)) return '';
  
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

/**
 * Helper to format a date to a standard readable date string (e.g., "Jul 26, 2026 10:30 PM")
 * @param {string|Date|number} dateStr 
 * @returns {string}
 */
export function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

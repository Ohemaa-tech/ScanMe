using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using POS.Core.Entities;
using POS.Core.Enums;
using POS.Core.Interfaces;
using POS.Infrastructure.Data;

namespace POS.Infrastructure.Repositories
{
    public class AlertRepository : IAlertRepository
    {
        private readonly AppDbContext _context;

        public AlertRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Alert>> GetActiveAlertsAsync()
        {
            return await _context.Alerts
                .Include(a => a.Product)
                .OrderByDescending(a => a.CreatedAt)
                .ToListAsync();
        }

        public async Task<int> GetUnreadCountAsync()
        {
            return await _context.Alerts.CountAsync(a => !a.IsRead);
        }

        public async Task<Alert?> GetByIdAsync(int id)
        {
            return await _context.Alerts
                .Include(a => a.Product)
                .FirstOrDefaultAsync(a => a.Id == id);
        }

        public async Task<Alert> CreateAlertAsync(Alert alert)
        {
            _context.Alerts.Add(alert);
            await _context.SaveChangesAsync();
            return alert;
        }

        public async Task UpdateAlertAsync(Alert alert)
        {
            _context.Alerts.Update(alert);
            await _context.SaveChangesAsync();
        }

        public async Task DismissActiveAlertsForProductAsync(int productId)
        {
            var unreadAlerts = await _context.Alerts
                .Where(a => a.ProductId == productId && !a.IsRead)
                .ToListAsync();

            if (unreadAlerts.Any())
            {
                foreach (var alert in unreadAlerts)
                {
                    alert.IsRead = true;
                }
                await _context.SaveChangesAsync();
            }
        }

        public async Task<bool> HasActiveAlertForProductAsync(int productId, AlertType alertType)
        {
            return await _context.Alerts
                .AnyAsync(a => a.ProductId == productId && a.AlertType == alertType && !a.IsRead);
        }
    }
}

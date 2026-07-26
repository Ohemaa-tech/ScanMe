using System.Collections.Generic;
using System.Threading.Tasks;
using POS.Core.Entities;
using POS.Core.Enums;

namespace POS.Core.Interfaces
{
    public interface IAlertRepository
    {
        Task<IEnumerable<Alert>> GetActiveAlertsAsync();
        Task<int> GetUnreadCountAsync();
        Task<Alert?> GetByIdAsync(int id);
        Task<Alert> CreateAlertAsync(Alert alert);
        Task UpdateAlertAsync(Alert alert);
        Task DismissActiveAlertsForProductAsync(int productId);
        Task<bool> HasActiveAlertForProductAsync(int productId, AlertType alertType);
    }
}

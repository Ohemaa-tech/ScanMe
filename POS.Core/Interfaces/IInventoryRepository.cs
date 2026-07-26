using System.Collections.Generic;
using System.Threading.Tasks;
using POS.Core.Entities;

namespace POS.Core.Interfaces
{
    public interface IInventoryRepository
    {
        Task<IEnumerable<Inventory>> GetInventoriesAsync(string? search = null, string? status = null);
        Task<Inventory?> GetByProductIdAsync(int productId);
        Task UpdateInventoryAsync(Inventory inventory);
    }
}

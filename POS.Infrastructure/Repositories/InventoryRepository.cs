using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using POS.Core.Entities;
using POS.Core.Interfaces;
using POS.Infrastructure.Data;

namespace POS.Infrastructure.Repositories
{
    public class InventoryRepository : IInventoryRepository
    {
        private readonly AppDbContext _context;

        public InventoryRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Inventory>> GetInventoriesAsync(string? search = null, string? status = null)
        {
            var query = _context.Inventories
                .Include(i => i.Product)
                    .ThenInclude(p => p!.Units)
                .Include(i => i.LastRestockedByUser)
                .Where(i => i.Product != null && i.Product.IsActive);

            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim().ToLower();
                query = query.Where(i => i.Product!.Name.ToLower().Contains(term) ||
                                         (i.Product.Brand != null && i.Product.Brand.ToLower().Contains(term)) ||
                                         i.Product.Units.Any(u => u.Barcode.Contains(term)));
            }

            if (!string.IsNullOrWhiteSpace(status))
            {
                var s = status.Trim().ToLower();
                if (s == "out")
                {
                    query = query.Where(i => i.Quantity <= 0);
                }
                else if (s == "low")
                {
                    query = query.Where(i => i.Quantity > 0 && i.Quantity <= i.LowStockThreshold);
                }
                else if (s == "ok")
                {
                    query = query.Where(i => i.Quantity > i.LowStockThreshold);
                }
            }

            return await query
                .OrderBy(i => i.Product!.Name)
                .ToListAsync();
        }

        public async Task<Inventory?> GetByProductIdAsync(int productId)
        {
            return await _context.Inventories
                .Include(i => i.Product)
                    .ThenInclude(p => p!.Units)
                .Include(i => i.LastRestockedByUser)
                .FirstOrDefaultAsync(i => i.ProductId == productId && i.Product!.IsActive);
        }

        public async Task UpdateInventoryAsync(Inventory inventory)
        {
            inventory.LastUpdatedAt = DateTime.UtcNow;
            _context.Inventories.Update(inventory);
            await _context.SaveChangesAsync();
        }
    }
}

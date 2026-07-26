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
    public class SaleRepository : ISaleRepository
    {
        private readonly AppDbContext _context;

        public SaleRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<Sale> CreateSaleAsync(Sale sale)
        {
            sale.SaleDate = DateTime.UtcNow;
            await _context.Sales.AddAsync(sale);
            await _context.SaveChangesAsync();
            return sale;
        }

        public async Task<IEnumerable<Sale>> GetSalesAsync(DateTime? from = null, DateTime? to = null, int page = 1, int pageSize = 20)
        {
            var query = _context.Sales
                .Include(s => s.User)
                .Include(s => s.SaleItems)
                    .ThenInclude(si => si.Product)
                .Include(s => s.SaleItems)
                    .ThenInclude(si => si.ProductUnit)
                .AsQueryable();

            if (from.HasValue)
            {
                query = query.Where(s => s.SaleDate >= from.Value);
            }

            if (to.HasValue)
            {
                query = query.Where(s => s.SaleDate <= to.Value);
            }

            return await query
                .OrderByDescending(s => s.SaleDate)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
        }

        public async Task<Sale?> GetSaleByIdAsync(int id)
        {
            return await _context.Sales
                .Include(s => s.User)
                .Include(s => s.SaleItems)
                    .ThenInclude(si => si.Product)
                .Include(s => s.SaleItems)
                    .ThenInclude(si => si.ProductUnit)
                .FirstOrDefaultAsync(s => s.Id == id);
        }
    }
}

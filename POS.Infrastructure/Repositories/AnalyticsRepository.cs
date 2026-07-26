using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using POS.Core.Interfaces;
using POS.Infrastructure.Data;

namespace POS.Infrastructure.Repositories
{
    public class AnalyticsRepository : IAnalyticsRepository
    {
        private readonly AppDbContext _context;

        public AnalyticsRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<AnalyticsOverviewRawData> GetOverviewAsync()
        {
            var totalRevenue = await _context.Sales.SumAsync(s => (decimal?)s.TotalAmount) ?? 0m;
            var totalSalesCount = await _context.Sales.CountAsync();
            var totalActiveProducts = await _context.Products.CountAsync(p => p.IsActive);

            var inventories = await _context.Inventories.ToListAsync();
            var lowStockCount = inventories.Count(i => i.Quantity > 0 && i.Quantity <= i.LowStockThreshold);
            var outOfStockCount = inventories.Count(i => i.Quantity <= 0);

            return new AnalyticsOverviewRawData
            {
                TotalRevenue = totalRevenue,
                TotalSalesCount = totalSalesCount,
                TotalActiveProducts = totalActiveProducts,
                LowStockCount = lowStockCount,
                OutOfStockCount = outOfStockCount
            };
        }

        public async Task<List<TopSellerRawData>> GetTopSellersAsync(int count = 5, DateTime? from = null, DateTime? to = null)
        {
            var query = _context.SaleItems
                .Include(si => si.Product)
                .Include(si => si.Sale)
                .AsQueryable();

            if (from.HasValue)
            {
                query = query.Where(si => si.Sale != null && si.Sale.SaleDate >= from.Value);
            }

            if (to.HasValue)
            {
                query = query.Where(si => si.Sale != null && si.Sale.SaleDate <= to.Value);
            }

            var grouped = await query
                .GroupBy(si => new { si.ProductId, ProductName = si.Product != null ? si.Product.Name : "Unknown", Category = si.Product != null ? (si.Product.Category ?? "General") : "General" })
                .Select(g => new TopSellerRawData
                {
                    ProductId = g.Key.ProductId,
                    ProductName = g.Key.ProductName,
                    Category = g.Key.Category,
                    TotalQuantitySold = g.Sum(x => x.Quantity),
                    TotalBaseUnitsSold = g.Sum(x => x.BaseUnitsDeducted),
                    TotalRevenue = g.Sum(x => x.LineTotal)
                })
                .OrderByDescending(x => x.TotalRevenue)
                .Take(count)
                .ToListAsync();

            return grouped;
        }

        public async Task<List<SlowMoverRawData>> GetSlowMoversAsync(int count = 5, int daysThreshold = 30)
        {
            var cutoffDate = DateTime.UtcNow.AddDays(-daysThreshold);

            var activeProducts = await _context.Products
                .Where(p => p.IsActive)
                .Include(p => p.Inventory)
                .ToListAsync();

            var result = new List<SlowMoverRawData>();

            foreach (var product in activeProducts)
            {
                var currentStock = product.Inventory?.Quantity ?? 0;
                if (currentStock <= 0) continue; // Only consider products that are in stock but not selling

                var recentSales = await _context.SaleItems
                    .Include(si => si.Sale)
                    .Where(si => si.ProductId == product.Id && si.Sale != null && si.Sale.SaleDate >= cutoffDate)
                    .ToListAsync();

                var totalUnitsSold = recentSales.Sum(s => s.BaseUnitsDeducted);

                var lastSale = await _context.SaleItems
                    .Include(si => si.Sale)
                    .Where(si => si.ProductId == product.Id && si.Sale != null)
                    .OrderByDescending(si => si.Sale!.SaleDate)
                    .FirstOrDefaultAsync();

                result.Add(new SlowMoverRawData
                {
                    ProductId = product.Id,
                    ProductName = product.Name,
                    Category = product.Category ?? "General",
                    CurrentStock = currentStock,
                    LastSaleDate = lastSale?.Sale?.SaleDate,
                    TotalUnitsSoldPeriod = totalUnitsSold
                });
            }

            return result
                .OrderBy(x => x.TotalUnitsSoldPeriod)
                .ThenByDescending(x => x.CurrentStock)
                .Take(count)
                .ToList();
        }

        public async Task<List<RevenueTrendRawData>> GetRevenueTrendsAsync(string period = "daily", DateTime? from = null, DateTime? to = null)
        {
            var startDate = from ?? DateTime.UtcNow.AddDays(-30);
            var endDate = to ?? DateTime.UtcNow;

            var sales = await _context.Sales
                .Where(s => s.SaleDate >= startDate && s.SaleDate <= endDate)
                .ToListAsync();

            if (period.ToLower() == "monthly")
            {
                return sales
                    .GroupBy(s => new DateTime(s.SaleDate.Year, s.SaleDate.Month, 1))
                    .Select(g => new RevenueTrendRawData
                    {
                        PeriodDate = g.Key,
                        Revenue = g.Sum(s => s.TotalAmount),
                        TransactionCount = g.Count()
                    })
                    .OrderBy(x => x.PeriodDate)
                    .ToList();
            }
            else if (period.ToLower() == "weekly")
            {
                return sales
                    .GroupBy(s => s.SaleDate.Date.AddDays(-(int)s.SaleDate.DayOfWeek))
                    .Select(g => new RevenueTrendRawData
                    {
                        PeriodDate = g.Key,
                        Revenue = g.Sum(s => s.TotalAmount),
                        TransactionCount = g.Count()
                    })
                    .OrderBy(x => x.PeriodDate)
                    .ToList();
            }
            else // daily
            {
                return sales
                    .GroupBy(s => s.SaleDate.Date)
                    .Select(g => new RevenueTrendRawData
                    {
                        PeriodDate = g.Key,
                        Revenue = g.Sum(s => s.TotalAmount),
                        TransactionCount = g.Count()
                    })
                    .OrderBy(x => x.PeriodDate)
                    .ToList();
            }
        }
    }
}

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using POS.Application.DTOs;
using POS.Core.Interfaces;

namespace POS.Application.Services
{
    public class AnalyticsService : IAnalyticsService
    {
        private readonly IAnalyticsRepository _analyticsRepository;

        public AnalyticsService(IAnalyticsRepository analyticsRepository)
        {
            _analyticsRepository = analyticsRepository;
        }

        public async Task<AnalyticsOverviewDto> GetOverviewAsync()
        {
            var raw = await _analyticsRepository.GetOverviewAsync();
            return new AnalyticsOverviewDto
            {
                TotalRevenue = raw.TotalRevenue,
                TotalSalesCount = raw.TotalSalesCount,
                TotalActiveProducts = raw.TotalActiveProducts,
                LowStockCount = raw.LowStockCount,
                OutOfStockCount = raw.OutOfStockCount
            };
        }

        public async Task<List<TopSellerDto>> GetTopSellersAsync(int count = 5, DateTime? from = null, DateTime? to = null)
        {
            var rawList = await _analyticsRepository.GetTopSellersAsync(count, from, to);
            return rawList.Select(r => new TopSellerDto
            {
                ProductId = r.ProductId,
                ProductName = r.ProductName,
                Category = r.Category,
                TotalQuantitySold = r.TotalQuantitySold,
                TotalBaseUnitsSold = r.TotalBaseUnitsSold,
                TotalRevenue = r.TotalRevenue
            }).ToList();
        }

        public async Task<List<SlowMoverDto>> GetSlowMoversAsync(int count = 5, int daysThreshold = 30)
        {
            var rawList = await _analyticsRepository.GetSlowMoversAsync(count, daysThreshold);
            var now = DateTime.UtcNow;

            return rawList.Select(r =>
            {
                int daysStagnant = r.LastSaleDate.HasValue
                    ? Math.Max(0, (int)(now - r.LastSaleDate.Value).TotalDays)
                    : daysThreshold;

                return new SlowMoverDto
                {
                    ProductId = r.ProductId,
                    ProductName = r.ProductName,
                    Category = r.Category,
                    CurrentStock = r.CurrentStock,
                    LastSaleDate = r.LastSaleDate,
                    TotalUnitsSoldPeriod = r.TotalUnitsSoldPeriod,
                    DaysStagnant = daysStagnant
                };
            }).ToList();
        }

        public async Task<List<RevenueTrendDto>> GetRevenueTrendsAsync(string period = "daily", DateTime? from = null, DateTime? to = null)
        {
            var rawList = await _analyticsRepository.GetRevenueTrendsAsync(period, from, to);

            return rawList.Select(r => new RevenueTrendDto
            {
                PeriodLabel = period.ToLower() switch
                {
                    "monthly" => r.PeriodDate.ToString("MMM yyyy"),
                    "weekly" => $"Week of {r.PeriodDate:MMM dd}",
                    _ => r.PeriodDate.ToString("yyyy-MM-dd")
                },
                Date = r.PeriodDate,
                Revenue = r.Revenue,
                TransactionCount = r.TransactionCount
            }).ToList();
        }

        public async Task<List<AiRecommendationDto>> GetRecommendationsAsync()
        {
            var recommendations = new List<AiRecommendationDto>();

            var overview = await _analyticsRepository.GetOverviewAsync();
            var topSellers = await _analyticsRepository.GetTopSellersAsync(count: 3);
            var slowMovers = await _analyticsRepository.GetSlowMoversAsync(count: 3, daysThreshold: 30);

            // Recommendation 1: Urgent Restock Warning
            if (overview.OutOfStockCount > 0)
            {
                recommendations.Add(new AiRecommendationDto
                {
                    Type = "Reorder",
                    Priority = "High",
                    Title = "Restock Critical Items",
                    Message = $"You currently have {overview.OutOfStockCount} product(s) completely out of stock. Restock immediately to prevent lost revenue.",
                    SuggestedAction = "Go to Inventory management and create restock orders."
                });
            }

            // Recommendation 2: Low Stock Warning for Top Sellers
            foreach (var top in topSellers)
            {
                var slowMoverMatch = slowMovers.FirstOrDefault(s => s.ProductId == top.ProductId);
                if (top.TotalRevenue > 100m)
                {
                    recommendations.Add(new AiRecommendationDto
                    {
                        Type = "Promote",
                        Priority = "Medium",
                        ProductId = top.ProductId,
                        ProductName = top.ProductName,
                        Title = $"Promote Top Seller: {top.ProductName}",
                        Message = $"'{top.ProductName}' is generating significant revenue (${top.TotalRevenue:F2}). Consider featuring it prominently on shelves or bundles.",
                        SuggestedAction = "Create bulk discount bundles or prime placement."
                    });
                }
            }

            // Recommendation 3: Clearance / Discount for Slow Movers
            foreach (var slow in slowMovers.Where(s => s.CurrentStock > 15 && s.TotalUnitsSoldPeriod < 3))
            {
                recommendations.Add(new AiRecommendationDto
                {
                    Type = "Discount",
                    Priority = "Medium",
                    ProductId = slow.ProductId,
                    ProductName = slow.ProductName,
                    Title = $"Clearance Suggestion: {slow.ProductName}",
                    Message = $"'{slow.ProductName}' has {slow.CurrentStock} units sitting in inventory with only {slow.TotalUnitsSoldPeriod} unit(s) sold in the past 30 days.",
                    SuggestedAction = "Apply a 15-25% discount to free up capital and shelf space."
                });
            }

            // Fallback general recommendation if few specific rules triggered
            if (!recommendations.Any())
            {
                recommendations.Add(new AiRecommendationDto
                {
                    Type = "General",
                    Priority = "Low",
                    Title = "Catalog Health Good",
                    Message = "Your store sales and inventory levels are balanced. Keep recording daily transactions for deeper trend insights.",
                    SuggestedAction = "Continue regular daily restocking and checkout routines."
                });
            }

            return recommendations;
        }
    }
}

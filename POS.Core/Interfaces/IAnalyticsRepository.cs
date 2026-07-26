using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace POS.Core.Interfaces
{
    public class AnalyticsOverviewRawData
    {
        public decimal TotalRevenue { get; set; }
        public int TotalSalesCount { get; set; }
        public int TotalActiveProducts { get; set; }
        public int LowStockCount { get; set; }
        public int OutOfStockCount { get; set; }
    }

    public class TopSellerRawData
    {
        public int ProductId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public int TotalQuantitySold { get; set; }
        public int TotalBaseUnitsSold { get; set; }
        public decimal TotalRevenue { get; set; }
    }

    public class SlowMoverRawData
    {
        public int ProductId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public int CurrentStock { get; set; }
        public DateTime? LastSaleDate { get; set; }
        public int TotalUnitsSoldPeriod { get; set; }
    }

    public class RevenueTrendRawData
    {
        public DateTime PeriodDate { get; set; }
        public decimal Revenue { get; set; }
        public int TransactionCount { get; set; }
    }

    public interface IAnalyticsRepository
    {
        Task<AnalyticsOverviewRawData> GetOverviewAsync();
        Task<List<TopSellerRawData>> GetTopSellersAsync(int count = 5, DateTime? from = null, DateTime? to = null);
        Task<List<SlowMoverRawData>> GetSlowMoversAsync(int count = 5, int daysThreshold = 30);
        Task<List<RevenueTrendRawData>> GetRevenueTrendsAsync(string period = "daily", DateTime? from = null, DateTime? to = null);
    }
}

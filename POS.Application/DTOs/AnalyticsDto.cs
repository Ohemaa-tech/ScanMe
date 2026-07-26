using System;
using System.Collections.Generic;

namespace POS.Application.DTOs
{
    public class AnalyticsOverviewDto
    {
        public decimal TotalRevenue { get; set; }
        public int TotalSalesCount { get; set; }
        public int TotalActiveProducts { get; set; }
        public int LowStockCount { get; set; }
        public int OutOfStockCount { get; set; }
    }

    public class TopSellerDto
    {
        public int ProductId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public int TotalQuantitySold { get; set; }
        public int TotalBaseUnitsSold { get; set; }
        public decimal TotalRevenue { get; set; }
    }

    public class SlowMoverDto
    {
        public int ProductId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public int CurrentStock { get; set; }
        public DateTime? LastSaleDate { get; set; }
        public int TotalUnitsSoldPeriod { get; set; }
        public int DaysStagnant { get; set; }
    }

    public class RevenueTrendDto
    {
        public string PeriodLabel { get; set; } = string.Empty;
        public DateTime Date { get; set; }
        public decimal Revenue { get; set; }
        public int TransactionCount { get; set; }
    }

    public class AiRecommendationDto
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string Type { get; set; } = string.Empty; // "Reorder", "Discount", "Promote", "Bundle"
        public string Priority { get; set; } = "Medium"; // "High", "Medium", "Low"
        public int? ProductId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public string SuggestedAction { get; set; } = string.Empty;
    }
}

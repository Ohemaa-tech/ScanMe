using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using POS.Application.DTOs;

namespace POS.Application.Services
{
    public interface IAnalyticsService
    {
        Task<AnalyticsOverviewDto> GetOverviewAsync();
        Task<List<TopSellerDto>> GetTopSellersAsync(int count = 5, DateTime? from = null, DateTime? to = null);
        Task<List<SlowMoverDto>> GetSlowMoversAsync(int count = 5, int daysThreshold = 30);
        Task<List<RevenueTrendDto>> GetRevenueTrendsAsync(string period = "daily", DateTime? from = null, DateTime? to = null);
        Task<List<AiRecommendationDto>> GetRecommendationsAsync();
    }
}

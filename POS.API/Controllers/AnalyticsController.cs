using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using POS.Application.DTOs;
using POS.Application.Services;

namespace POS.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Owner")]
    public class AnalyticsController : ControllerBase
    {
        private readonly IAnalyticsService _analyticsService;

        public AnalyticsController(IAnalyticsService analyticsService)
        {
            _analyticsService = analyticsService;
        }

        /// <summary>
        /// Gets overall store sales, revenue, and inventory metrics summary (Owner only).
        /// </summary>
        [HttpGet("overview")]
        public async Task<ActionResult<AnalyticsOverviewDto>> GetOverview()
        {
            var overview = await _analyticsService.GetOverviewAsync();
            return Ok(overview);
        }

        /// <summary>
        /// Gets top-selling products by total revenue and unit volume (Owner only).
        /// </summary>
        [HttpGet("top-sellers")]
        public async Task<ActionResult<List<TopSellerDto>>> GetTopSellers(
            [FromQuery] int count = 5,
            [FromQuery] DateTime? from = null,
            [FromQuery] DateTime? to = null)
        {
            var topSellers = await _analyticsService.GetTopSellersAsync(count, from, to);
            return Ok(topSellers);
        }

        /// <summary>
        /// Gets slow-moving inventory items with high stock and low turnover (Owner only).
        /// </summary>
        [HttpGet("slow-movers")]
        public async Task<ActionResult<List<SlowMoverDto>>> GetSlowMovers(
            [FromQuery] int count = 5,
            [FromQuery] int daysThreshold = 30)
        {
            var slowMovers = await _analyticsService.GetSlowMoversAsync(count, daysThreshold);
            return Ok(slowMovers);
        }

        /// <summary>
        /// Gets periodic revenue trends (daily, weekly, or monthly) (Owner only).
        /// </summary>
        [HttpGet("revenue-trends")]
        public async Task<ActionResult<List<RevenueTrendDto>>> GetRevenueTrends(
            [FromQuery] string period = "daily",
            [FromQuery] DateTime? from = null,
            [FromQuery] DateTime? to = null)
        {
            var trends = await _analyticsService.GetRevenueTrendsAsync(period, from, to);
            return Ok(trends);
        }

        /// <summary>
        /// Gets automated AI insights and recommendations for inventory & promotion (Owner only).
        /// </summary>
        [HttpGet("recommendations")]
        public async Task<ActionResult<List<AiRecommendationDto>>> GetRecommendations()
        {
            var recommendations = await _analyticsService.GetRecommendationsAsync();
            return Ok(recommendations);
        }
    }
}

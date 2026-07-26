using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Moq;
using POS.Application.Services;
using POS.Core.Interfaces;
using Xunit;

namespace POS.Tests.Unit
{
    public class AnalyticsServiceTests
    {
        private readonly Mock<IAnalyticsRepository> _mockRepo;
        private readonly AnalyticsService _analyticsService;

        public AnalyticsServiceTests()
        {
            _mockRepo = new Mock<IAnalyticsRepository>();
            _analyticsService = new AnalyticsService(_mockRepo.Object);
        }

        [Fact]
        public async Task GetOverviewAsync_ShouldReturnMappedDto()
        {
            // Arrange
            _mockRepo.Setup(r => r.GetOverviewAsync()).ReturnsAsync(new AnalyticsOverviewRawData
            {
                TotalRevenue = 1500.50m,
                TotalSalesCount = 42,
                TotalActiveProducts = 15,
                LowStockCount = 3,
                OutOfStockCount = 1
            });

            // Act
            var result = await _analyticsService.GetOverviewAsync();

            // Assert
            Assert.NotNull(result);
            Assert.Equal(1500.50m, result.TotalRevenue);
            Assert.Equal(42, result.TotalSalesCount);
            Assert.Equal(15, result.TotalActiveProducts);
            Assert.Equal(3, result.LowStockCount);
            Assert.Equal(1, result.OutOfStockCount);
        }

        [Fact]
        public async Task GetRecommendationsAsync_WhenOutOfStockExists_ShouldGenerateReorderWarning()
        {
            // Arrange
            _mockRepo.Setup(r => r.GetOverviewAsync()).ReturnsAsync(new AnalyticsOverviewRawData
            {
                OutOfStockCount = 2
            });
            _mockRepo.Setup(r => r.GetTopSellersAsync(It.IsAny<int>(), null, null))
                .ReturnsAsync(new List<TopSellerRawData>());
            _mockRepo.Setup(r => r.GetSlowMoversAsync(It.IsAny<int>(), It.IsAny<int>()))
                .ReturnsAsync(new List<SlowMoverRawData>());

            // Act
            var recommendations = await _analyticsService.GetRecommendationsAsync();

            // Assert
            Assert.NotEmpty(recommendations);
            Assert.Contains(recommendations, r => r.Type == "Reorder" && r.Priority == "High");
        }

        [Fact]
        public async Task GetRecommendationsAsync_WhenSlowMoversExist_ShouldGenerateDiscountSuggestion()
        {
            // Arrange
            _mockRepo.Setup(r => r.GetOverviewAsync()).ReturnsAsync(new AnalyticsOverviewRawData());
            _mockRepo.Setup(r => r.GetTopSellersAsync(It.IsAny<int>(), null, null))
                .ReturnsAsync(new List<TopSellerRawData>());
            _mockRepo.Setup(r => r.GetSlowMoversAsync(It.IsAny<int>(), It.IsAny<int>()))
                .ReturnsAsync(new List<SlowMoverRawData>
                {
                    new SlowMoverRawData
                    {
                        ProductId = 10,
                        ProductName = "Stagnant Juice",
                        CurrentStock = 50,
                        TotalUnitsSoldPeriod = 0
                    }
                });

            // Act
            var recommendations = await _analyticsService.GetRecommendationsAsync();

            // Assert
            Assert.NotEmpty(recommendations);
            Assert.Contains(recommendations, r => r.Type == "Discount" && r.ProductName == "Stagnant Juice");
        }
    }
}

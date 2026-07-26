using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Moq;
using POS.Application.Services;
using POS.Core.Entities;
using POS.Core.Enums;
using POS.Core.Interfaces;
using Xunit;

namespace POS.Tests.Unit
{
    public class AlertServiceTests
    {
        private readonly Mock<IAlertRepository> _alertRepoMock;
        private readonly Mock<IInventoryRepository> _inventoryRepoMock;
        private readonly AlertService _alertService;

        public AlertServiceTests()
        {
            _alertRepoMock = new Mock<IAlertRepository>();
            _inventoryRepoMock = new Mock<IInventoryRepository>();
            _alertService = new AlertService(_alertRepoMock.Object, _inventoryRepoMock.Object);
        }

        [Fact]
        public async Task CheckAndCreateAlertsAsync_LowStock_CreatesLowStockAlert()
        {
            // Arrange
            int productId = 1;
            var product = new Product { Id = productId, Name = "Test Product" };
            var inventory = new Inventory { ProductId = productId, Quantity = 5, LowStockThreshold = 10, Product = product };

            _inventoryRepoMock.Setup(r => r.GetByProductIdAsync(productId)).ReturnsAsync(inventory);
            _alertRepoMock.Setup(r => r.HasActiveAlertForProductAsync(productId, AlertType.LowStock)).ReturnsAsync(false);

            // Act
            await _alertService.CheckAndCreateAlertsAsync(productId);

            // Assert
            _alertRepoMock.Verify(r => r.CreateAlertAsync(It.Is<Alert>(a =>
                a.ProductId == productId &&
                a.AlertType == AlertType.LowStock &&
                !a.IsRead
            )), Times.Once);
        }

        [Fact]
        public async Task CheckAndCreateAlertsAsync_OutOfStock_CreatesOutOfStockAlert()
        {
            // Arrange
            int productId = 2;
            var product = new Product { Id = productId, Name = "Empty Item" };
            var inventory = new Inventory { ProductId = productId, Quantity = 0, LowStockThreshold = 10, Product = product };

            _inventoryRepoMock.Setup(r => r.GetByProductIdAsync(productId)).ReturnsAsync(inventory);
            _alertRepoMock.Setup(r => r.HasActiveAlertForProductAsync(productId, AlertType.OutOfStock)).ReturnsAsync(false);

            // Act
            await _alertService.CheckAndCreateAlertsAsync(productId);

            // Assert
            _alertRepoMock.Verify(r => r.CreateAlertAsync(It.Is<Alert>(a =>
                a.ProductId == productId &&
                a.AlertType == AlertType.OutOfStock &&
                !a.IsRead
            )), Times.Once);
        }

        [Fact]
        public async Task CheckAndCreateAlertsAsync_AlreadyAlerted_DoesNotDuplicate()
        {
            // Arrange
            int productId = 3;
            var product = new Product { Id = productId, Name = "Duplicated Item" };
            var inventory = new Inventory { ProductId = productId, Quantity = 3, LowStockThreshold = 10, Product = product };

            _inventoryRepoMock.Setup(r => r.GetByProductIdAsync(productId)).ReturnsAsync(inventory);
            _alertRepoMock.Setup(r => r.HasActiveAlertForProductAsync(productId, AlertType.LowStock)).ReturnsAsync(true);

            // Act
            await _alertService.CheckAndCreateAlertsAsync(productId);

            // Assert
            _alertRepoMock.Verify(r => r.CreateAlertAsync(It.IsAny<Alert>()), Times.Never);
        }

        [Fact]
        public async Task CheckAndCreateAlertsAsync_RestockedAboveThreshold_DismissesActiveAlerts()
        {
            // Arrange
            int productId = 4;
            var product = new Product { Id = productId, Name = "Restocked Item" };
            var inventory = new Inventory { ProductId = productId, Quantity = 50, LowStockThreshold = 10, Product = product };

            _inventoryRepoMock.Setup(r => r.GetByProductIdAsync(productId)).ReturnsAsync(inventory);

            // Act
            await _alertService.CheckAndCreateAlertsAsync(productId);

            // Assert
            _alertRepoMock.Verify(r => r.DismissActiveAlertsForProductAsync(productId), Times.Once);
            _alertRepoMock.Verify(r => r.CreateAlertAsync(It.IsAny<Alert>()), Times.Never);
        }

        [Fact]
        public async Task GetUnreadBadgeCountAsync_ReturnsCountFromRepo()
        {
            // Arrange
            _alertRepoMock.Setup(r => r.GetUnreadCountAsync()).ReturnsAsync(7);

            // Act
            int count = await _alertService.GetUnreadBadgeCountAsync();

            // Assert
            Assert.Equal(7, count);
        }

        [Fact]
        public async Task MarkAlertReadAsync_ExistingAlert_UpdatesIsReadToTrue()
        {
            // Arrange
            var alert = new Alert { Id = 10, ProductId = 1, IsRead = false };
            _alertRepoMock.Setup(r => r.GetByIdAsync(10)).ReturnsAsync(alert);

            // Act
            bool result = await _alertService.MarkAlertReadAsync(10);

            // Assert
            Assert.True(result);
            Assert.True(alert.IsRead);
            _alertRepoMock.Verify(r => r.UpdateAlertAsync(alert), Times.Once);
        }
    }
}

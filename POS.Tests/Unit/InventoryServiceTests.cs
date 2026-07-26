using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Moq;
using POS.Application.DTOs;
using POS.Application.Services;
using POS.Core.Entities;
using POS.Core.Interfaces;
using Xunit;

namespace POS.Tests.Unit
{
    public class InventoryServiceTests
    {
        private readonly Mock<IInventoryRepository> _inventoryRepoMock;
        private readonly Mock<IProductRepository> _productRepoMock;
        private readonly Mock<IAlertService> _alertServiceMock;
        private readonly InventoryService _inventoryService;

        public InventoryServiceTests()
        {
            _inventoryRepoMock = new Mock<IInventoryRepository>();
            _productRepoMock = new Mock<IProductRepository>();
            _alertServiceMock = new Mock<IAlertService>();

            _inventoryService = new InventoryService(_inventoryRepoMock.Object, _productRepoMock.Object, _alertServiceMock.Object);
        }

        [Fact]
        public async Task RestockProductAsync_BulkCarton_IncrementsBaseStockCorrectly()
        {
            // Arrange
            var cartonUnit = new ProductUnit
            {
                Id = 15,
                ProductId = 3,
                UnitName = "Carton of 24",
                ConversionFactor = 24,
                Price = 36.00m
            };

            var product = new Product
            {
                Id = 3,
                Name = "Mineral Water",
                BaseUnitName = "Bottle",
                IsActive = true,
                Units = new List<ProductUnit> { cartonUnit }
            };

            var inventory = new Inventory
            {
                Id = 200,
                ProductId = 3,
                Quantity = 10,
                LowStockThreshold = 15,
                Product = product
            };

            _productRepoMock.Setup(r => r.GetProductByIdAsync(3)).ReturnsAsync(product);
            _inventoryRepoMock.Setup(r => r.GetByProductIdAsync(3)).ReturnsAsync(inventory);

            var restockDto = new RestockRequestDto
            {
                ProductId = 3,
                ProductUnitId = 15,
                QuantityRestocked = 5 // 5 cartons * 24 = 120 base units
            };

            // Act
            var result = await _inventoryService.RestockProductAsync(restockDto, userId: 1);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(130, inventory.Quantity); // 10 + 120 = 130
            Assert.Equal(1, inventory.LastRestockedBy);
            _inventoryRepoMock.Verify(r => r.UpdateInventoryAsync(It.Is<Inventory>(i => i.Quantity == 130)), Times.Once);
        }

        [Fact]
        public async Task UpdateInventoryAsync_ModifiesStockAndThreshold()
        {
            // Arrange
            var product = new Product { Id = 4, Name = "Chocolate Bar", IsActive = true };
            var inventory = new Inventory { Id = 201, ProductId = 4, Quantity = 5, LowStockThreshold = 10, Product = product };

            _inventoryRepoMock.Setup(r => r.GetByProductIdAsync(4)).ReturnsAsync(inventory);

            var updateDto = new UpdateInventoryRequestDto
            {
                Quantity = 50,
                LowStockThreshold = 15
            };

            // Act
            var result = await _inventoryService.UpdateInventoryAsync(4, updateDto);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(50, inventory.Quantity);
            Assert.Equal(15, inventory.LowStockThreshold);
            _inventoryRepoMock.Verify(r => r.UpdateInventoryAsync(It.Is<Inventory>(i => i.Quantity == 50 && i.LowStockThreshold == 15)), Times.Once);
        }
    }
}

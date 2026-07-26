using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Moq;
using POS.Application.DTOs;
using POS.Application.Services;
using POS.Core.Entities;
using POS.Core.Exceptions;
using POS.Core.Interfaces;
using Xunit;

namespace POS.Tests.Unit
{
    public class SaleServiceTests
    {
        private readonly Mock<ISaleRepository> _saleRepoMock;
        private readonly Mock<IProductRepository> _productRepoMock;
        private readonly Mock<IInventoryRepository> _inventoryRepoMock;
        private readonly Mock<IAlertService> _alertServiceMock;
        private readonly SaleService _saleService;

        public SaleServiceTests()
        {
            _saleRepoMock = new Mock<ISaleRepository>();
            _productRepoMock = new Mock<IProductRepository>();
            _inventoryRepoMock = new Mock<IInventoryRepository>();
            _alertServiceMock = new Mock<IAlertService>();

            _saleService = new SaleService(_saleRepoMock.Object, _productRepoMock.Object, _inventoryRepoMock.Object, _alertServiceMock.Object);
        }

        [Fact]
        public async Task CompleteSaleAsync_BulkAndSingleUnitScan_DeductsBaseStockCorrectlyAndReturnsSale()
        {
            // Arrange
            var product = new Product { Id = 1, Name = "Fruit Juice", BaseUnitName = "Bottle", IsActive = true };
            var cartonUnit = new ProductUnit
            {
                Id = 10,
                ProductId = 1,
                UnitName = "Carton of 24",
                Barcode = "9900112233",
                ConversionFactor = 24,
                Price = 40.00m,
                Product = product
            };

            var inventory = new Inventory { Id = 100, ProductId = 1, Quantity = 100, LowStockThreshold = 10, Product = product };

            _productRepoMock.Setup(r => r.GetProductUnitByIdAsync(10)).ReturnsAsync(cartonUnit);
            _inventoryRepoMock.Setup(r => r.GetByProductIdAsync(1)).ReturnsAsync(inventory);
            Sale createdSale = null!;
            _saleRepoMock.Setup(r => r.CreateSaleAsync(It.IsAny<Sale>()))
                .ReturnsAsync((Sale s) =>
                {
                    s.Id = 55;
                    createdSale = s;
                    return s;
                });
            _saleRepoMock.Setup(r => r.GetSaleByIdAsync(55))
                .ReturnsAsync(() => createdSale);

            var dto = new CreateSaleRequestDto
            {
                PaymentMethod = "Cash",
                Notes = "Bulk sale test",
                Items = new List<CreateSaleItemDto>
                {
                    new CreateSaleItemDto { ProductUnitId = 10, Quantity = 2 } // 2 cartons = 48 base units
                }
            };

            // Act
            var result = await _saleService.CompleteSaleAsync(dto, userId: 2);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(80.00m, result.TotalAmount); // 2 * 40.00m
            Assert.Equal(52, inventory.Quantity); // 100 - 48 = 52
            _inventoryRepoMock.Verify(r => r.UpdateInventoryAsync(It.Is<Inventory>(i => i.Quantity == 52)), Times.Once);
            _saleRepoMock.Verify(r => r.CreateSaleAsync(It.IsAny<Sale>()), Times.Once);
        }

        [Fact]
        public async Task CompleteSaleAsync_InsufficientStock_ThrowsInsufficientStockException()
        {
            // Arrange
            var product = new Product { Id = 2, Name = "Energy Drink", BaseUnitName = "Can", IsActive = true };
            var packUnit = new ProductUnit
            {
                Id = 20,
                ProductId = 2,
                UnitName = "Pack of 6",
                Barcode = "8800112233",
                ConversionFactor = 6,
                Price = 12.00m,
                Product = product
            };

            var inventory = new Inventory { Id = 101, ProductId = 2, Quantity = 10, LowStockThreshold = 5, Product = product };

            _productRepoMock.Setup(r => r.GetProductUnitByIdAsync(20)).ReturnsAsync(packUnit);
            _inventoryRepoMock.Setup(r => r.GetByProductIdAsync(2)).ReturnsAsync(inventory);

            var dto = new CreateSaleRequestDto
            {
                PaymentMethod = "Card",
                Items = new List<CreateSaleItemDto>
                {
                    new CreateSaleItemDto { ProductUnitId = 20, Quantity = 3 } // 3 packs = 18 base units required, but only 10 available
                }
            };

            // Act & Assert
            var ex = await Assert.ThrowsAsync<InsufficientStockException>(() => _saleService.CompleteSaleAsync(dto, userId: 2));
            Assert.Equal("Energy Drink", ex.ProductName);
            Assert.Equal(10, ex.Available);
            Assert.Equal(18, ex.Required);
            _saleRepoMock.Verify(r => r.CreateSaleAsync(It.IsAny<Sale>()), Times.Never);
        }
    }
}

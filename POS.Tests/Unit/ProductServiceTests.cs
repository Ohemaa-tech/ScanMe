using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Moq;
using POS.Application.DTOs;
using POS.Application.Services;
using POS.Core.Entities;
using POS.Core.Interfaces;
using Xunit;

namespace POS.Tests.Unit
{
    public class ProductServiceTests
    {
        private readonly Mock<IProductRepository> _productRepoMock;
        private readonly Mock<IExternalBarcodeService> _externalBarcodeMock;
        private readonly ProductService _productService;

        public ProductServiceTests()
        {
            _productRepoMock = new Mock<IProductRepository>();
            _externalBarcodeMock = new Mock<IExternalBarcodeService>();

            _productService = new ProductService(_productRepoMock.Object, _externalBarcodeMock.Object);
        }

        [Fact]
        public async Task CreateProductAsync_ValidDualUnitProduct_CreatesAndReturnsDto()
        {
            // Arrange
            _productRepoMock.Setup(r => r.BarcodeExistsAsync(It.IsAny<string>()))
                .ReturnsAsync(false);

            _productRepoMock.Setup(r => r.CreateProductAsync(It.IsAny<Product>()))
                .ReturnsAsync((Product p) =>
                {
                    p.Id = 10;
                    return p;
                });

            var createDto = new CreateProductDto
            {
                Name = "Test Soft Drink",
                BaseUnitName = "Can",
                Category = "Beverages",
                Brand = "TestBrand",
                InitialBaseStock = 120,
                LowStockThreshold = 12,
                Units = new List<CreateProductUnitDto>
                {
                    new CreateProductUnitDto
                    {
                        UnitName = "Single Can",
                        Barcode = "11111111111",
                        ConversionFactor = 1,
                        Price = 1.00m,
                        IsDefault = true
                    },
                    new CreateProductUnitDto
                    {
                        UnitName = "Pack of 12",
                        Barcode = "11111111112",
                        ConversionFactor = 12,
                        Price = 10.00m,
                        IsDefault = false
                    }
                }
            };

            // Act
            var result = await _productService.CreateProductAsync(createDto);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(10, result.Id);
            Assert.Equal("Test Soft Drink", result.Name);
            Assert.Equal(2, result.Units.Count);
            Assert.Equal(120, result.CurrentBaseStock);
        }

        [Fact]
        public async Task GetProductUnitByBarcodeAsync_ExistingBarcode_ReturnsUnitResponse()
        {
            // Arrange
            var unit = new ProductUnit
            {
                Id = 5,
                ProductId = 2,
                UnitName = "Carton of 24",
                Barcode = "999888777666",
                ConversionFactor = 24,
                Price = 25.50m
            };

            _productRepoMock.Setup(r => r.GetProductUnitByBarcodeAsync("999888777666"))
                .ReturnsAsync(unit);

            // Act
            var result = await _productService.GetProductUnitByBarcodeAsync("999888777666");

            // Assert
            Assert.NotNull(result);
            Assert.Equal("Carton of 24", result.UnitName);
            Assert.Equal(24, result.ConversionFactor);
            Assert.Equal(25.50m, result.Price);
        }

        [Fact]
        public async Task LookupExternalBarcodeAsync_CallsExternalService()
        {
            // Arrange
            var lookupResult = new ExternalProductLookupResult
            {
                Found = true,
                Barcode = "737628064502",
                Name = "Thai Noodle Kit",
                Brand = "Simply Asia"
            };

            _externalBarcodeMock.Setup(s => s.LookupBarcodeAsync("737628064502"))
                .ReturnsAsync(lookupResult);

            // Act
            var result = await _productService.LookupExternalBarcodeAsync("737628064502");

            // Assert
            Assert.True(result.Found);
            Assert.Equal("Thai Noodle Kit", result.Name);
            Assert.Equal("Simply Asia", result.Brand);
        }
    }
}

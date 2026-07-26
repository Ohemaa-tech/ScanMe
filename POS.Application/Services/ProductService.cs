using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using POS.Application.DTOs;
using POS.Core.Entities;
using POS.Core.Interfaces;

namespace POS.Application.Services
{
    public interface IProductService
    {
        Task<IEnumerable<ProductResponseDto>> GetAllProductsAsync(string? search = null, string? category = null);
        Task<ProductResponseDto?> GetProductByIdAsync(int id);
        Task<ProductUnitResponseDto?> GetProductUnitByBarcodeAsync(string barcode);
        Task<ExternalProductLookupResult> LookupExternalBarcodeAsync(string barcode);
        Task<ProductResponseDto> CreateProductAsync(CreateProductDto dto);
        Task<ProductResponseDto?> UpdateProductAsync(int id, UpdateProductDto dto);
        Task<bool> DeleteProductAsync(int id);
    }

    public class ProductService : IProductService
    {
        private readonly IProductRepository _productRepository;
        private readonly IExternalBarcodeService _externalBarcodeService;

        public ProductService(IProductRepository productRepository, IExternalBarcodeService externalBarcodeService)
        {
            _productRepository = productRepository;
            _externalBarcodeService = externalBarcodeService;
        }

        public async Task<IEnumerable<ProductResponseDto>> GetAllProductsAsync(string? search = null, string? category = null)
        {
            var products = await _productRepository.GetAllProductsAsync(search, category);
            return products.Select(MapToResponseDto);
        }

        public async Task<ProductResponseDto?> GetProductByIdAsync(int id)
        {
            var product = await _productRepository.GetProductByIdAsync(id);
            return product == null ? null : MapToResponseDto(product);
        }

        public async Task<ProductUnitResponseDto?> GetProductUnitByBarcodeAsync(string barcode)
        {
            var unit = await _productRepository.GetProductUnitByBarcodeAsync(barcode);
            if (unit == null) return null;

            return new ProductUnitResponseDto
            {
                Id = unit.Id,
                ProductId = unit.ProductId,
                UnitName = unit.UnitName,
                Barcode = unit.Barcode,
                ConversionFactor = unit.ConversionFactor,
                Price = unit.Price,
                IsDefault = unit.IsDefault
            };
        }

        public async Task<ExternalProductLookupResult> LookupExternalBarcodeAsync(string barcode)
        {
            return await _externalBarcodeService.LookupBarcodeAsync(barcode);
        }

        public async Task<ProductResponseDto> CreateProductAsync(CreateProductDto dto)
        {
            // Check barcode duplicates
            foreach (var u in dto.Units)
            {
                if (await _productRepository.BarcodeExistsAsync(u.Barcode))
                {
                    throw new InvalidOperationException($"Barcode '{u.Barcode}' is already registered.");
                }
            }

            var product = new Product
            {
                Name = dto.Name,
                BaseUnitName = dto.BaseUnitName,
                Category = dto.Category,
                Brand = dto.Brand,
                Description = dto.Description,
                ImageUrl = dto.ImageUrl,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                Units = dto.Units.Select(u => new ProductUnit
                {
                    UnitName = u.UnitName,
                    Barcode = u.Barcode,
                    ConversionFactor = u.ConversionFactor,
                    Price = u.Price,
                    IsDefault = u.IsDefault
                }).ToList(),
                Inventory = new Inventory
                {
                    Quantity = dto.InitialBaseStock,
                    LowStockThreshold = dto.LowStockThreshold,
                    LastUpdatedAt = DateTime.UtcNow
                }
            };

            await _productRepository.CreateProductAsync(product);
            return MapToResponseDto(product);
        }

        public async Task<ProductResponseDto?> UpdateProductAsync(int id, UpdateProductDto dto)
        {
            var product = await _productRepository.GetProductByIdAsync(id);
            if (product == null) return null;

            product.Name = dto.Name;
            product.BaseUnitName = dto.BaseUnitName;
            product.Category = dto.Category;
            product.Brand = dto.Brand;
            product.Description = dto.Description;
            product.ImageUrl = dto.ImageUrl;
            product.UpdatedAt = DateTime.UtcNow;

            await _productRepository.UpdateProductAsync(product);
            return MapToResponseDto(product);
        }

        public async Task<bool> DeleteProductAsync(int id)
        {
            var product = await _productRepository.GetProductByIdAsync(id);
            if (product == null) return false;

            await _productRepository.DeleteProductAsync(id);
            return true;
        }

        private static ProductResponseDto MapToResponseDto(Product product)
        {
            return new ProductResponseDto
            {
                Id = product.Id,
                Name = product.Name,
                BaseUnitName = product.BaseUnitName,
                Category = product.Category,
                Brand = product.Brand,
                Description = product.Description,
                ImageUrl = product.ImageUrl,
                IsActive = product.IsActive,
                CurrentBaseStock = product.Inventory?.Quantity ?? 0,
                LowStockThreshold = product.Inventory?.LowStockThreshold ?? 10,
                Units = product.Units.Select(u => new ProductUnitResponseDto
                {
                    Id = u.Id,
                    ProductId = u.ProductId,
                    UnitName = u.UnitName,
                    Barcode = u.Barcode,
                    ConversionFactor = u.ConversionFactor,
                    Price = u.Price,
                    IsDefault = u.IsDefault
                }).ToList()
            };
        }
    }
}

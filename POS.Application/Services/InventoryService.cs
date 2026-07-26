using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using POS.Application.DTOs;
using POS.Core.Entities;
using POS.Core.Interfaces;

namespace POS.Application.Services
{
    public interface IInventoryService
    {
        Task<IEnumerable<InventoryResponseDto>> GetInventoriesAsync(string? search = null, string? status = null);
        Task<InventoryResponseDto?> GetByProductIdAsync(int productId);
        Task<InventoryResponseDto> RestockProductAsync(RestockRequestDto dto, int userId);
        Task<InventoryResponseDto?> UpdateInventoryAsync(int productId, UpdateInventoryRequestDto dto);
    }

    public class InventoryService : IInventoryService
    {
        private readonly IInventoryRepository _inventoryRepository;
        private readonly IProductRepository _productRepository;
        private readonly IAlertService _alertService;

        public InventoryService(IInventoryRepository inventoryRepository, IProductRepository productRepository, IAlertService alertService)
        {
            _inventoryRepository = inventoryRepository;
            _productRepository = productRepository;
            _alertService = alertService;
        }

        public async Task<IEnumerable<InventoryResponseDto>> GetInventoriesAsync(string? search = null, string? status = null)
        {
            var inventories = await _inventoryRepository.GetInventoriesAsync(search, status);
            return inventories.Select(MapToResponseDto);
        }

        public async Task<InventoryResponseDto?> GetByProductIdAsync(int productId)
        {
            var inventory = await _inventoryRepository.GetByProductIdAsync(productId);
            return inventory == null ? null : MapToResponseDto(inventory);
        }

        public async Task<InventoryResponseDto> RestockProductAsync(RestockRequestDto dto, int userId)
        {
            var product = await _productRepository.GetProductByIdAsync(dto.ProductId);
            if (product == null || !product.IsActive)
            {
                throw new KeyNotFoundException($"Product with ID {dto.ProductId} was not found or is inactive.");
            }

            int baseUnitsToAdd = dto.QuantityRestocked;
            if (dto.ProductUnitId.HasValue)
            {
                var unit = product.Units.FirstOrDefault(u => u.Id == dto.ProductUnitId.Value);
                if (unit == null)
                {
                    throw new KeyNotFoundException($"Product unit with ID {dto.ProductUnitId.Value} was not found for product '{product.Name}'.");
                }
                baseUnitsToAdd = dto.QuantityRestocked * unit.ConversionFactor;
            }

            var inventory = await _inventoryRepository.GetByProductIdAsync(dto.ProductId);
            if (inventory == null)
            {
                inventory = new Inventory
                {
                    ProductId = dto.ProductId,
                    Quantity = 0,
                    LowStockThreshold = 10
                };
            }

            inventory.Quantity += baseUnitsToAdd;
            inventory.LastUpdatedAt = DateTime.UtcNow;
            inventory.LastRestockedBy = userId;

            await _inventoryRepository.UpdateInventoryAsync(inventory);
            await _alertService.CheckAndCreateAlertsAsync(dto.ProductId);

            var updatedInventory = await _inventoryRepository.GetByProductIdAsync(dto.ProductId) ?? inventory;
            return MapToResponseDto(updatedInventory);
        }

        public async Task<InventoryResponseDto?> UpdateInventoryAsync(int productId, UpdateInventoryRequestDto dto)
        {
            var inventory = await _inventoryRepository.GetByProductIdAsync(productId);
            if (inventory == null)
            {
                return null;
            }

            if (dto.Quantity.HasValue)
            {
                inventory.Quantity = dto.Quantity.Value;
            }

            if (dto.LowStockThreshold.HasValue)
            {
                inventory.LowStockThreshold = dto.LowStockThreshold.Value;
            }

            inventory.LastUpdatedAt = DateTime.UtcNow;
            await _inventoryRepository.UpdateInventoryAsync(inventory);
            await _alertService.CheckAndCreateAlertsAsync(productId);

            return MapToResponseDto(inventory);
        }

        private static InventoryResponseDto MapToResponseDto(Inventory inventory)
        {
            string stockStatus = "OK";
            if (inventory.Quantity <= 0)
            {
                stockStatus = "OutOfStock";
            }
            else if (inventory.Quantity <= inventory.LowStockThreshold)
            {
                stockStatus = "LowStock";
            }

            return new InventoryResponseDto
            {
                Id = inventory.Id,
                ProductId = inventory.ProductId,
                ProductName = inventory.Product?.Name ?? string.Empty,
                BaseUnitName = inventory.Product?.BaseUnitName ?? "Piece",
                Quantity = inventory.Quantity,
                LowStockThreshold = inventory.LowStockThreshold,
                StockStatus = stockStatus,
                LastUpdatedAt = inventory.LastUpdatedAt,
                LastRestockedBy = inventory.LastRestockedBy,
                LastRestockedByName = inventory.LastRestockedByUser?.FullName ?? inventory.LastRestockedByUser?.Username,
                Units = inventory.Product?.Units.Select(u => new ProductUnitResponseDto
                {
                    Id = u.Id,
                    ProductId = u.ProductId,
                    UnitName = u.UnitName,
                    Barcode = u.Barcode,
                    ConversionFactor = u.ConversionFactor,
                    Price = u.Price,
                    IsDefault = u.IsDefault
                }).ToList() ?? new List<ProductUnitResponseDto>()
            };
        }
    }
}

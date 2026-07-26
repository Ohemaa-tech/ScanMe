using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using POS.Application.DTOs;
using POS.Core.Entities;
using POS.Core.Exceptions;
using POS.Core.Interfaces;

namespace POS.Application.Services
{
    public interface ISaleService
    {
        Task<SaleResponseDto> CompleteSaleAsync(CreateSaleRequestDto dto, int userId);
        Task<IEnumerable<SaleResponseDto>> GetSalesAsync(DateTime? from = null, DateTime? to = null, int page = 1, int pageSize = 20);
        Task<SaleResponseDto?> GetSaleByIdAsync(int id);
    }

    public class SaleService : ISaleService
    {
        private readonly ISaleRepository _saleRepository;
        private readonly IProductRepository _productRepository;
        private readonly IInventoryRepository _inventoryRepository;
        private readonly IAlertService _alertService;

        public SaleService(
            ISaleRepository saleRepository,
            IProductRepository productRepository,
            IInventoryRepository inventoryRepository,
            IAlertService alertService)
        {
            _saleRepository = saleRepository;
            _productRepository = productRepository;
            _inventoryRepository = inventoryRepository;
            _alertService = alertService;
        }

        public async Task<SaleResponseDto> CompleteSaleAsync(CreateSaleRequestDto dto, int userId)
        {
            if (dto.Items == null || !dto.Items.Any())
            {
                throw new ArgumentException("A sale must contain at least one item.");
            }

            // 1. Gather all ProductUnits and validate existence
            var preparedItems = new List<(ProductUnit Unit, int Quantity, int BaseUnitsDeducted, decimal LineTotal)>();

            foreach (var itemDto in dto.Items)
            {
                var unit = await _productRepository.GetProductUnitByIdAsync(itemDto.ProductUnitId);
                if (unit == null || unit.Product == null || !unit.Product.IsActive)
                {
                    throw new KeyNotFoundException($"Product unit with ID {itemDto.ProductUnitId} was not found or is inactive.");
                }

                int baseUnitsDeducted = itemDto.Quantity * unit.ConversionFactor;
                decimal lineTotal = itemDto.Quantity * unit.Price;

                preparedItems.Add((unit, itemDto.Quantity, baseUnitsDeducted, lineTotal));
            }

            // 2. Group by ProductId and verify inventory sufficiency
            var productBaseUnitsGrouped = preparedItems
                .GroupBy(x => x.Unit.ProductId)
                .Select(g => new
                {
                    ProductId = g.Key,
                    ProductName = g.First().Unit.Product!.Name,
                    TotalRequiredBaseUnits = g.Sum(x => x.BaseUnitsDeducted)
                });

            var inventoryUpdates = new List<(Inventory Inventory, int NewQuantity)>();

            foreach (var req in productBaseUnitsGrouped)
            {
                var inventory = await _inventoryRepository.GetByProductIdAsync(req.ProductId);
                if (inventory == null)
                {
                    throw new InvalidOperationException($"Inventory record for product '{req.ProductName}' was not found.");
                }

                if (inventory.Quantity < req.TotalRequiredBaseUnits)
                {
                    throw new InsufficientStockException(req.ProductName, inventory.Quantity, req.TotalRequiredBaseUnits);
                }

                inventoryUpdates.Add((inventory, inventory.Quantity - req.TotalRequiredBaseUnits));
            }

            // 3. Create Sale entity
            var sale = new Sale
            {
                UserId = userId,
                SaleDate = DateTime.UtcNow,
                PaymentMethod = dto.PaymentMethod,
                Notes = dto.Notes,
                TaxAmount = 0,
                TotalAmount = preparedItems.Sum(x => x.LineTotal),
                SaleItems = preparedItems.Select(x => new SaleItem
                {
                    ProductId = x.Unit.ProductId,
                    ProductUnitId = x.Unit.Id,
                    UnitName = x.Unit.UnitName,
                    Quantity = x.Quantity,
                    ConversionFactor = x.Unit.ConversionFactor,
                    BaseUnitsDeducted = x.BaseUnitsDeducted,
                    UnitPrice = x.Unit.Price,
                    LineTotal = x.LineTotal
                }).ToList()
            };

            // 4. Update inventory stock atomically
            foreach (var (inventory, newQuantity) in inventoryUpdates)
            {
                inventory.Quantity = newQuantity;
                await _inventoryRepository.UpdateInventoryAsync(inventory);
                await _alertService.CheckAndCreateAlertsAsync(inventory.ProductId);
            }

            // 5. Persist Sale
            var createdSale = await _saleRepository.CreateSaleAsync(sale);

            // Re-fetch created sale with nav properties if needed or map directly
            var resultSale = await _saleRepository.GetSaleByIdAsync(createdSale.Id) ?? createdSale;
            return MapToResponseDto(resultSale);
        }

        public async Task<IEnumerable<SaleResponseDto>> GetSalesAsync(DateTime? from = null, DateTime? to = null, int page = 1, int pageSize = 20)
        {
            var sales = await _saleRepository.GetSalesAsync(from, to, page, pageSize);
            return sales.Select(MapToResponseDto);
        }

        public async Task<SaleResponseDto?> GetSaleByIdAsync(int id)
        {
            var sale = await _saleRepository.GetSaleByIdAsync(id);
            return sale == null ? null : MapToResponseDto(sale);
        }

        private static SaleResponseDto MapToResponseDto(Sale sale)
        {
            return new SaleResponseDto
            {
                Id = sale.Id,
                UserId = sale.UserId,
                UserName = sale.User?.FullName ?? sale.User?.Username ?? $"User #{sale.UserId}",
                SaleDate = sale.SaleDate,
                TotalAmount = sale.TotalAmount,
                TaxAmount = sale.TaxAmount,
                PaymentMethod = sale.PaymentMethod,
                Notes = sale.Notes,
                Items = sale.SaleItems.Select(si => new SaleItemResponseDto
                {
                    Id = si.Id,
                    ProductId = si.ProductId,
                    ProductName = si.Product?.Name ?? string.Empty,
                    ProductUnitId = si.ProductUnitId,
                    UnitName = si.UnitName,
                    Quantity = si.Quantity,
                    ConversionFactor = si.ConversionFactor,
                    BaseUnitsDeducted = si.BaseUnitsDeducted,
                    UnitPrice = si.UnitPrice,
                    LineTotal = si.LineTotal
                }).ToList()
            };
        }
    }
}

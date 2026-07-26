using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace POS.Application.DTOs
{
    public class InventoryResponseDto
    {
        public int Id { get; set; }
        public int ProductId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public string BaseUnitName { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public int LowStockThreshold { get; set; }
        public string StockStatus { get; set; } = string.Empty; // OK, LowStock, OutOfStock
        public DateTime LastUpdatedAt { get; set; }
        public int? LastRestockedBy { get; set; }
        public string? LastRestockedByName { get; set; }
        public List<ProductUnitResponseDto> Units { get; set; } = new();
    }

    public class RestockRequestDto
    {
        [Required]
        public int ProductId { get; set; }

        // Optional ProductUnitId. If null, quantityRestocked is interpreted as direct base units.
        // If specified, quantityRestocked is multiplied by unit's ConversionFactor.
        public int? ProductUnitId { get; set; }

        [Range(1, int.MaxValue, ErrorMessage = "Restock quantity must be at least 1.")]
        public int QuantityRestocked { get; set; }
    }

    public class UpdateInventoryRequestDto
    {
        [Range(0, int.MaxValue, ErrorMessage = "Quantity cannot be negative.")]
        public int? Quantity { get; set; }

        [Range(0, int.MaxValue, ErrorMessage = "Low stock threshold cannot be negative.")]
        public int? LowStockThreshold { get; set; }
    }
}

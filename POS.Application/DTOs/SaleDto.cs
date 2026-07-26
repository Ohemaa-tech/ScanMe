using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace POS.Application.DTOs
{
    public class CreateSaleItemDto
    {
        [Required]
        public int ProductUnitId { get; set; }

        [Range(1, int.MaxValue, ErrorMessage = "Quantity must be at least 1.")]
        public int Quantity { get; set; }
    }

    public class CreateSaleRequestDto
    {
        [Required]
        public List<CreateSaleItemDto> Items { get; set; } = new();

        [Required]
        public string PaymentMethod { get; set; } = "Cash"; // Cash, Card, Mobile Money

        public string? Notes { get; set; }
    }

    public class SaleItemResponseDto
    {
        public int Id { get; set; }
        public int ProductId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public int ProductUnitId { get; set; }
        public string UnitName { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public int ConversionFactor { get; set; }
        public int BaseUnitsDeducted { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal LineTotal { get; set; }
    }

    public class SaleResponseDto
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public DateTime SaleDate { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal TaxAmount { get; set; }
        public string PaymentMethod { get; set; } = string.Empty;
        public string? Notes { get; set; }
        public List<SaleItemResponseDto> Items { get; set; } = new();
    }
}

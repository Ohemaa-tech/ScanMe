using System;
using System.Collections.Generic;

namespace POS.Core.Entities
{
    public class Sale
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public DateTime SaleDate { get; set; } = DateTime.UtcNow;
        public decimal TotalAmount { get; set; }
        public decimal TaxAmount { get; set; } = 0;
        public string PaymentMethod { get; set; } = "Cash";
        public string? Notes { get; set; }

        // Navigation
        public User? User { get; set; }
        public List<SaleItem> SaleItems { get; set; } = new();
    }

    public class SaleItem
    {
        public int Id { get; set; }
        public int SaleId { get; set; }
        public int ProductId { get; set; }
        public int ProductUnitId { get; set; }
        public string UnitName { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public int ConversionFactor { get; set; }
        public int BaseUnitsDeducted { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal LineTotal { get; set; }

        // Navigation
        public Sale? Sale { get; set; }
        public Product? Product { get; set; }
        public ProductUnit? ProductUnit { get; set; }
    }
}

using System;

namespace POS.Core.Entities
{
    public class Inventory
    {
        public int Id { get; set; }
        public int ProductId { get; set; }
        public int Quantity { get; set; } = 0; // In base units
        public int LowStockThreshold { get; set; } = 10;
        public DateTime LastUpdatedAt { get; set; } = DateTime.UtcNow;
        public int? LastRestockedBy { get; set; }

        // Navigation properties
        public Product? Product { get; set; }
        public User? LastRestockedByUser { get; set; }
    }
}

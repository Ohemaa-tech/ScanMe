using System;
using System.Collections.Generic;

namespace POS.Core.Entities
{
    public class Product
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string BaseUnitName { get; set; } = "Piece";
        public string? Category { get; set; }
        public string? Brand { get; set; }
        public string? Description { get; set; }
        public string? ImageUrl { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public List<ProductUnit> Units { get; set; } = new();
        public Inventory? Inventory { get; set; }
    }
}

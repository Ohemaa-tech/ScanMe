using System;
using POS.Core.Enums;

namespace POS.Core.Entities
{
    public class Alert
    {
        public int Id { get; set; }
        public int ProductId { get; set; }
        public AlertType AlertType { get; set; } = AlertType.LowStock;
        public string Message { get; set; } = string.Empty;
        public bool IsRead { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public Product? Product { get; set; }
    }
}

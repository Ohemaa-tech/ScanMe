namespace POS.Core.Entities
{
    public class ProductUnit
    {
        public int Id { get; set; }
        public int ProductId { get; set; }
        public string UnitName { get; set; } = string.Empty; // e.g. Single Bottle, Carton of 24
        public string Barcode { get; set; } = string.Empty;
        public int ConversionFactor { get; set; } = 1; // Single = 1, Carton of 24 = 24
        public decimal Price { get; set; }
        public bool IsDefault { get; set; } = false;

        // Navigation property
        public Product? Product { get; set; }
    }
}

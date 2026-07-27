using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace POS.Application.DTOs
{
    public class CreateProductUnitDto
    {
        [Required]
        public string UnitName { get; set; } = string.Empty; // e.g. Single Bottle, Carton of 24

        [Required]
        public string Barcode { get; set; } = string.Empty;

        [Range(1, int.MaxValue)]
        public int ConversionFactor { get; set; } = 1; // Single = 1, Carton = 24

        [Range(0.0, double.MaxValue)]
        public decimal Price { get; set; }

        public bool IsDefault { get; set; } = false;
    }

    public class CreateProductDto
    {
        [Required]
        public string Name { get; set; } = string.Empty;

        public string BaseUnitName { get; set; } = "Piece";
        public string? Category { get; set; }
        public string? Brand { get; set; }
        public string? Description { get; set; }
        public string? ImageUrl { get; set; }

        [Required]
        public List<CreateProductUnitDto> Units { get; set; } = new();

        public int InitialBaseStock { get; set; } = 0;
        public int LowStockThreshold { get; set; } = 10;
    }

    public class UpdateProductDto
    {
        [Required]
        public string Name { get; set; } = string.Empty;

        public string BaseUnitName { get; set; } = "Piece";
        public string? Category { get; set; }
        public string? Brand { get; set; }
        public string? Description { get; set; }
        public string? ImageUrl { get; set; }

        public List<CreateProductUnitDto> Units { get; set; } = new();

        public int InitialBaseStock { get; set; } = 0;
        public int LowStockThreshold { get; set; } = 10;
    }

    public class ProductUnitResponseDto
    {
        public int Id { get; set; }
        public int ProductId { get; set; }
        public string UnitName { get; set; } = string.Empty;
        public string Barcode { get; set; } = string.Empty;
        public int ConversionFactor { get; set; }
        public decimal Price { get; set; }
        public bool IsDefault { get; set; }
    }

    public class ProductResponseDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string BaseUnitName { get; set; } = string.Empty;
        public string? Category { get; set; }
        public string? Brand { get; set; }
        public string? Description { get; set; }
        public string? ImageUrl { get; set; }
        public bool IsActive { get; set; }
        public int CurrentBaseStock { get; set; }
        public int LowStockThreshold { get; set; }
        public List<ProductUnitResponseDto> Units { get; set; } = new();
    }
}

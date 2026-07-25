using System.Collections.Generic;
using System.Threading.Tasks;
using POS.Core.Entities;

namespace POS.Core.Interfaces
{
    public interface IProductRepository
    {
        Task<IEnumerable<Product>> GetAllProductsAsync(string? search = null, string? category = null);
        Task<Product?> GetProductByIdAsync(int id);
        Task<ProductUnit?> GetProductUnitByBarcodeAsync(string barcode);
        Task<Product> CreateProductAsync(Product product);
        Task UpdateProductAsync(Product product);
        Task DeleteProductAsync(int id); // Soft delete
        Task<bool> BarcodeExistsAsync(string barcode);
    }
}

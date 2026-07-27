using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using POS.Core.Entities;
using POS.Core.Interfaces;
using POS.Infrastructure.Data;

namespace POS.Infrastructure.Repositories
{
    public class ProductRepository : IProductRepository
    {
        private readonly AppDbContext _context;

        public ProductRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Product>> GetAllProductsAsync(string? search = null, string? category = null)
        {
            var query = _context.Products
                .Include(p => p.Units)
                .Include(p => p.Inventory)
                .Where(p => p.IsActive);

            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim().ToLower();
                var cleanShift = term.Replace("!", "1").Replace("@", "2").Replace("#", "3").Replace("$", "4").Replace("%", "5").Replace("^", "6").Replace("&", "7").Replace("*", "8").Replace("(", "9").Replace(")", "0");
                var cleanShiftAlt = term.Replace("!", "5");
                var digitsOnly = System.Text.RegularExpressions.Regex.Replace(term, @"\D", "");
                var digitSuffix = digitsOnly.Length >= 5 ? digitsOnly.Substring(digitsOnly.Length - 5) : digitsOnly;
                
                query = query.Where(p => p.Name.ToLower().Contains(term) ||
                                         (p.Brand != null && p.Brand.ToLower().Contains(term)) ||
                                         p.Units.Any(u => u.Barcode.ToLower().Contains(term) || 
                                                          u.Barcode.ToLower().Contains(cleanShift) ||
                                                          u.Barcode.ToLower().Contains(cleanShiftAlt) ||
                                                          (!string.IsNullOrEmpty(digitSuffix) && u.Barcode.Contains(digitSuffix))));
            }

            if (!string.IsNullOrWhiteSpace(category))
            {
                query = query.Where(p => p.Category != null && p.Category.ToLower() == category.Trim().ToLower());
            }

            return await query.OrderBy(p => p.Name).ToListAsync();
        }

        public async Task<Product?> GetProductByIdAsync(int id)
        {
            return await _context.Products
                .Include(p => p.Units)
                .Include(p => p.Inventory)
                .FirstOrDefaultAsync(p => p.Id == id && p.IsActive);
        }

        public async Task<ProductUnit?> GetProductUnitByBarcodeAsync(string barcode)
        {
            var clean = barcode?.Trim().ToLower();
            if (string.IsNullOrEmpty(clean)) return null;

            return await _context.ProductUnits
                .Include(pu => pu.Product)
                    .ThenInclude(p => p!.Inventory)
                .FirstOrDefaultAsync(pu => pu.Barcode.Trim().ToLower() == clean && pu.Product!.IsActive);
        }

        public async Task<ProductUnit?> GetProductUnitByIdAsync(int unitId)
        {
            return await _context.ProductUnits
                .Include(pu => pu.Product)
                    .ThenInclude(p => p!.Inventory)
                .FirstOrDefaultAsync(pu => pu.Id == unitId && pu.Product!.IsActive);
        }

        public async Task<Product> CreateProductAsync(Product product)
        {
            product.CreatedAt = DateTime.UtcNow;
            product.UpdatedAt = DateTime.UtcNow;

            await _context.Products.AddAsync(product);
            await _context.SaveChangesAsync();
            return product;
        }

        public async Task UpdateProductAsync(Product product)
        {
            product.UpdatedAt = DateTime.UtcNow;
            _context.Products.Update(product);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteProductAsync(int id)
        {
            var product = await _context.Products.FindAsync(id);
            if (product != null)
            {
                product.IsActive = false;
                product.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }
        }

        public async Task<bool> BarcodeExistsAsync(string barcode)
        {
            var clean = barcode?.Trim().ToLower();
            if (string.IsNullOrEmpty(clean)) return false;

            return await _context.ProductUnits.AnyAsync(pu => pu.Barcode.Trim().ToLower() == clean);
        }
    }
}

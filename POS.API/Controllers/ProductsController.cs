using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using POS.Application.DTOs;
using POS.Application.Services;

namespace POS.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProductsController : ControllerBase
    {
        private readonly IProductService _productService;

        public ProductsController(IProductService productService)
        {
            _productService = productService;
        }

        [HttpGet]
        [Authorize(Roles = "Owner,Worker")]
        public async Task<IActionResult> GetAllProducts([FromQuery] string? search, [FromQuery] string? category)
        {
            var products = await _productService.GetAllProductsAsync(search, category);
            return Ok(products);
        }

        [HttpGet("{id:int}")]
        [Authorize(Roles = "Owner,Worker")]
        public async Task<IActionResult> GetProductById(int id)
        {
            var product = await _productService.GetProductByIdAsync(id);
            if (product == null) return NotFound(new { title = "Not Found", detail = $"Product with ID {id} not found" });

            return Ok(product);
        }

        [HttpGet("barcode/{barcode}")]
        [Authorize(Roles = "Owner,Worker")]
        public async Task<IActionResult> GetProductByBarcode(string barcode)
        {
            var unit = await _productService.GetProductUnitByBarcodeAsync(barcode);
            if (unit == null) return NotFound(new { title = "Not Found", detail = $"No local product packaging found for barcode '{barcode}'" });

            return Ok(unit);
        }

        [HttpGet("lookup-external/{barcode}")]
        [Authorize(Roles = "Owner")]
        public async Task<IActionResult> LookupExternalBarcode(string barcode)
        {
            var result = await _productService.LookupExternalBarcodeAsync(barcode);
            if (!result.Found)
            {
                return NotFound(new { title = "External Lookup Not Found", detail = $"No external product metadata found for barcode '{barcode}'" });
            }

            return Ok(result);
        }

        [HttpPost]
        [Authorize(Roles = "Owner")]
        public async Task<IActionResult> CreateProduct([FromBody] CreateProductDto dto)
        {
            var created = await _productService.CreateProductAsync(dto);
            return CreatedAtAction(nameof(GetProductById), new { id = created.Id }, created);
        }

        [HttpPut("{id:int}")]
        [Authorize(Roles = "Owner")]
        public async Task<IActionResult> UpdateProduct(int id, [FromBody] UpdateProductDto dto)
        {
            var updated = await _productService.UpdateProductAsync(id, dto);
            if (updated == null) return NotFound(new { title = "Not Found", detail = $"Product with ID {id} not found" });

            return Ok(updated);
        }

        [HttpDelete("{id:int}")]
        [Authorize(Roles = "Owner")]
        public async Task<IActionResult> DeleteProduct(int id)
        {
            var success = await _productService.DeleteProductAsync(id);
            if (!success) return NotFound(new { title = "Not Found", detail = $"Product with ID {id} not found" });

            return NoContent();
        }
    }
}

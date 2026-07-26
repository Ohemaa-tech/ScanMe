using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using POS.Application.DTOs;
using POS.Application.Services;
using POS.Core.Exceptions;

namespace POS.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SalesController : ControllerBase
    {
        private readonly ISaleService _saleService;

        public SalesController(ISaleService saleService)
        {
            _saleService = saleService;
        }

        [HttpPost]
        [Authorize(Roles = "Owner,Worker")]
        public async Task<IActionResult> CompleteSale([FromBody] CreateSaleRequestDto dto)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { title = "Unauthorized", detail = "User identity could not be verified." });
            }

            try
            {
                var sale = await _saleService.CompleteSaleAsync(dto, userId);
                return CreatedAtAction(nameof(GetSaleById), new { id = sale.Id }, sale);
            }
            catch (InsufficientStockException ex)
            {
                return UnprocessableEntity(new
                {
                    title = "Insufficient Stock",
                    detail = ex.Message,
                    productName = ex.ProductName,
                    available = ex.Available,
                    required = ex.Required
                });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { title = "Not Found", detail = ex.Message });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { title = "Bad Request", detail = ex.Message });
            }
        }

        [HttpGet]
        [Authorize(Roles = "Owner,Worker")]
        public async Task<IActionResult> GetSales(
            [FromQuery] DateTime? from,
            [FromQuery] DateTime? to,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            var sales = await _saleService.GetSalesAsync(from, to, page, pageSize);
            return Ok(sales);
        }

        [HttpGet("{id:int}")]
        [Authorize(Roles = "Owner,Worker")]
        public async Task<IActionResult> GetSaleById(int id)
        {
            var sale = await _saleService.GetSaleByIdAsync(id);
            if (sale == null)
            {
                return NotFound(new { title = "Not Found", detail = $"Sale transaction with ID {id} was not found." });
            }

            return Ok(sale);
        }
    }
}

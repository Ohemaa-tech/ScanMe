using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using POS.Application.DTOs;
using POS.Application.Services;

namespace POS.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class InventoryController : ControllerBase
    {
        private readonly IInventoryService _inventoryService;

        public InventoryController(IInventoryService inventoryService)
        {
            _inventoryService = inventoryService;
        }

        [HttpGet]
        [Authorize(Roles = "Owner,Worker")]
        public async Task<IActionResult> GetInventories([FromQuery] string? search, [FromQuery] string? status)
        {
            var inventories = await _inventoryService.GetInventoriesAsync(search, status);
            return Ok(inventories);
        }

        [HttpGet("{productId:int}")]
        [Authorize(Roles = "Owner,Worker")]
        public async Task<IActionResult> GetInventoryByProductId(int productId)
        {
            var inventory = await _inventoryService.GetByProductIdAsync(productId);
            if (inventory == null)
            {
                return NotFound(new { title = "Not Found", detail = $"Inventory for product ID {productId} was not found." });
            }

            return Ok(inventory);
        }

        [HttpPost("restock")]
        [Authorize(Roles = "Owner")]
        public async Task<IActionResult> RestockProduct([FromBody] RestockRequestDto dto)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { title = "Unauthorized", detail = "User identity could not be verified." });
            }

            try
            {
                var inventory = await _inventoryService.RestockProductAsync(dto, userId);
                return Ok(inventory);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { title = "Not Found", detail = ex.Message });
            }
        }

        [HttpPatch("{productId:int}")]
        [Authorize(Roles = "Owner")]
        public async Task<IActionResult> UpdateInventory(int productId, [FromBody] UpdateInventoryRequestDto dto)
        {
            var updated = await _inventoryService.UpdateInventoryAsync(productId, dto);
            if (updated == null)
            {
                return NotFound(new { title = "Not Found", detail = $"Inventory for product ID {productId} was not found." });
            }

            return Ok(updated);
        }
    }
}

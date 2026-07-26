using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using POS.Application.DTOs;
using POS.Application.Services;

namespace POS.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Policy = "OwnerOrWorker")]
    public class AlertsController : ControllerBase
    {
        private readonly IAlertService _alertService;

        public AlertsController(IAlertService alertService)
        {
            _alertService = alertService;
        }

        /// <summary>
        /// Gets all active alerts.
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<AlertResponseDto>>> GetActiveAlerts()
        {
            var alerts = await _alertService.GetActiveAlertsAsync();
            return Ok(alerts);
        }

        /// <summary>
        /// Gets the badge count of unread alerts.
        /// </summary>
        [HttpGet("badge")]
        public async Task<ActionResult<object>> GetUnreadBadgeCount()
        {
            int count = await _alertService.GetUnreadBadgeCountAsync();
            return Ok(new { count });
        }

        /// <summary>
        /// Marks a specific alert as read.
        /// </summary>
        [HttpPatch("{id}/read")]
        public async Task<IActionResult> MarkAsRead(int id)
        {
            bool success = await _alertService.MarkAlertReadAsync(id);
            if (!success)
            {
                return NotFound(new { title = "Not Found", detail = $"Alert with ID {id} was not found." });
            }
            return NoContent();
        }
    }
}

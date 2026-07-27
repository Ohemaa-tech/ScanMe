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
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<IActionResult> Login([FromBody] LoginRequestDto dto)
        {
            var response = await _authService.AuthenticateAsync(dto);
            if (response == null)
            {
                return Unauthorized(new { title = "Unauthorized", detail = "Invalid username or password" });
            }

            return Ok(response);
        }

        [HttpGet("me")]
        [Authorize(Roles = "Owner,Worker")]
        public async Task<IActionResult> GetCurrentUser()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized();
            }

            var profile = await _authService.GetUserProfileAsync(userId);
            if (profile == null)
            {
                return NotFound();
            }

            return Ok(profile);
        }

        [HttpPost("register-worker")]
        [Authorize(Roles = "Owner")]
        public async Task<IActionResult> RegisterWorker([FromBody] RegisterWorkerDto dto)
        {
            var worker = await _authService.RegisterWorkerAsync(dto);
            return CreatedAtAction(nameof(GetCurrentUser), new { id = worker.Id }, worker);
        }

        [HttpGet("workers")]
        [Authorize(Roles = "Owner")]
        public async Task<IActionResult> GetWorkers()
        {
            var workers = await _authService.GetWorkersAsync();
            return Ok(workers);
        }

        [HttpPatch("workers/{id:int}/toggle-status")]
        [Authorize(Roles = "Owner")]
        public async Task<IActionResult> ToggleWorkerStatus(int id)
        {
            var updated = await _authService.ToggleWorkerStatusAsync(id);
            if (updated == null)
            {
                return NotFound(new { title = "Not Found", detail = $"Worker account with ID {id} was not found" });
            }

            return Ok(updated);
        }
    }
}


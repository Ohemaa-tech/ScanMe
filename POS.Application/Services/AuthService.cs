using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using POS.Application.DTOs;
using POS.Core.Entities;
using POS.Core.Enums;
using POS.Core.Interfaces;

namespace POS.Application.Services
{
    public interface IAuthService
    {
        Task<LoginResponseDto?> AuthenticateAsync(LoginRequestDto loginDto);
        Task<UserProfileDto> RegisterWorkerAsync(RegisterWorkerDto dto);
        Task<UserProfileDto?> GetUserProfileAsync(int userId);
        Task<List<UserProfileDto>> GetWorkersAsync();
        Task<UserProfileDto?> ToggleWorkerStatusAsync(int workerId);
    }

    public class AuthService : IAuthService
    {
        private readonly IUserRepository _userRepository;
        private readonly IConfiguration _configuration;

        public AuthService(IUserRepository userRepository, IConfiguration configuration)
        {
            _userRepository = userRepository;
            _configuration = configuration;
        }

        public async Task<LoginResponseDto?> AuthenticateAsync(LoginRequestDto loginDto)
        {
            var user = await _userRepository.GetByUsernameAsync(loginDto.Username);
            if (user == null || !user.IsActive)
            {
                return null;
            }

            if (!BCrypt.Net.BCrypt.Verify(loginDto.Password, user.PasswordHash))
            {
                return null;
            }

            var token = GenerateJwtToken(user);
            var expiryHours = int.TryParse(_configuration["Jwt:ExpiryHours"], out var hours) ? hours : 12;

            return new LoginResponseDto
            {
                Token = token,
                UserId = user.Id,
                Username = user.Username,
                FullName = user.FullName,
                Role = user.Role.ToString(),
                ExpiresInHours = expiryHours
            };
        }

        public async Task<UserProfileDto> RegisterWorkerAsync(RegisterWorkerDto dto)
        {
            var existingUser = await _userRepository.GetByUsernameAsync(dto.Username);
            if (existingUser != null)
            {
                throw new InvalidOperationException("Username already exists.");
            }

            var existingEmail = await _userRepository.GetByEmailAsync(dto.Email);
            if (existingEmail != null)
            {
                throw new InvalidOperationException("Email already exists.");
            }

            var worker = new User
            {
                Username = dto.Username,
                Email = dto.Email,
                FullName = dto.FullName,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                Role = UserRole.Worker,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            await _userRepository.CreateUserAsync(worker);

            return new UserProfileDto
            {
                Id = worker.Id,
                Username = worker.Username,
                Email = worker.Email,
                FullName = worker.FullName,
                Role = worker.Role.ToString(),
                IsActive = worker.IsActive
            };
        }

        public async Task<UserProfileDto?> GetUserProfileAsync(int userId)
        {
            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null) return null;

            return new UserProfileDto
            {
                Id = user.Id,
                Username = user.Username,
                Email = user.Email,
                FullName = user.FullName,
                Role = user.Role.ToString(),
                IsActive = user.IsActive
            };
        }

        public async Task<List<UserProfileDto>> GetWorkersAsync()
        {
            var workers = await _userRepository.GetWorkersAsync();
            return workers.Select(w => new UserProfileDto
            {
                Id = w.Id,
                Username = w.Username,
                Email = w.Email,
                FullName = w.FullName,
                Role = w.Role.ToString(),
                IsActive = w.IsActive
            }).ToList();
        }

        public async Task<UserProfileDto?> ToggleWorkerStatusAsync(int workerId)
        {
            var worker = await _userRepository.GetByIdAsync(workerId);
            if (worker == null || worker.Role != UserRole.Worker)
            {
                return null;
            }

            await _userRepository.ToggleUserStatusAsync(workerId);
            var updated = await _userRepository.GetByIdAsync(workerId);
            if (updated == null) return null;

            return new UserProfileDto
            {
                Id = updated.Id,
                Username = updated.Username,
                Email = updated.Email,
                FullName = updated.FullName,
                Role = updated.Role.ToString(),
                IsActive = updated.IsActive
            };
        }


        private string GenerateJwtToken(User user)
        {
            var key = _configuration["Jwt:Key"] ?? "SUPER_SECRET_POS_JWT_SIGNING_KEY_2026_CHANGE_IN_PROD!";
            var issuer = _configuration["Jwt:Issuer"] ?? "POSApi";
            var audience = _configuration["Jwt:Audience"] ?? "POSClient";
            var expiryHours = int.TryParse(_configuration["Jwt:ExpiryHours"], out var hours) ? hours : 12;

            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.UniqueName, user.Username),
                new Claim(ClaimTypes.Role, user.Role.ToString()),
                new Claim(ClaimTypes.Name, user.FullName),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };

            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: DateTime.UtcNow.AddHours(expiryHours),
                signingCredentials: credentials);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}

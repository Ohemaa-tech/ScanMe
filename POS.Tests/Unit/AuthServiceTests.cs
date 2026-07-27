using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Moq;
using POS.Application.DTOs;
using POS.Application.Services;
using POS.Core.Entities;
using POS.Core.Enums;
using POS.Core.Interfaces;
using Xunit;

namespace POS.Tests.Unit
{
    public class AuthServiceTests
    {
        private readonly Mock<IUserRepository> _userRepoMock;
        private readonly Mock<IConfiguration> _configMock;
        private readonly AuthService _authService;

        public AuthServiceTests()
        {
            _userRepoMock = new Mock<IUserRepository>();
            _configMock = new Mock<IConfiguration>();

            _configMock.Setup(c => c["Jwt:Key"]).Returns("SUPER_SECRET_POS_JWT_SIGNING_KEY_2026_TEST_KEY_LONG_ENOUGH!");
            _configMock.Setup(c => c["Jwt:Issuer"]).Returns("POSApiTest");
            _configMock.Setup(c => c["Jwt:Audience"]).Returns("POSClientTest");
            _configMock.Setup(c => c["Jwt:ExpiryHours"]).Returns("12");

            _authService = new AuthService(_userRepoMock.Object, _configMock.Object);
        }

        [Fact]
        public async Task AuthenticateAsync_ValidCredentials_ReturnsTokenAndUserDetails()
        {
            // Arrange
            var plainPassword = "Password123!";
            var hashedPassword = BCrypt.Net.BCrypt.HashPassword(plainPassword);

            var user = new User
            {
                Id = 1,
                Username = "testowner",
                Email = "owner@test.com",
                PasswordHash = hashedPassword,
                FullName = "Test Owner",
                Role = UserRole.Owner,
                IsActive = true
            };

            _userRepoMock.Setup(r => r.GetByUsernameAsync("testowner"))
                .ReturnsAsync(user);

            var loginDto = new LoginRequestDto
            {
                Username = "testowner",
                Password = plainPassword
            };

            // Act
            var result = await _authService.AuthenticateAsync(loginDto);

            // Assert
            Assert.NotNull(result);
            Assert.Equal("testowner", result.Username);
            Assert.Equal("Owner", result.Role);
            Assert.False(string.IsNullOrWhiteSpace(result.Token));
        }

        [Fact]
        public async Task AuthenticateAsync_InvalidPassword_ReturnsNull()
        {
            // Arrange
            var hashedPassword = BCrypt.Net.BCrypt.HashPassword("CorrectPassword123!");

            var user = new User
            {
                Id = 1,
                Username = "testowner",
                PasswordHash = hashedPassword,
                Role = UserRole.Owner,
                IsActive = true
            };

            _userRepoMock.Setup(r => r.GetByUsernameAsync("testowner"))
                .ReturnsAsync(user);

            var loginDto = new LoginRequestDto
            {
                Username = "testowner",
                Password = "WrongPassword!"
            };

            // Act
            var result = await _authService.AuthenticateAsync(loginDto);

            // Assert
            Assert.Null(result);
        }

        [Fact]
        public async Task RegisterWorkerAsync_NewUsername_CreatesWorkerRoleAccount()
        {
            // Arrange
            _userRepoMock.Setup(r => r.GetByUsernameAsync("newworker"))
                .ReturnsAsync((User?)null);
            _userRepoMock.Setup(r => r.GetByEmailAsync("worker@test.com"))
                .ReturnsAsync((User?)null);

            var registerDto = new RegisterWorkerDto
            {
                Username = "newworker",
                Email = "worker@test.com",
                Password = "WorkerPassword123!",
                FullName = "New Worker"
            };

            _userRepoMock.Setup(r => r.CreateUserAsync(It.IsAny<User>()))
                .ReturnsAsync((User u) => u);

            // Act
            var result = await _authService.RegisterWorkerAsync(registerDto);

            // Assert
            Assert.NotNull(result);
            Assert.Equal("newworker", result.Username);
            Assert.Equal("Worker", result.Role);

            _userRepoMock.Verify(r => r.CreateUserAsync(It.Is<User>(u =>
                u.Username == "newworker" &&
                u.Role == UserRole.Worker &&
                BCrypt.Net.BCrypt.Verify("WorkerPassword123!", u.PasswordHash))), Times.Once);
        }

        [Fact]
        public async Task GetWorkersAsync_ReturnsListOfWorkerProfiles()
        {
            // Arrange
            var workers = new System.Collections.Generic.List<User>
            {
                new User { Id = 2, Username = "worker1", Role = UserRole.Worker, IsActive = true },
                new User { Id = 3, Username = "worker2", Role = UserRole.Worker, IsActive = false }
            };

            _userRepoMock.Setup(r => r.GetWorkersAsync()).ReturnsAsync(workers);

            // Act
            var result = await _authService.GetWorkersAsync();

            // Assert
            Assert.NotNull(result);
            Assert.Equal(2, result.Count);
            Assert.Equal("worker1", result[0].Username);
            Assert.True(result[0].IsActive);
            Assert.Equal("worker2", result[1].Username);
            Assert.False(result[1].IsActive);
        }

        [Fact]
        public async Task ToggleWorkerStatusAsync_ValidWorker_TogglesStatus()
        {
            // Arrange
            var worker = new User { Id = 2, Username = "worker1", Role = UserRole.Worker, IsActive = true };
            var toggledWorker = new User { Id = 2, Username = "worker1", Role = UserRole.Worker, IsActive = false };

            _userRepoMock.SetupSequence(r => r.GetByIdAsync(2))
                .ReturnsAsync(worker)
                .ReturnsAsync(toggledWorker);

            _userRepoMock.Setup(r => r.ToggleUserStatusAsync(2)).ReturnsAsync(true);

            // Act
            var result = await _authService.ToggleWorkerStatusAsync(2);

            // Assert
            Assert.NotNull(result);
            Assert.False(result.IsActive);
            _userRepoMock.Verify(r => r.ToggleUserStatusAsync(2), Times.Once);
        }
    }
}


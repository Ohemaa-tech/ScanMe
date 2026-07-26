using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Moq;
using POS.API.Controllers;
using POS.Application.DTOs;
using POS.Application.Services;
using POS.Core.Entities;
using POS.Core.Enums;
using POS.Core.Interfaces;
using POS.Infrastructure.Data;
using POS.Infrastructure.Repositories;
using Xunit;

namespace POS.Tests.Integration
{
    public class ApiFlowIntegrationTests : IDisposable
    {
        private readonly SqliteConnection _connection;
        private readonly AppDbContext _context;

        private readonly UserRepository _userRepository;
        private readonly ProductRepository _productRepository;
        private readonly SaleRepository _saleRepository;
        private readonly InventoryRepository _inventoryRepository;

        private readonly AuthService _authService;
        private readonly ProductService _productService;
        private readonly SaleService _saleService;
        private readonly InventoryService _inventoryService;

        private readonly AuthController _authController;
        private readonly ProductsController _productsController;
        private readonly SalesController _salesController;
        private readonly InventoryController _inventoryController;

        private readonly AlertRepository _alertRepository;
        private readonly AlertService _alertService;

        public ApiFlowIntegrationTests()
        {
            // Set up in-memory SQLite database
            _connection = new SqliteConnection("DataSource=:memory:");
            _connection.Open();

            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseSqlite(_connection)
                .Options;

            _context = new AppDbContext(options);
            _context.Database.EnsureCreated();

            var configDict = new Dictionary<string, string?>
            {
                {"Jwt:Key", "SUPER_SECRET_POS_JWT_SIGNING_KEY_2026_TEST_KEY!"},
                {"Jwt:Issuer", "POSApi"},
                {"Jwt:Audience", "POSClient"},
                {"Jwt:ExpiryHours", "12"}
            };
            IConfiguration config = new ConfigurationBuilder()
                .AddInMemoryCollection(configDict)
                .Build();

            // Instantiate repositories
            _userRepository = new UserRepository(_context);
            _productRepository = new ProductRepository(_context);
            _saleRepository = new SaleRepository(_context);
            _inventoryRepository = new InventoryRepository(_context);
            _alertRepository = new AlertRepository(_context);

            // Instantiate services
            _authService = new AuthService(_userRepository, config);

            var externalBarcodeMock = new Mock<IExternalBarcodeService>();
            _productService = new ProductService(_productRepository, externalBarcodeMock.Object);
            _alertService = new AlertService(_alertRepository, _inventoryRepository);

            _saleService = new SaleService(_saleRepository, _productRepository, _inventoryRepository, _alertService);
            _inventoryService = new InventoryService(_inventoryRepository, _productRepository, _alertService);

            // Instantiate controllers
            _authController = new AuthController(_authService);
            _productsController = new ProductsController(_productService);
            _salesController = new SalesController(_saleService);
            _inventoryController = new InventoryController(_inventoryService);
        }

        public void Dispose()
        {
            _context.Dispose();
            _connection.Dispose();
        }

        private void SetControllerUser(ControllerBase controller, int userId, string username, string role)
        {
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
                new Claim(ClaimTypes.Name, username),
                new Claim(ClaimTypes.Role, role)
            };
            var identity = new ClaimsIdentity(claims, "TestAuthType");
            var claimsPrincipal = new ClaimsPrincipal(identity);

            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = claimsPrincipal }
            };
        }

        [Fact]
        public async Task CompleteApiWorkflow_Auth_Catalog_Sales_Restock_EndToEnd()
        {
            // ----------------------------------------------------
            // STEP 1: Seed Owner Account & Test Login
            // ----------------------------------------------------
            var ownerUser = new User
            {
                Username = "owner_admin",
                Email = "owner@scanme.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Password123!"),
                FullName = "Shop Owner",
                Role = UserRole.Owner,
                IsActive = true
            };
            await _context.Users.AddAsync(ownerUser);
            await _context.SaveChangesAsync();

            var loginResult = await _authController.Login(new LoginRequestDto
            {
                Username = "owner_admin",
                Password = "Password123!"
            });

            var okLogin = Assert.IsType<OkObjectResult>(loginResult);
            var authResp = Assert.IsType<LoginResponseDto>(okLogin.Value);
            Assert.NotNull(authResp.Token);
            Assert.Equal("Owner", authResp.Role);

            // ----------------------------------------------------
            // STEP 2: Owner Register Worker Account
            // ----------------------------------------------------
            SetControllerUser(_authController, ownerUser.Id, ownerUser.Username, "Owner");
            var regResult = await _authController.RegisterWorker(new RegisterWorkerDto
            {
                Username = "cashier_john",
                Email = "john@scanme.com",
                Password = "WorkerPassword123!",
                FullName = "John Cashier"
            });

            var createdWorker = Assert.IsType<CreatedAtActionResult>(regResult);
            var workerUser = Assert.IsType<UserProfileDto>(createdWorker.Value);
            Assert.Equal("cashier_john", workerUser.Username);
            Assert.Equal("Worker", workerUser.Role);

            // ----------------------------------------------------
            // STEP 3: Owner Create Dual-Unit Product
            // ----------------------------------------------------
            SetControllerUser(_productsController, ownerUser.Id, ownerUser.Username, "Owner");
            var createProdResult = await _productsController.CreateProduct(new CreateProductDto
            {
                Name = "Coca Cola 500ml",
                BaseUnitName = "Bottle",
                Category = "Soft Drinks",
                Brand = "Coca Cola",
                InitialBaseStock = 100, // 100 single bottles
                LowStockThreshold = 20,
                Units = new List<CreateProductUnitDto>
                {
                    new CreateProductUnitDto
                    {
                        UnitName = "Single Bottle",
                        Barcode = "5449000000996",
                        ConversionFactor = 1,
                        Price = 2.00m,
                        IsDefault = true
                    },
                    new CreateProductUnitDto
                    {
                        UnitName = "Carton of 24",
                        Barcode = "5449000002499",
                        ConversionFactor = 24,
                        Price = 40.00m,
                        IsDefault = false
                    }
                }
            });

            var createdProdResultObj = Assert.IsType<CreatedAtActionResult>(createProdResult);
            var productResp = Assert.IsType<ProductResponseDto>(createdProdResultObj.Value);
            Assert.Equal("Coca Cola 500ml", productResp.Name);
            Assert.Equal(100, productResp.CurrentBaseStock);

            var cartonUnit = productResp.Units.First(u => u.UnitName == "Carton of 24");
            var singleUnit = productResp.Units.First(u => u.UnitName == "Single Bottle");

            // ----------------------------------------------------
            // STEP 4: Worker Lookup Product by Scanned Barcode
            // ----------------------------------------------------
            SetControllerUser(_productsController, workerUser.Id, workerUser.Username, "Worker");
            var barcodeLookupResult = await _productsController.GetProductByBarcode("5449000002499");
            var okBarcode = Assert.IsType<OkObjectResult>(barcodeLookupResult);
            var foundUnit = Assert.IsType<ProductUnitResponseDto>(okBarcode.Value);
            Assert.Equal("Carton of 24", foundUnit.UnitName);
            Assert.Equal(24, foundUnit.ConversionFactor);
            Assert.Equal(40.00m, foundUnit.Price);

            // ----------------------------------------------------
            // STEP 5: Worker Complete Sale Transaction (2 Cartons = 48 Base Units)
            // ----------------------------------------------------
            SetControllerUser(_salesController, workerUser.Id, workerUser.Username, "Worker");
            var saleResult = await _salesController.CompleteSale(new CreateSaleRequestDto
            {
                PaymentMethod = "Cash",
                Notes = "Customer bought 2 cartons",
                Items = new List<CreateSaleItemDto>
                {
                    new CreateSaleItemDto
                    {
                        ProductUnitId = cartonUnit.Id,
                        Quantity = 2 // 2 cartons * 24 = 48 base bottles deducted
                    }
                }
            });

            var createdSale = Assert.IsType<CreatedAtActionResult>(saleResult);
            var saleResp = Assert.IsType<SaleResponseDto>(createdSale.Value);
            Assert.Equal(80.00m, saleResp.TotalAmount); // 2 * 40.00 = 80.00
            Assert.Single(saleResp.Items);

            // Verify Inventory Decremented to 52 (100 - 48)
            SetControllerUser(_inventoryController, workerUser.Id, workerUser.Username, "Worker");
            var invResult = await _inventoryController.GetInventoryByProductId(productResp.Id);
            var okInv = Assert.IsType<OkObjectResult>(invResult);
            var invResp = Assert.IsType<InventoryResponseDto>(okInv.Value);
            Assert.Equal(52, invResp.Quantity);
            Assert.Equal("OK", invResp.StockStatus);

            // ----------------------------------------------------
            // STEP 6: Worker Attempt Sale Exceeding Stock (3 Cartons = 72 Base Units, only 52 available)
            // ----------------------------------------------------
            SetControllerUser(_salesController, workerUser.Id, workerUser.Username, "Worker");
            var excessiveSaleResult = await _salesController.CompleteSale(new CreateSaleRequestDto
            {
                PaymentMethod = "Card",
                Items = new List<CreateSaleItemDto>
                {
                    new CreateSaleItemDto
                    {
                        ProductUnitId = cartonUnit.Id,
                        Quantity = 3 // Requires 72 base units
                    }
                }
            });

            var unprocessable = Assert.IsType<UnprocessableEntityObjectResult>(excessiveSaleResult);
            Assert.NotNull(unprocessable.Value);

            // ----------------------------------------------------
            // STEP 7: Owner Restock Inventory (+5 Cartons = +120 Base Units)
            // ----------------------------------------------------
            SetControllerUser(_inventoryController, ownerUser.Id, ownerUser.Username, "Owner");
            var restockResult = await _inventoryController.RestockProduct(new RestockRequestDto
            {
                ProductId = productResp.Id,
                ProductUnitId = cartonUnit.Id,
                QuantityRestocked = 5 // 5 cartons * 24 = 120 base units
            });

            var okRestock = Assert.IsType<OkObjectResult>(restockResult);
            var restockedInvResp = Assert.IsType<InventoryResponseDto>(okRestock.Value);
            Assert.Equal(172, restockedInvResp.Quantity); // 52 + 120 = 172
            Assert.Equal(ownerUser.Id, restockedInvResp.LastRestockedBy);

            // ----------------------------------------------------
            // STEP 8: Verify Sales History
            // ----------------------------------------------------
            SetControllerUser(_salesController, ownerUser.Id, ownerUser.Username, "Owner");
            var salesHistoryResult = await _salesController.GetSales(null, null, 1, 20);
            var okSales = Assert.IsType<OkObjectResult>(salesHistoryResult);
            var salesList = Assert.IsAssignableFrom<IEnumerable<SaleResponseDto>>(okSales.Value);
            Assert.Single(salesList);
        }
    }
}

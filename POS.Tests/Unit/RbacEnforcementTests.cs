using System;
using System.Linq;
using System.Reflection;
using Microsoft.AspNetCore.Authorization;
using POS.API.Controllers;
using Xunit;

namespace POS.Tests.Unit
{
    public class RbacEnforcementTests
    {
        [Theory]
        [InlineData(typeof(ProductsController), nameof(ProductsController.CreateProduct), "Owner")]
        [InlineData(typeof(ProductsController), nameof(ProductsController.UpdateProduct), "Owner")]
        [InlineData(typeof(ProductsController), nameof(ProductsController.DeleteProduct), "Owner")]
        [InlineData(typeof(ProductsController), nameof(ProductsController.LookupExternalBarcode), "Owner")]
        [InlineData(typeof(InventoryController), nameof(InventoryController.RestockProduct), "Owner")]
        [InlineData(typeof(InventoryController), nameof(InventoryController.UpdateInventory), "Owner")]
        public void OwnerOnlyEndpoints_MustHaveOwnerRoleRequirement(Type controllerType, string methodName, string expectedRole)
        {
            var method = controllerType.GetMethod(methodName);
            Assert.NotNull(method);

            var authorizeAttr = method.GetCustomAttribute<AuthorizeAttribute>();
            Assert.NotNull(authorizeAttr);
            Assert.Equal(expectedRole, authorizeAttr.Roles);
        }

        [Theory]
        [InlineData(typeof(ProductsController), nameof(ProductsController.GetAllProducts), "Owner,Worker")]
        [InlineData(typeof(ProductsController), nameof(ProductsController.GetProductById), "Owner,Worker")]
        [InlineData(typeof(ProductsController), nameof(ProductsController.GetProductByBarcode), "Owner,Worker")]
        [InlineData(typeof(InventoryController), nameof(InventoryController.GetInventories), "Owner,Worker")]
        [InlineData(typeof(InventoryController), nameof(InventoryController.GetInventoryByProductId), "Owner,Worker")]
        public void SharedEndpoints_MustAllowBothOwnerAndWorker(Type controllerType, string methodName, string expectedRoles)
        {
            var method = controllerType.GetMethod(methodName);
            Assert.NotNull(method);

            var authorizeAttr = method.GetCustomAttribute<AuthorizeAttribute>();
            Assert.NotNull(authorizeAttr);
            Assert.Equal(expectedRoles, authorizeAttr.Roles);
        }

        [Fact]
        public void AlertsController_MustHaveOwnerOrWorkerPolicy()
        {
            var controllerType = typeof(AlertsController);
            var authorizeAttr = controllerType.GetCustomAttribute<AuthorizeAttribute>();

            Assert.NotNull(authorizeAttr);
            Assert.Equal("OwnerOrWorker", authorizeAttr.Policy);
        }

        [Fact]
        public void AnalyticsController_MustHaveOwnerRoleRequirement()
        {
            var controllerType = typeof(AnalyticsController);
            var authorizeAttr = controllerType.GetCustomAttribute<AuthorizeAttribute>();

            Assert.NotNull(authorizeAttr);
            Assert.Equal("Owner", authorizeAttr.Roles);
        }
    }
}

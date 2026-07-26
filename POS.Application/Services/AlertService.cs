using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using POS.Application.DTOs;
using POS.Core.Entities;
using POS.Core.Enums;
using POS.Core.Interfaces;

namespace POS.Application.Services
{
    public interface IAlertService
    {
        Task<IEnumerable<AlertResponseDto>> GetActiveAlertsAsync();
        Task<int> GetUnreadBadgeCountAsync();
        Task<bool> MarkAlertReadAsync(int alertId);
        Task CheckAndCreateAlertsAsync(int productId);
    }

    public class AlertService : IAlertService
    {
        private readonly IAlertRepository _alertRepository;
        private readonly IInventoryRepository _inventoryRepository;

        public AlertService(IAlertRepository alertRepository, IInventoryRepository inventoryRepository)
        {
            _alertRepository = alertRepository;
            _inventoryRepository = inventoryRepository;
        }

        public async Task<IEnumerable<AlertResponseDto>> GetActiveAlertsAsync()
        {
            var alerts = await _alertRepository.GetActiveAlertsAsync();
            return alerts.Select(MapToResponseDto);
        }

        public async Task<int> GetUnreadBadgeCountAsync()
        {
            return await _alertRepository.GetUnreadCountAsync();
        }

        public async Task<bool> MarkAlertReadAsync(int alertId)
        {
            var alert = await _alertRepository.GetByIdAsync(alertId);
            if (alert == null) return false;

            alert.IsRead = true;
            await _alertRepository.UpdateAlertAsync(alert);
            return true;
        }

        public async Task CheckAndCreateAlertsAsync(int productId)
        {
            var inventory = await _inventoryRepository.GetByProductIdAsync(productId);
            if (inventory == null) return;

            string productName = inventory.Product?.Name ?? $"Product #{productId}";

            if (inventory.Quantity <= 0)
            {
                // Create OutOfStock alert if not already active
                bool alreadyAlerted = await _alertRepository.HasActiveAlertForProductAsync(productId, AlertType.OutOfStock);
                if (!alreadyAlerted)
                {
                    await _alertRepository.CreateAlertAsync(new Alert
                    {
                        ProductId = productId,
                        AlertType = AlertType.OutOfStock,
                        Message = $"Product '{productName}' is completely OUT OF STOCK (0 base units remaining).",
                        IsRead = false,
                        CreatedAt = DateTime.UtcNow
                    });
                }
            }
            else if (inventory.Quantity <= inventory.LowStockThreshold)
            {
                // Create LowStock alert if not already active
                bool alreadyAlerted = await _alertRepository.HasActiveAlertForProductAsync(productId, AlertType.LowStock);
                if (!alreadyAlerted)
                {
                    await _alertRepository.CreateAlertAsync(new Alert
                    {
                        ProductId = productId,
                        AlertType = AlertType.LowStock,
                        Message = $"Product '{productName}' stock is LOW ({inventory.Quantity} base units remaining, threshold is {inventory.LowStockThreshold}).",
                        IsRead = false,
                        CreatedAt = DateTime.UtcNow
                    });
                }
            }
            else
            {
                // Stock is strictly above LowStockThreshold: auto-dismiss previous active low stock / out of stock alerts
                await _alertRepository.DismissActiveAlertsForProductAsync(productId);
            }
        }

        private static AlertResponseDto MapToResponseDto(Alert alert)
        {
            return new AlertResponseDto
            {
                Id = alert.Id,
                ProductId = alert.ProductId,
                ProductName = alert.Product?.Name ?? string.Empty,
                AlertType = alert.AlertType.ToString(),
                Message = alert.Message,
                IsRead = alert.IsRead,
                CreatedAt = alert.CreatedAt
            };
        }
    }
}

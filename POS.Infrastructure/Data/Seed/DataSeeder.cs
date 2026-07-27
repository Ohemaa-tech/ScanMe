using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using POS.Core.Entities;
using POS.Core.Enums;

namespace POS.Infrastructure.Data.Seed
{
    public static class DataSeeder
    {
        public static async Task SeedAsync(AppDbContext context)
        {
            await context.Database.EnsureCreatedAsync();

            async Task UpsertUser(string username, string email, string fullName, string rawPassword, UserRole role)
            {
                var existing = await context.Users.FirstOrDefaultAsync(u => u.Username.ToLower() == username.ToLower());
                if (existing == null)
                {
                    var user = new User
                    {
                        Username = username,
                        Email = email,
                        FullName = fullName,
                        PasswordHash = BCrypt.Net.BCrypt.HashPassword(rawPassword),
                        Role = role,
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow
                    };
                    await context.Users.AddAsync(user);
                }
                else
                {
                    existing.PasswordHash = BCrypt.Net.BCrypt.HashPassword(rawPassword);
                    existing.IsActive = true;
                    context.Users.Update(existing);
                }
            }

            await UpsertUser("admin", "admin@scanme.com", "Store Owner", "admin123", UserRole.Owner);
            await UpsertUser("owner", "owner@scanme.com", "Store Owner", "Owner123!", UserRole.Owner);
            await UpsertUser("worker1", "worker1@scanme.com", "Cashier John", "worker123", UserRole.Worker);

            await context.SaveChangesAsync();
        }
    }
}

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

            if (!await context.Users.AnyAsync())
            {
                var owner = new User
                {
                    Username = "owner",
                    Email = "owner@scanme.com",
                    FullName = "Store Owner",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Owner123!"),
                    Role = UserRole.Owner,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };

                await context.Users.AddAsync(owner);
                await context.SaveChangesAsync();
            }
        }
    }
}

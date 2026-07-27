using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using POS.Core.Entities;
using POS.Core.Enums;
using POS.Core.Interfaces;
using POS.Infrastructure.Data;

namespace POS.Infrastructure.Repositories
{
    public class UserRepository : IUserRepository
    {
        private readonly AppDbContext _context;

        public UserRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<User?> GetByIdAsync(int id)
        {
            return await _context.Users.FindAsync(id);
        }

        public async Task<User?> GetByUsernameAsync(string username)
        {
            return await _context.Users
                .FirstOrDefaultAsync(u => u.Username.ToLower() == username.ToLower());
        }

        public async Task<User?> GetByEmailAsync(string email)
        {
            return await _context.Users
                .FirstOrDefaultAsync(u => u.Email.ToLower() == email.ToLower());
        }

        public async Task<List<User>> GetWorkersAsync()
        {
            return await _context.Users
                .Where(u => u.Role == UserRole.Worker)
                .OrderByDescending(u => u.CreatedAt)
                .ToListAsync();
        }

        public async Task<User> CreateUserAsync(User user)
        {
            await _context.Users.AddAsync(user);
            await _context.SaveChangesAsync();
            return user;
        }

        public async Task UpdateUserAsync(User user)
        {
            _context.Users.Update(user);
            await _context.SaveChangesAsync();
        }

        public async Task<bool> ToggleUserStatusAsync(int userId)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null) return false;

            user.IsActive = !user.IsActive;
            await _context.SaveChangesAsync();
            return true;
        }
    }
}


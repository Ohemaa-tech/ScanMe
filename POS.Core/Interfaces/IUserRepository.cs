using System.Collections.Generic;
using System.Threading.Tasks;
using POS.Core.Entities;

namespace POS.Core.Interfaces
{
    public interface IUserRepository
    {
        Task<User?> GetByIdAsync(int id);
        Task<User?> GetByUsernameAsync(string username);
        Task<User?> GetByEmailAsync(string email);
        Task<List<User>> GetWorkersAsync();
        Task<User> CreateUserAsync(User user);
        Task UpdateUserAsync(User user);
        Task<bool> ToggleUserStatusAsync(int userId);
    }
}


using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using POS.Core.Entities;

namespace POS.Core.Interfaces
{
    public interface ISaleRepository
    {
        Task<Sale> CreateSaleAsync(Sale sale);
        Task<IEnumerable<Sale>> GetSalesAsync(DateTime? from = null, DateTime? to = null, int page = 1, int pageSize = 20);
        Task<Sale?> GetSaleByIdAsync(int id);
    }
}

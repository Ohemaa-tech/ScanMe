using System.Threading.Tasks;

namespace POS.Core.Interfaces
{
    public class ExternalProductLookupResult
    {
        public bool Found { get; set; }
        public string Barcode { get; set; } = string.Empty;
        public string? Name { get; set; }
        public string? Brand { get; set; }
        public string? Category { get; set; }
        public string? ImageUrl { get; set; }
        public string? Description { get; set; }
    }

    public interface IExternalBarcodeService
    {
        Task<ExternalProductLookupResult> LookupBarcodeAsync(string barcode);
    }
}

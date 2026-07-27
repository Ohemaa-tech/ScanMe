using System;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using POS.Core.Interfaces;

namespace POS.Infrastructure.ExternalServices
{
    public class OpenFoodFactsBarcodeService : IExternalBarcodeService
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;

        public OpenFoodFactsBarcodeService(HttpClient httpClient, IConfiguration configuration)
        {
            _httpClient = httpClient;
            _configuration = configuration;
            if (!_httpClient.DefaultRequestHeaders.Contains("User-Agent"))
            {
                var userAgent = _configuration["ExternalBarcodeApi:UserAgent"] ?? "SwiftScan POS - Windows - Version 1.1";
                _httpClient.DefaultRequestHeaders.Add("User-Agent", userAgent);
            }
        }

        public async Task<ExternalProductLookupResult> LookupBarcodeAsync(string barcode)
        {
            var result = new ExternalProductLookupResult
            {
                Barcode = barcode,
                Found = false
            };

            try
            {
                var requestUrl = $"https://world.openfoodfacts.org/api/v2/product/{barcode}.json";
                var response = await _httpClient.GetAsync(requestUrl);

                if (!response.IsSuccessStatusCode)
                {
                    return result;
                }

                var jsonString = await response.Content.ReadAsStringAsync();
                using var doc = JsonDocument.Parse(jsonString);
                var root = doc.RootElement;

                if (root.TryGetProperty("status", out var statusProp) && statusProp.GetInt32() == 1)
                {
                    if (root.TryGetProperty("product", out var product))
                    {
                        result.Found = true;

                        if (product.TryGetProperty("product_name", out var nameProp) && !string.IsNullOrWhiteSpace(nameProp.GetString()))
                        {
                            result.Name = nameProp.GetString();
                        }
                        else if (product.TryGetProperty("product_name_en", out var nameEnProp) && !string.IsNullOrWhiteSpace(nameEnProp.GetString()))
                        {
                            result.Name = nameEnProp.GetString();
                        }

                        if (product.TryGetProperty("brands", out var brandProp))
                        {
                            result.Brand = brandProp.GetString();
                        }

                        if (product.TryGetProperty("categories", out var catProp))
                        {
                            var categories = catProp.GetString();
                            if (!string.IsNullOrEmpty(categories))
                            {
                                var parts = categories.Split(',');
                                result.Category = parts.Length > 0 ? parts[0].Trim() : categories;
                            }
                        }

                        if (product.TryGetProperty("image_front_url", out var imgProp))
                        {
                            result.ImageUrl = imgProp.GetString();
                        }
                        else if (product.TryGetProperty("image_url", out var imgUrlProp))
                        {
                            result.ImageUrl = imgUrlProp.GetString();
                        }

                        if (product.TryGetProperty("generic_name", out var descProp))
                        {
                            result.Description = descProp.GetString();
                        }
                    }
                }
            }
            catch (Exception)
            {
                // Return result with Found = false on exception
            }

            return result;
        }
    }
}

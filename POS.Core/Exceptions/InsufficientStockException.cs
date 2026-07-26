using System;

namespace POS.Core.Exceptions
{
    public class InsufficientStockException : Exception
    {
        public string ProductName { get; }
        public int Available { get; }
        public int Required { get; }

        public InsufficientStockException(string productName, int available, int required)
            : base($"Insufficient stock for '{productName}'. Available: {available} base units, Required: {required} base units.")
        {
            ProductName = productName;
            Available = available;
            Required = required;
        }
    }
}

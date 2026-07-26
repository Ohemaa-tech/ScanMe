using Microsoft.EntityFrameworkCore;
using POS.Core.Entities;

namespace POS.Infrastructure.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<User> Users => Set<User>();
        public DbSet<Product> Products => Set<Product>();
        public DbSet<ProductUnit> ProductUnits => Set<ProductUnit>();
        public DbSet<Inventory> Inventories => Set<Inventory>();
        public DbSet<Sale> Sales => Set<Sale>();
        public DbSet<SaleItem> SaleItems => Set<SaleItem>();
        public DbSet<Alert> Alerts => Set<Alert>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // User configuration
            modelBuilder.Entity<User>()
                .HasIndex(u => u.Username)
                .IsUnique();

            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();

            modelBuilder.Entity<User>()
                .Property(u => u.Role)
                .HasConversion<string>();

            // Product & ProductUnit configurations
            modelBuilder.Entity<ProductUnit>()
                .HasIndex(pu => pu.Barcode)
                .IsUnique();

            modelBuilder.Entity<ProductUnit>()
                .Property(pu => pu.Price)
                .HasColumnType("decimal(18,2)");

            // Inventory configuration
            modelBuilder.Entity<Inventory>()
                .HasIndex(i => i.ProductId)
                .IsUnique();

            modelBuilder.Entity<Inventory>()
                .HasOne(i => i.Product)
                .WithOne(p => p.Inventory)
                .HasForeignKey<Inventory>(i => i.ProductId)
                .OnDelete(DeleteBehavior.Cascade);

            // Sale & SaleItem configuration
            modelBuilder.Entity<Sale>()
                .Property(s => s.TotalAmount)
                .HasColumnType("decimal(18,2)");

            modelBuilder.Entity<Sale>()
                .Property(s => s.TaxAmount)
                .HasColumnType("decimal(18,2)");

            modelBuilder.Entity<SaleItem>()
                .Property(si => si.UnitPrice)
                .HasColumnType("decimal(18,2)");

            modelBuilder.Entity<SaleItem>()
                .Property(si => si.LineTotal)
                .HasColumnType("decimal(18,2)");

            // Alert configuration
            modelBuilder.Entity<Alert>()
                .Property(a => a.AlertType)
                .HasConversion<string>();
        }
    }
}

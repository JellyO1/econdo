using System.Diagnostics;
using System.Security.Claims;
using CondoBackend.Domain.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace CondoBackend.Infrastructure;

public class ApplicationDbContext(
    DbContextOptions<ApplicationDbContext> options,
    IHttpContextAccessor httpContextAccessor)
    : IdentityDbContext<ApplicationUser, IdentityRole<string>, string>(options)
{
    public DbSet<Condominium> Condominiums => Set<Condominium>();
    public DbSet<Fraction> Fractions => Set<Fraction>();
    public DbSet<Owner> Owners => Set<Owner>();
    public DbSet<OwnerFraction> OwnerFractions => Set<OwnerFraction>();
    public DbSet<LedgerEntry> LedgerEntries => Set<LedgerEntry>();
    public DbSet<QuotaConfig> QuotaConfigs => Set<QuotaConfig>();

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var userId = httpContextAccessor.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier);
        Debug.Assert(!string.IsNullOrEmpty(userId), "User ID should not be empty when saving changes to the database.");    
        var now = DateTime.UtcNow;

        foreach (var entry in ChangeTracker.Entries<BaseEntity>())
        {
            if (entry.State == EntityState.Added)
            {
                entry.Entity.CreatedAt = now;
                entry.Entity.CreatedById = userId!;
            }
            else if (entry.State == EntityState.Modified)
            {
                entry.Entity.UpdatedAt = now;
                entry.Entity.UpdatedById = userId;
            }
        }

        return await base.SaveChangesAsync(cancellationToken);
    }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<Condominium>(e =>
        {
            e.Property(x => x.Name).IsRequired().HasMaxLength(200);

            e.Property(x => x.Address).IsRequired().HasMaxLength(500);

            e.Property(x => x.NIF).IsRequired().HasMaxLength(20);

            e.Property(x => x.IBAN).IsRequired().HasMaxLength(34);

            e.HasIndex(x => x.NIF).IsUnique();

            e.HasMany(x => x.Admins)
             .WithMany(x => x.ManagedCondominiums)
             .UsingEntity(j => j.ToTable("CondominiumAdmins"));

            e.HasMany(x => x.Fractions)
             .WithOne(x => x.Condominium)
             .HasForeignKey(x => x.CondominiumId)
             .OnDelete(DeleteBehavior.Restrict);

            e.HasMany(x => x.Expenses)
             .WithOne(x => x.Condominium)
             .HasForeignKey(x => x.CondominiumId)
             .OnDelete(DeleteBehavior.Restrict);

            e.HasQueryFilter(x => !x.IsDeleted);
        });

        builder.Entity<Fraction>(e =>
        {
            e.Ignore(x => x.PaymentStatus);

            e.Property(x => x.Block).HasMaxLength(10);

            e.Property(x => x.Floor).IsRequired().HasMaxLength(10);

            e.Property(x => x.Letter).IsRequired().HasMaxLength(10);

            e.Property(x => x.Permilage).HasColumnType("decimal(8,3)");

            e.HasMany(x => x.OwnerFractions)
             .WithOne(x => x.Fraction)
             .HasForeignKey(x => x.FractionId)
             .OnDelete(DeleteBehavior.Restrict);

            e.HasMany(x => x.QuotaConfigs)
             .WithOne(x => x.Fraction)
             .HasForeignKey(x => x.FractionId)
             .OnDelete(DeleteBehavior.Cascade);

            e.HasMany(x => x.LedgerEntries)
             .WithOne(x => x.Fraction)
             .HasForeignKey(x => x.FractionId)
             .OnDelete(DeleteBehavior.Restrict);

            e.HasQueryFilter(x => !x.IsDeleted);
        });

        builder.Entity<Owner>(e =>
        {
            e.Property(x => x.Name).IsRequired().HasMaxLength(200);

            e.Property(x => x.NIF).IsRequired().HasMaxLength(20);

            e.Property(x => x.Email).IsRequired().HasMaxLength(200);

            e.Property(x => x.Contact).IsRequired().HasMaxLength(50);

            e.HasIndex(x => x.NIF).IsUnique();

            e.HasIndex(x => x.Email).IsUnique();

            e.HasOne(x => x.User)
             .WithMany()
             .HasForeignKey(x => x.UserId)
             .OnDelete(DeleteBehavior.SetNull);

            e.HasMany(x => x.OwnerFractions)
             .WithOne(x => x.Owner)
             .HasForeignKey(x => x.OwnerId)
             .OnDelete(DeleteBehavior.Restrict);

            e.HasQueryFilter(x => !x.IsDeleted);
        });

        builder.Entity<OwnerFraction>(e =>
        {
            e.HasKey(x => new { x.OwnerId, x.FractionId });

            e.Property(x => x.IsPrincipal);
        });

        builder.Entity<LedgerEntry>(e =>
        {
            e.Property(x => x.Amount).HasColumnType("decimal(16,2)");

            e.Property(x => x.Type).HasConversion<string>().HasMaxLength(20);

            e.Property(x => x.DueDate);

            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(20);

            e.HasOne(x => x.PrincipalOwner)
             .WithMany(x => x.LedgerEntries)
             .HasForeignKey(x => x.PrincipalOwnerId)
             .OnDelete(DeleteBehavior.Restrict);

            e.HasQueryFilter(x => !x.IsDeleted);
        });

        builder.Entity<QuotaConfig>(e =>
        {
            e.Property(x => x.MonthlyValue).HasColumnType("decimal(16,2)");

            e.Property(x => x.StartDate);

            e.Property(x => x.EndDate);

            e.Property(x => x.IsActive);

            e.HasQueryFilter(x => !x.IsDeleted);
        });

        builder.Entity<Expense>(e =>
        {
            e.Property(x => x.Description).IsRequired().HasMaxLength(500);

            e.Property(x => x.Amount).HasColumnType("decimal(16,2)");

            e.Property(x => x.Date);

            e.HasQueryFilter(x => !x.IsDeleted);
        });

        // Configure CreatedBy/UpdatedBy FK relationships for all BaseEntity-derived types
        foreach (var entityType in builder.Model.GetEntityTypes()
            .Where(e => typeof(BaseEntity).IsAssignableFrom(e.ClrType)))
        {
            builder.Entity(entityType.ClrType)
                .HasKey(nameof(BaseEntity.Id));

            builder.Entity(entityType.ClrType)
                .Property(nameof(BaseEntity.CreatedAt));

            builder.Entity(entityType.ClrType)
                .HasOne(typeof(ApplicationUser), nameof(BaseEntity.CreatedBy))
                .WithMany()
                .HasForeignKey(nameof(BaseEntity.CreatedById))
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity(entityType.ClrType)
                .Property(nameof(BaseEntity.UpdatedAt));

            builder.Entity(entityType.ClrType)
                .HasOne(typeof(ApplicationUser), nameof(BaseEntity.UpdatedBy))
                .WithMany()
                .HasForeignKey(nameof(BaseEntity.UpdatedById))
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}

using System;

namespace CondoBackend.Domain.Entities;

public class Owner : BaseEntity
{
    public required string Name { get; set; }
    public required string NIF { get; set; }
    public required string Email { get; set; }
    public required string Contact { get; set; }

    public string? UserId { get; set; }
    public virtual ApplicationUser? User { get; set; }

    public virtual ICollection<OwnerFraction> OwnerFractions { get; set; } = null!;
    public virtual ICollection<LedgerEntry> LedgerEntries { get; set; } = null!;
}

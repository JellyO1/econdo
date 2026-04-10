using System;

namespace CondoBackend.Domain.Entities;

public class OwnerFraction 
{
    public int OwnerId { get; set; }
    public virtual Owner Owner { get; set; } = null!;

    public int FractionId { get; set; }
    public virtual Fraction Fraction { get; set; } = null!;

    public bool IsPrincipal { get; set; }
}

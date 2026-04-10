using System;

namespace CondoBackend.Domain.Entities;

public class QuotaConfig : BaseEntity
{
    public required int FractionId { get; set; }
    public decimal MonthlyValue { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public bool IsActive { get; set; }

    public virtual Fraction Fraction { get; set; } = null!;

}

using System;

namespace CondoBackend.Domain.Entities;

public enum LedgerEntryType
{
    Quota,
    ExtraQuota,
}

public enum LedgerEntryStatus
{
    Pending, // created, due date not yet passed
    Overdue, // past due date, not yet paid
    Settled, // payment confirmed
    Cancelled, // voided entry
}

public class LedgerEntry : BaseEntity
{
    public int FractionId { get; set; }
    public int PrincipalOwnerId { get; set; }
    public LedgerEntryType Type { get; set; }
    public decimal Amount { get; set; }
    public DateOnly DueDate { get; set; }
    public LedgerEntryStatus Status { get; set; }

    public virtual Fraction Fraction { get; set; } = null!;
    public virtual Owner PrincipalOwner { get; set; } = null!;
}

using System;

namespace CondoBackend.Domain.Entities;

public enum FractionPaymentStatus
{
    Pending,  // no active entries have been settled
    Partial,  // some active entries settled, some not
    Settled,  // all active entries settled
}

public class Fraction : BaseEntity
{
    public string? Block { get; set; }
    public required string Floor { get; set; }
    public required string Letter { get; set; }
    public required decimal Permilage { get; set; }

    public FractionPaymentStatus PaymentStatus
    {
        get
        {
            var active = LedgerEntries?
                .Where(e => e.Status != LedgerEntryStatus.Cancelled)
                .ToList();

            if (active is null || active.Count == 0)
                return FractionPaymentStatus.Settled;

            if (active.All(e => e.Status == LedgerEntryStatus.Settled))
                return FractionPaymentStatus.Settled;

            if (active.Any(e => e.Status == LedgerEntryStatus.Settled))
                return FractionPaymentStatus.Partial;

            return FractionPaymentStatus.Pending;
        }
    }

    public int CondominiumId { get; set; }
    public virtual Condominium Condominium { get; set; } = null!;
    public virtual ICollection<OwnerFraction> OwnerFractions { get; set; } = null!;
    public virtual ICollection<QuotaConfig> QuotaConfigs { get; set; } = null!;
    public virtual ICollection<LedgerEntry> LedgerEntries { get; set; } = null!;


}

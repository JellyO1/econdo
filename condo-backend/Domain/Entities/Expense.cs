using System;

namespace CondoBackend.Domain.Entities;

public class Expense : BaseEntity
{
    public required string Description { get; set; }
    public decimal Amount { get; set; }
    public DateTime Date { get; set; }

    public int CondominiumId { get; set; }
    public virtual Condominium Condominium { get; set; } = null!;
}

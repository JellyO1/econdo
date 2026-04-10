namespace CondoBackend.Domain.Entities;

public class Condominium : BaseEntity {
    public required string Name { get; set; }
    public required string Address { get; set; }
    public required string NIF { get; set; }
    public required string IBAN { get; set; }

    public virtual ICollection<ApplicationUser> Admins { get; set; } = null!;
    public virtual ICollection<Fraction> Fractions { get; set; } = null!;
    public virtual ICollection<Expense> Expenses { get; set; } = null!;
}
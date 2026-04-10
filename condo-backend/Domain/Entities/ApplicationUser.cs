using Microsoft.AspNetCore.Identity;

namespace CondoBackend.Domain.Entities;

public class ApplicationUser : IdentityUser<string>
{
    public virtual ICollection<Condominium> ManagedCondominiums { get; set; } = null!;
}
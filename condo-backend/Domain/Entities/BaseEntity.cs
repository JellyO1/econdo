namespace CondoBackend.Domain.Entities;

public abstract class BaseEntity
{
    public int Id { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public string CreatedById { get; set; } = null!;
    public virtual ApplicationUser CreatedBy { get; set; } = null!;
    public string? UpdatedById { get; set; }
    public virtual ApplicationUser? UpdatedBy { get; set; }
    public bool IsDeleted { get; set; }
}

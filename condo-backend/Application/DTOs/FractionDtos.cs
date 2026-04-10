namespace CondoBackend.Application.DTOs;

public record FractionDto(
    int Id,
    int CondominiumId,
    string? Block,
    string Floor,
    string Letter,
    decimal Permilage,
    string PaymentStatus
);

public record CreateFractionRequest(
    int CondominiumId,
    string? Block,
    string Floor,
    string Letter,
    decimal Permilage
);

public record UpdateFractionRequest(
    string? Block,
    string Floor,
    string Letter,
    decimal Permilage
);

public record OwnerFractionDto(
    int OwnerId,
    string OwnerName,
    int FractionId,
    bool IsPrincipal
);

public record AssignOwnerToFractionRequest(
    int OwnerId,
    bool IsPrincipal
);

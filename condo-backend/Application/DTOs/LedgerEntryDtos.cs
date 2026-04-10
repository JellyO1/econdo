using CondoBackend.Domain.Entities;

namespace CondoBackend.Application.DTOs;

public record LedgerEntryDto(
    int Id,
    int FractionId,
    int PrincipalOwnerId,
    string PrincipalOwnerName,
    string Type,
    decimal Amount,
    DateOnly DueDate,
    string Status
);

public record CreateLedgerEntryRequest(
    int FractionId,
    int PrincipalOwnerId,
    LedgerEntryType Type,
    decimal Amount,
    DateOnly DueDate
);

public record UpdateLedgerEntryStatusRequest(
    LedgerEntryStatus Status
);

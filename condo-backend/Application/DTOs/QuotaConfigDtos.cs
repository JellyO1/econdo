namespace CondoBackend.Application.DTOs;

public record QuotaConfigDto(
    int Id,
    int FractionId,
    decimal MonthlyValue,
    DateOnly StartDate,
    DateOnly? EndDate,
    bool IsActive
);

public record CreateQuotaConfigRequest(
    int FractionId,
    decimal MonthlyValue,
    DateOnly StartDate,
    DateOnly? EndDate
);

public record UpdateQuotaConfigRequest(
    decimal MonthlyValue,
    DateOnly StartDate,
    DateOnly? EndDate,
    bool IsActive
);

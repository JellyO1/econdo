namespace CondoBackend.Application.DTOs;

public record CondominiumAdminDto(
    string UserId,
    string Email
);

public record CondominiumDto(
    int Id,
    string Name,
    string Address,
    string NIF,
    string IBAN,
    IEnumerable<CondominiumAdminDto> Admins
);

public record CreateCondominiumRequest(
    string Name,
    string Address,
    string NIF,
    string IBAN
);

public record UpdateCondominiumRequest(
    string Name,
    string Address,
    string NIF,
    string IBAN
);

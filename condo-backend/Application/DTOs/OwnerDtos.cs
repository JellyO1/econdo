namespace CondoBackend.Application.DTOs;

public record OwnerDto(
    int Id,
    string Name,
    string NIF,
    string Email,
    string Contact
);

public record CreateOwnerRequest(
    string Name,
    string NIF,
    string Email,
    string Contact
);

public record UpdateOwnerRequest(
    string Name,
    string NIF,
    string Email,
    string Contact
);

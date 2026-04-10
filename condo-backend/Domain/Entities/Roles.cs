using System;

namespace CondoBackend.Domain.Entities;

public static class Roles
{
    /// <summary>
    /// Super user with all permissions, including condominium management.
    /// </summary>
    public const string SuperUser = "SuperUser";

    /// <summary>
    /// Condominium administrator with permissions to manage condominium details, fractions, and payments, but not user accounts.
    /// </summary>
    public const string Admin = "Admin";

    /// <summary>
    /// Condominium resident with permissions to view and manage their own fractions and payments.
    /// </summary>
    public const string Resident = "Resident";
}

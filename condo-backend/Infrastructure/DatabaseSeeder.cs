using CondoBackend.Domain.Entities;
using Microsoft.AspNetCore.Identity;

namespace CondoBackend.Infrastructure;

public static class DatabaseSeeder
{
    public static async Task SeedAsync(WebApplication app)
    {
        using var scope = app.Services.CreateScope();
        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole<string>>>();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var config = scope.ServiceProvider.GetRequiredService<IConfiguration>();

        await SeedRolesAsync(roleManager);
        await SeedSuperUserAsync(userManager, config);
    }

    private static async Task SeedRolesAsync(RoleManager<IdentityRole<string>> roleManager)
    {
        foreach (var role in new[] { Roles.SuperUser, Roles.Admin, Roles.Resident })
        {
            if (!await roleManager.RoleExistsAsync(role))
                await roleManager.CreateAsync(new IdentityRole<string>(role));
        }
    }

    private static async Task SeedSuperUserAsync(UserManager<ApplicationUser> userManager, IConfiguration config)
    {
        var email = config["SuperUser:Email"] ?? throw new InvalidOperationException("SuperUser:Email is not configured.");
        var password = config["SuperUser:Password"] ?? throw new InvalidOperationException("SuperUser:Password is not configured.");

        if (await userManager.FindByEmailAsync(email) is not null)
            return;

        var user = new ApplicationUser
        {
            UserName = email,
            Email = email,
            EmailConfirmed = true
        };

        var result = await userManager.CreateAsync(user, password);
        if (!result.Succeeded)
            throw new InvalidOperationException($"Failed to seed SuperUser: {string.Join(", ", result.Errors.Select(e => e.Description))}");

        await userManager.AddToRoleAsync(user, Roles.SuperUser);
    }
}

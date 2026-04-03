using Microsoft.AspNetCore.Authorization;

namespace AspNetReactTemplate.Server.Extensions.Polices;

public static class UserPolicy
{
    public static void AddPolicies(AuthorizationOptions options)
    {
        options.AddPolicy("CanSeeAllUsers", policy => policy.RequireRole("Admin"));
        options.AddPolicy("CanSetRole", policy => policy.RequireRole("Admin"));

        foreach (var role in Enum.GetValues<Models.Identity.Enums.Roles>())
        {
            options.AddPolicy($"CanSetRole[{role}]", policy => policy.RequireRole("Admin"));
        }
    }
}
using AspNetReactTemplate.Server.Models.Identity.Enums;
using Microsoft.AspNetCore.Authorization;

namespace AspNetReactTemplate.Server.Infrastracture.Identity
{
    public static class AuthorizationPolicies
    {
        public const string AdminOnly = "AdminOnly";
        public const string UserOnly = "UserOnly";
        public const string CanEditTools = "CanEditTools";

        public static AuthorizationOptions AddCustomPolicies(this AuthorizationOptions options)
        {
            // Admin policies
            options.AddPolicy(AdminOnly, policy => policy.RequireRole(Roles.Admin.ToString()));
            options.AddPolicy(CanEditTools, policy => policy.RequireRole(Roles.Admin.ToString()));

            // User policies
            options.AddPolicy(UserOnly, policy => policy.RequireRole(Roles.User.ToString()));
            return options;
        }
    }
}
using AspNetReactTemplate.Server.Models.Identity.Enums;
using Microsoft.AspNetCore.Authorization;

namespace AspNetReactTemplate.Server.Infrastracture.Identity
{
    public static class AuthorizationPolicies
    {
        public const string AdminOnly = "AdminOnly";
        public const string UserOnly = "UserOnly";
        public const string CanEditTools = "CanEditTools";
        public const string CanHelpWithManuals = "CanHelpWithManuals";
        public const string AdminOrSelfExpert = "AdminOrSelfExpert";
        public const string AdminOrAssignedManual = "AdminOrAssignedManual";

        public static AuthorizationOptions AddCustomPolicies(this AuthorizationOptions options)
        {
            // Admin policies
            options.AddPolicy(AdminOnly, policy => policy.RequireRole(Roles.Admin.ToString()));
            options.AddPolicy(CanEditTools, policy => policy.RequireRole(Roles.Admin.ToString()));
            options.AddPolicy(CanHelpWithManuals, policy => policy.RequireRole(Roles.Admin.ToString()));    // temp - potom se nahradí rolí Expert
            // Admin policies with handlers
            options.AddPolicy(AdminOrSelfExpert, policy =>
                policy.RequireAuthenticatedUser().AddRequirements(new AdminOrSelfExpertRequirement()));
            options.AddPolicy(AdminOrAssignedManual, policy =>
                policy.RequireAuthenticatedUser().AddRequirements(new AdminOrAssignedManualRequirement()));

            // User policies
            options.AddPolicy(UserOnly, policy => policy.RequireRole(Roles.User.ToString()));

            return options;
        }
    }
}
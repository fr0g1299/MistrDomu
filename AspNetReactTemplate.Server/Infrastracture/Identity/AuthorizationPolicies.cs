using AspNetReactTemplate.Server.Models.Identity.Enums;
using Microsoft.AspNetCore.Authorization;
using AspNetReactTemplate.Server.Infrastracture.Identity.Handlers;

namespace AspNetReactTemplate.Server.Infrastracture.Identity
{
    public static class AuthorizationPolicies
    {
        public const string AuthenticatedUser = "AuthenticatedUser";
        public const string AdminOnly = "AdminOnly";
        public const string UserOnly = "UserOnly";
        public const string ExpertOnly = "ExpertOnly";
        public const string AdminOrExpertOnly = "AdminOrExpertOnly";
        public const string AdminOrSelfExpert = "AdminOrSelfExpert";
        public const string AdminOrAssignedManual = "AdminOrAssignedManual";

        public static AuthorizationOptions AddCustomPolicies(this AuthorizationOptions options)
        {
            options.AddPolicy(AuthenticatedUser, policy =>
                policy.AddRequirements(new AuthenticatedUserRequirement()));

            // Admin policies
            options.AddPolicy(AdminOnly, policy =>
                policy.RequireAuthenticatedUser().AddRequirements(new AdminOnlyRequirement()));
            options.AddPolicy(AdminOrSelfExpert, policy =>
                policy.RequireAuthenticatedUser().AddRequirements(new AdminOrSelfExpertRequirement()));
            options.AddPolicy(AdminOrAssignedManual, policy =>
                policy.RequireAuthenticatedUser().AddRequirements(new AdminOrAssignedManualRequirement()));

            // Expert policies
            options.AddPolicy(ExpertOnly, policy =>
                policy.RequireAuthenticatedUser().AddRequirements(new ExpertOnlyRequirement()));

            // Admin or Expert policies
            options.AddPolicy(AdminOrExpertOnly, policy =>
                policy.RequireAuthenticatedUser().AddRequirements(new AdminOrExpertOnlyRequirement()));

            // User policies
            // So far not used
            options.AddPolicy(UserOnly, policy =>
                policy.RequireAuthenticatedUser().AddRequirements(new RoleRequirement(Roles.User.ToString())));

            return options;
        }
    }
}
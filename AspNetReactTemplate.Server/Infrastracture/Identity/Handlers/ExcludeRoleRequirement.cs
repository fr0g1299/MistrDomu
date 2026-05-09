using Microsoft.AspNetCore.Authorization;

namespace AspNetReactTemplate.Server.Infrastracture.Identity.Handlers;

public sealed class ExcludeRoleRequirement : IAuthorizationRequirement
{
    public string RoleName { get; }

    public ExcludeRoleRequirement(string roleName)
    {
        RoleName = roleName;
    }
}


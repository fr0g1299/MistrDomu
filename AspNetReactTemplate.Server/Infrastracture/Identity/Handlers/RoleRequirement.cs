using Microsoft.AspNetCore.Authorization;

namespace AspNetReactTemplate.Server.Infrastracture.Identity.Handlers;

public sealed class RoleRequirement : IAuthorizationRequirement
{
    public string RoleName { get; }

    public RoleRequirement(string roleName)
    {
        RoleName = roleName;
    }
}

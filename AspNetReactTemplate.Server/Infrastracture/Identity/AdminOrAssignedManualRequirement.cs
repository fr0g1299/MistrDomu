using Microsoft.AspNetCore.Authorization;

namespace AspNetReactTemplate.Server.Infrastracture.Identity;

public sealed class AdminOrAssignedManualRequirement : IAuthorizationRequirement
{
}

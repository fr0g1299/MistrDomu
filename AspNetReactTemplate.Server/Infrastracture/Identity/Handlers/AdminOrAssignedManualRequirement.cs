using Microsoft.AspNetCore.Authorization;

namespace AspNetReactTemplate.Server.Infrastracture.Identity.Handlers;

public sealed class AdminOrAssignedManualRequirement : IAuthorizationRequirement
{
}

using Microsoft.AspNetCore.Authorization;

namespace AspNetReactTemplate.Server.Infrastracture.Identity.Handlers;

public sealed class AdminOrExpertOnlyRequirement : IAuthorizationRequirement
{
}

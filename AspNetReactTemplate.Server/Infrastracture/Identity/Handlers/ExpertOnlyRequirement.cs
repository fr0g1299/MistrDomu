using Microsoft.AspNetCore.Authorization;

namespace AspNetReactTemplate.Server.Infrastracture.Identity.Handlers
{
    public class ExpertOnlyRequirement : IAuthorizationRequirement
    {
    }
}
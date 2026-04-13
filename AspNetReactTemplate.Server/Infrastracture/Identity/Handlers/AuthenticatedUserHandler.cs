using Microsoft.AspNetCore.Authorization;

namespace AspNetReactTemplate.Server.Infrastracture.Identity.Handlers;

public sealed class AuthenticatedUserHandler : AuthorizationHandler<AuthenticatedUserRequirement>
{
    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        AuthenticatedUserRequirement requirement)
    {
        if (context.User.Identity is { IsAuthenticated: true })
        {
            context.Succeed(requirement);
        }

        return Task.CompletedTask;
    }
}

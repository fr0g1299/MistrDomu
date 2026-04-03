using AspNetReactTemplate.Server.Models.Identity.Enums;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace AspNetReactTemplate.Server.Infrastracture.Identity;

public sealed class AdminOrSelfExpertHandler : AuthorizationHandler<AdminOrSelfExpertRequirement, int>
{
    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        AdminOrSelfExpertRequirement requirement,
        int expertId)
    {
        if (context.User.IsInRole(Roles.Admin.ToString()))
        {
            context.Succeed(requirement);
            return Task.CompletedTask;
        }

        var userIdClaim = context.User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (int.TryParse(userIdClaim, out var currentUserId) && currentUserId == expertId)
        {
            context.Succeed(requirement);
        }

        return Task.CompletedTask;
    }
}

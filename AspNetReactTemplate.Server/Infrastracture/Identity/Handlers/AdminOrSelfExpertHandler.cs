using AspNetReactTemplate.Server.Models.Identity;
using AspNetReactTemplate.Server.Models.Identity.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using System.Security.Claims;

namespace AspNetReactTemplate.Server.Infrastracture.Identity.Handlers;

public sealed class AdminOrSelfExpertHandler : AuthorizationHandler<AdminOrSelfExpertRequirement, int>
{
    private readonly UserManager<User> _userManager;

    public AdminOrSelfExpertHandler(UserManager<User> userManager)
    {
        _userManager = userManager;
    }

    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        AdminOrSelfExpertRequirement requirement,
        int expertId)
    {
        return HandleInternalAsync(context, requirement, expertId);
    }

    private async Task HandleInternalAsync(
        AuthorizationHandlerContext context,
        AdminOrSelfExpertRequirement requirement,
        int expertId)
    {
        var userId = _userManager.GetUserId(context.User);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return;
        }

        var user = await _userManager.FindByIdAsync(userId);
        if (user is not null && await _userManager.IsInRoleAsync(user, Roles.Admin.ToString()))
        {
            context.Succeed(requirement);
            return;
        }

        var userIdClaim = context.User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (int.TryParse(userIdClaim, out var currentUserId) && currentUserId == expertId)
        {
            context.Succeed(requirement);
        }
    }
}

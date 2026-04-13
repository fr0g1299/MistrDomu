using AspNetReactTemplate.Server.Models.Identity;
using AspNetReactTemplate.Server.Models.Identity.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;

namespace AspNetReactTemplate.Server.Infrastracture.Identity.Handlers;

public sealed class AdminOrExpertOnlyHandler : AuthorizationHandler<AdminOrExpertOnlyRequirement>
{
    private readonly UserManager<User> _userManager;

    public AdminOrExpertOnlyHandler(UserManager<User> userManager)
    {
        _userManager = userManager;
    }

    protected override async Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        AdminOrExpertOnlyRequirement requirement)
    {
        var userId = _userManager.GetUserId(context.User);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return;
        }

        var user = await _userManager.FindByIdAsync(userId);
        if (user is null)
        {
            return;
        }

        var isAdmin = await _userManager.IsInRoleAsync(user, Roles.Admin.ToString());
        if (isAdmin)
        {
            context.Succeed(requirement);
            return;
        }

        var isExpert = await _userManager.IsInRoleAsync(user, Roles.Expert.ToString());
        if (isExpert)
        {
            context.Succeed(requirement);
        }
    }
}

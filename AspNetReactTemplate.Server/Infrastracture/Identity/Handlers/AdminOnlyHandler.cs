using AspNetReactTemplate.Server.Models.Identity;
using AspNetReactTemplate.Server.Models.Identity.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;

namespace AspNetReactTemplate.Server.Infrastracture.Identity.Handlers;

public sealed class AdminOnlyHandler : AuthorizationHandler<AdminOnlyRequirement>
{
    private readonly UserManager<User> _userManager;

    public AdminOnlyHandler(UserManager<User> userManager)
    {
        _userManager = userManager;
    }

    protected override async Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        AdminOnlyRequirement requirement)
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
        }
    }
}
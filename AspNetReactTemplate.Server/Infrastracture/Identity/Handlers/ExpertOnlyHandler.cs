using AspNetReactTemplate.Server.Models.Identity;
using AspNetReactTemplate.Server.Models.Identity.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;

namespace AspNetReactTemplate.Server.Infrastracture.Identity.Handlers;

public class ExpertOnlyHandler : AuthorizationHandler<ExpertOnlyRequirement>
{
    private readonly UserManager<User> _userManager;

    public ExpertOnlyHandler(UserManager<User> userManager)
    {
        _userManager = userManager;
    }

    protected override async Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        ExpertOnlyRequirement requirement)
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

        var isExpert = await _userManager.IsInRoleAsync(user, Roles.Expert.ToString());
        if (isExpert)
        {
            context.Succeed(requirement);
        }
    }
}

using AspNetReactTemplate.Server.Data;
using AspNetReactTemplate.Server.Models.Identity;
using AspNetReactTemplate.Server.Models.Identity.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace AspNetReactTemplate.Server.Infrastracture.Identity.Handlers;

public sealed class AdminOrAssignedManualHandler : AuthorizationHandler<AdminOrAssignedManualRequirement, int>
{
    private readonly AppDbContext _context;
    private readonly UserManager<User> _userManager;

    public AdminOrAssignedManualHandler(AppDbContext context, UserManager<User> userManager)
    {
        _context = context;
        _userManager = userManager;
    }

    protected override async Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        AdminOrAssignedManualRequirement requirement,
        int manualId)
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
        if (!int.TryParse(userIdClaim, out var currentUserId))
        {
            return;
        }

        var isAssigned = await _context.ExpertManualHelps
            .AsNoTracking()
            .AnyAsync(x => x.ManualId == manualId && x.ExpertId == currentUserId);

        if (isAssigned)
        {
            context.Succeed(requirement);
        }
    }
}

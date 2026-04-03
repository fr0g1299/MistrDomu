using AspNetReactTemplate.Server.Data;
using AspNetReactTemplate.Server.Models.Identity.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace AspNetReactTemplate.Server.Infrastracture.Identity;

public sealed class AdminOrAssignedManualHandler : AuthorizationHandler<AdminOrAssignedManualRequirement, int>
{
    private readonly AppDbContext _context;

    public AdminOrAssignedManualHandler(AppDbContext context)
    {
        _context = context;
    }

    protected override async Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        AdminOrAssignedManualRequirement requirement,
        int manualId)
    {
        if (context.User.IsInRole(Roles.Admin.ToString()))
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

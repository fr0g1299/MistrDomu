using AspNetReactTemplate.Server.Services.Abstraction.Steps;
using System.Security.Claims;
using AspNetReactTemplate.Server.Data;
using Microsoft.EntityFrameworkCore;

namespace AspNetReactTemplate.Server.Services.Implementation.Steps;

public class StepsQueryService : IStepsQueryService
{
    private readonly AppDbContext _context;

    public StepsQueryService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<int>> GetCompleted(int manualId, ClaimsPrincipal user)
    {
        var userIdClaim = user.FindFirstValue(ClaimTypes.NameIdentifier);

        if (!int.TryParse(userIdClaim, out var userId))
        {
            return [];
        }

        var completedSteps = await _context.UserCompletedSteps
            .Where(u => u.UserId == userId && u.ManualId == manualId)
            .Select(u => u.StepId)
            .ToListAsync();

        return completedSteps;
    }
}
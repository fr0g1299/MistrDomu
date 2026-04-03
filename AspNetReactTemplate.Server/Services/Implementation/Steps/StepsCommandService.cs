using System.Security.Claims;
using AspNetReactTemplate.Server.Data;
using AspNetReactTemplate.Server.Models;
using AspNetReactTemplate.Server.Services.Abstraction.Steps;
using Microsoft.EntityFrameworkCore;

namespace AspNetReactTemplate.Server.Services.Implementation.Steps;

public class StepsCommandService : IStepsCommandService
{
    private readonly AppDbContext _context;

    public StepsCommandService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<StepsCommandResult> ToggleCompleted(int manualId, int stepId, ClaimsPrincipal user)
    {
        var userIdClaim = user.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdClaim, out var userId))
        {
            return StepsCommandResult.Unauthorized;
        }

        var existing = await _context.UserCompletedSteps
            .FirstOrDefaultAsync(u => u.UserId == userId && u.StepId == stepId);

        if (existing is not null)
        {
            _context.UserCompletedSteps.Remove(existing);
        }
        else
        {
            _context.UserCompletedSteps.Add(new UserCompletedStep
            {
                UserId = userId,
                StepId = stepId,
                ManualId = manualId,
                CompletedAt = DateTime.UtcNow
            });
        }

        await _context.SaveChangesAsync();
        return StepsCommandResult.Success;
    }

    public async Task<StepsCommandResult> ResetCompleted(int manualId, ClaimsPrincipal user)
    {
        var userIdClaim = user.FindFirstValue(ClaimTypes.NameIdentifier);

        if (!int.TryParse(userIdClaim, out var userId))
        {
            return StepsCommandResult.Unauthorized;
        }

        var completedSteps = await _context.UserCompletedSteps
            .Where(u => u.UserId == userId && u.ManualId == manualId)
            .ToListAsync();

        _context.UserCompletedSteps.RemoveRange(completedSteps);
        await _context.SaveChangesAsync();

        return StepsCommandResult.Success;
    }
}
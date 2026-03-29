using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using AspNetReactTemplate.Server.Data;
using AspNetReactTemplate.Server.Models;

namespace AspNetReactTemplate.Server.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/[controller]")]
    public class StepsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public StepsController(AppDbContext context)
        {
            _context = context;
        }

        // GET /api/Steps/{manualId}/completed
        // Returns the actual DB step IDs the current user has marked done for this manual.
        [HttpGet("{manualId}/completed")]
        public async Task<ActionResult<IEnumerable<int>>> GetCompleted(int manualId)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            var completedStepIds = await _context.UserCompletedSteps
                .Where(u => u.UserId == userId && u.ManualId == manualId)
                .Select(u => u.StepId)
                .ToListAsync();

            return Ok(completedStepIds);
        }

        // POST /api/Steps/{manualId}/completed/{stepId}
        // Toggles a step: adds the completed record if absent, removes it if present.
        [HttpPost("{manualId}/completed/{stepId}")]
        public async Task<ActionResult> ToggleCompleted(int manualId, int stepId)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

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
            return NoContent();
        }

        // DELETE /api/Steps/{manualId}/completed
        // Clears all completed-step records for the current user in this manual.
        [HttpDelete("{manualId}/completed")]
        public async Task<ActionResult> ResetCompleted(int manualId)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            var rows = await _context.UserCompletedSteps
                .Where(u => u.UserId == userId && u.ManualId == manualId)
                .ToListAsync();

            if (rows.Count > 0)
            {
                _context.UserCompletedSteps.RemoveRange(rows);
                await _context.SaveChangesAsync();
            }

            return NoContent();
        }
    }
}

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AspNetReactTemplate.Server.Infrastracture.Identity;
using AspNetReactTemplate.Server.Services.Abstraction.Steps;

namespace AspNetReactTemplate.Server.Controllers
{
    [ApiController]
    [Authorize(Policy = AuthorizationPolicies.AuthenticatedUser)]
    [Route("api/[controller]")]
    public class StepsController : ControllerBase
    {
        private readonly IStepsQueryService _stepsQueryService;
        private readonly IStepsCommandService _stepsCommandService;

        public StepsController(IStepsQueryService stepsQueryService, IStepsCommandService stepsCommandService)
        {
            _stepsQueryService = stepsQueryService;
            _stepsCommandService = stepsCommandService;
        }

        // GET /api/Steps/{manualId}/completed
        // Returns the actual DB step IDs the current user has marked done for this manual.
        [HttpGet("{manualId}/completed")]
        public async Task<ActionResult<IEnumerable<int>>> GetCompleted(int manualId)
        {
            var completedSteps = await _stepsQueryService.GetCompleted(manualId, User);

            return Ok(completedSteps);
        }

        // POST /api/Steps/{manualId}/completed/{stepId}
        // Toggles a step: adds the completed record if absent, removes it if present.
        [HttpPost("{manualId}/completed/{stepId}")]
        public async Task<ActionResult> ToggleCompleted(int manualId, int stepId)
        {
            var result = await _stepsCommandService.ToggleCompleted(manualId, stepId, User);

            if (!result.IsSuccess)
            {
                return Unauthorized();
            }

            return NoContent();
        }

        // DELETE /api/Steps/{manualId}/completed
        // Clears all completed-step records for the current user in this manual.
        [HttpDelete("{manualId}/completed")]
        public async Task<ActionResult> ResetCompleted(int manualId)
        {
            var result = await _stepsCommandService.ResetCompleted(manualId, User);

            if (!result.IsSuccess)
            {
                return Unauthorized();
            }

            return NoContent();
        }
    }
}

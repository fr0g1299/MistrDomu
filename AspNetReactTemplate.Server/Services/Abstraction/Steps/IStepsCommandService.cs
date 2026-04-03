using System.Security.Claims;

namespace AspNetReactTemplate.Server.Services.Abstraction.Steps;

public interface IStepsCommandService
{
    /// <summary>
    /// Toggles a step: adds the completed record if absent, removes it if present.
    /// </summary>
    /// <param name="manualId"></param>
    /// <param name="stepId"></param>
    /// <param name="user"></param>
    /// <returns></returns>
    Task<StepsCommandResult> ToggleCompleted(int manualId, int stepId, ClaimsPrincipal user);

    /// <summary>
    /// Removes all completed records for the user and manual, effectively resetting progress.
    /// </summary>
    /// <param name="manualId"></param>
    /// <param name="user"></param>
    /// <returns></returns>
    Task<StepsCommandResult> ResetCompleted(int manualId, ClaimsPrincipal user);
}
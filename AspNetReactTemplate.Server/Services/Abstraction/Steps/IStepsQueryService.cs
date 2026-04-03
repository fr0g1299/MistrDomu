using System.Security.Claims;
namespace AspNetReactTemplate.Server.Services.Abstraction.Steps;

public interface IStepsQueryService
{
    /// <summary>
    /// Returns the actual DB step IDs the current user has marked done for this manual.
    /// </summary>
    /// <param name="manualId"></param>
    /// <returns></returns>
    Task<IReadOnlyList<int>> GetCompleted(int manualId, ClaimsPrincipal user);
}
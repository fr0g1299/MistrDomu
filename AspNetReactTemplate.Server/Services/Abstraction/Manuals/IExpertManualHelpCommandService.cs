using AspNetReactTemplate.Server.Models.DTOs.Manuals;
using System.Security.Claims;

namespace AspNetReactTemplate.Server.Services.Abstraction.Manuals;

public interface IExpertManualHelpCommandService
{
    /// <summary>
    /// Adds an association between an expert and a manual. This expert will now be able to help with the manual.
    /// </summary>
    /// <param name="manualId"></param>
    /// <param name="expertId"></param>
    /// <returns></returns>
    Task AddManualToExpert(ExpertManualHelpCreateDto dto, ClaimsPrincipal user);

    /// <summary>
    /// Removes the association between an expert and a manual.
    /// </summary>
    /// <param name="manualId"></param>
    /// <param name="expertId"></param>
    /// <returns></returns>
    Task RemoveManualFromExpert(int manualId, int expertId, ClaimsPrincipal user);
}
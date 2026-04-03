using AspNetReactTemplate.Server.Models.DTOs.Manuals;
using System.Linq;

namespace AspNetReactTemplate.Server.Services.Abstraction.Manuals;

public interface IExpertManualHelpQueryService
{
    /// <summary>
    /// Gets all expert-manual help associations for a specific manual.
    /// </summary>
    /// <param name="manualId"></param>
    /// <returns>A read-only list of expert-manual help associations.</returns>
    Task<IReadOnlyList<ExpertManualHelpReadDto>> GetManualHelps(int manualId);

    /// <summary>
    /// Gets experts selected for a specific manual.
    /// </summary>
    /// <param name="manualId"></param>
    /// <returns>A read-only list of experts for the specified manual.</returns>
    Task<IReadOnlyList<ExpertForManualReadDto>> GetExpertsForManual(int manualId);

    /// <summary>
    /// Gets manuals selected for a specific expert.
    /// </summary>
    /// <param name="expertId"></param>
    /// <returns>A read-only list of manuals for the specified expert.</returns> <summary>
    /// 
    /// </summary>
    /// <param name="expertId"></param>
    /// <returns></returns>
    Task<IReadOnlyList<ManualForExpertReadDto>> GetManualsForExpert(int expertId);
}
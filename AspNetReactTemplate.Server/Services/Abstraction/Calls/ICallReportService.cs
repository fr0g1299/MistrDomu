using AspNetReactTemplate.Server.Models.DTOs.Calls;

namespace AspNetReactTemplate.Server.Services.Abstraction.Calls;

public interface ICallSessionReportService
{
    /// <summary>
    /// Gets the total number of calls for a given expert.
    /// </summary>
    /// <param name="expertUserId"></param>
    /// <param name="cancellationToken"></param>
    Task<int> GetNumberOfCallsByExpertAsync(int expertUserId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets the total number of calls by a given expert for a specific manual.
    /// </summary>
    /// <param name="expertId"></param>
    /// <param name="manualId"></param>
    /// <param name="cancellationToken"></param>
    Task<int> GetTotalCallsByExpertForManualAsync(int expertId, int manualId, CancellationToken cancellationToken = default);
}
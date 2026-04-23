using AspNetReactTemplate.Server.Models.DTOs.Calls;

namespace AspNetReactTemplate.Server.Services.Abstraction.Calls;

public interface ICallSessionLogService
{
    /// <summary>
    /// Starts a call session for the given participant and request details.
    /// </summary>
    /// <param name="participantUserId">The ID of the participant.</param>
    /// <param name="request">The request details for starting the call session.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>A task representing the asynchronous operation, returning the response DTO.</returns>
    Task<CallSessionStartResponseDto> StartSessionAsync(int participantUserId, CallSessionStartRequestDto request, CancellationToken cancellationToken = default);

    /// <summary>
    /// Stops a call session for the given participant and request details.
    /// </summary>
    /// <param name="participantUserId">The ID of the participant.</param>
    /// <param name="request">The request details for stopping the call session.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>A task representing the asynchronous operation.</returns>
    Task StopSessionAsync(int participantUserId, CallSessionStopRequestDto request, CancellationToken cancellationToken = default);
}

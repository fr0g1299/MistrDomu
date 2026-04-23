using AspNetReactTemplate.Server.Models.DTOs.Calls;

namespace AspNetReactTemplate.Server.Services.Abstraction.Calls;

public interface ICallSessionLogService
{
    Task<CallSessionStartResponseDto> StartSessionAsync(int participantUserId, CallSessionStartRequestDto request, CancellationToken cancellationToken = default);
    Task StopSessionAsync(int participantUserId, CallSessionStopRequestDto request, CancellationToken cancellationToken = default);
}

using AspNetReactTemplate.Server.Data;
using AspNetReactTemplate.Server.Models.Calls;
using AspNetReactTemplate.Server.Models.DTOs.Calls;
using AspNetReactTemplate.Server.Services.Abstraction.Calls;

namespace AspNetReactTemplate.Server.Services.Implementation.Calls;

public class CallSessionLogService : ICallSessionLogService
{
    private readonly AppDbContext _dbContext;
    private readonly ICallPresenceService _callPresenceService;

    public CallSessionLogService(AppDbContext dbContext, ICallPresenceService callPresenceService)
    {
        _dbContext = dbContext;
        _callPresenceService = callPresenceService;
    }

    public async Task<CallSessionStartResponseDto> StartSessionAsync(
        int participantUserId,
        CallSessionStartRequestDto request,
        CancellationToken cancellationToken = default)
    {
        var sessionToken = _callPresenceService.StartCallSession(participantUserId, request.ManualId, request.CounterpartyUserId);
        var expiresAtUtc = DateTimeOffset.UtcNow.AddMinutes(30);

        return await Task.FromResult(new CallSessionStartResponseDto
        {
            SessionToken = sessionToken,
            ExpiresAtUtc = expiresAtUtc
        });
    }

    public async Task StopSessionAsync(
        int participantUserId,
        CallSessionStopRequestDto request,
        CancellationToken cancellationToken = default)
    {
        if (!_callPresenceService.TryGetCallSessionDetails(
            participantUserId,
            request.SessionToken,
            out var callStartedAtUtc,
            out var callManualId,
            out var callCounterpartyUserId))
        {
            return;
        }

        var sessionStopped = _callPresenceService.StopCallSession(participantUserId, request.SessionToken);
        if (!sessionStopped)
        {
            return;
        }

        if (!callStartedAtUtc.HasValue)
        {
            return;
        }

        var durationSeconds = (int)(DateTimeOffset.UtcNow - callStartedAtUtc.Value).TotalSeconds;

        var callLog = new ManualCallLog
        {
            ManualId = callManualId,
            ParticipantUserId = participantUserId,
            CounterpartyUserId = callCounterpartyUserId,
            RoomName = request.RoomName,
            DurationSeconds = durationSeconds,
            LoggedAtUtc = DateTimeOffset.UtcNow
        };

        _dbContext.ManualCallLogs.Add(callLog);
        await _dbContext.SaveChangesAsync(cancellationToken);
    }
}


namespace AspNetReactTemplate.Server.Services.Abstraction.Calls;

public record PendingCallInvitation(
    string RoomUrl,
    string RoomName,
    int ManualId,
    string ManualTitle,
    int CallerUserId,
    string? CallerDisplayName,
    DateTimeOffset CreatedAtUtc
);

public interface ICallPresenceService
{
    /// <summary>
    /// Sets expert as waiting and returns session token.
    /// </summary>
    /// <param name="expertId"></param>
    /// <returns>Session token</returns>
    Guid StartWaiting(int expertId);

    /// <summary>
    /// Sets expert as not waiting if session token matches.
    /// </summary>
    /// <param name="expertId"></param>
    /// <param name="sessionToken"></param>
    /// <returns>True if waiting was stopped, false otherwise</returns>
    bool StopWaiting(int expertId, Guid sessionToken);

    /// <summary>
    /// Keep expert alive (reset timeout). Compares session tokens.
    /// </summary>
    /// <param name="expertId"></param>
    /// <param name="sessionToken"></param>
    /// <returns>True if heartbeat was accepted, false otherwise</returns>
    bool Heartbeat(int expertId, Guid sessionToken);

    void HeartbeatTouch(int expertId, Guid sessionToken);

    /// <summary>
    /// Get all expert IDs currently waiting
    /// </summary>
    IReadOnlySet<int> GetWaitingExpertIds();

    /// <summary>
    /// Returns true when expert is currently waiting and outputs waiting session details.
    /// </summary>
    /// <param name="expertId"></param>
    /// <param name="waitingSinceUtc"></param>
    /// <param name="sessionToken"></param>
    /// <returns>True if waiting session was found, false otherwise</returns>
    bool TryGetWaitingSession(
        int expertId,
        out DateTimeOffset waitingSinceUtc,
        out Guid sessionToken);

    /// <summary>
    /// Queue incoming call invitation for an expert
    /// </summary>
    /// <param name="expertId"></param>
    /// <param name="manualId"></param>
    /// <param name="invitation"></param>
    /// <returns>True if invitation was queued, false otherwise</returns>
    void QueueInvitation(int expertId, int manualId, PendingCallInvitation invitation);

    /// <summary>
    /// Try to get next pending invitation for expert
    /// </summary>
    /// <param name="expertId"></param>
    /// <param name="invitation"></param>
    /// <returns>True if invitation was found, false otherwise</returns>
    bool TryTakeInvitation(int expertId, out PendingCallInvitation? invitation);

    /// <summary>
    /// Start a new call session for expert and return session token
    /// </summary>
    /// <param name="expertId"></param>
    /// <param name="manualId">Manual ID for the call</param>
    /// <param name="counterpartyUserId">User ID of the counterparty</param>
    /// <returns>Session token for the call</returns>
    Guid StartCallSession(int expertId, int manualId, int counterpartyUserId);

    /// <summary>
    /// Stop a call session if session token matches
    /// </summary>
    /// <param name="expertId"></param>
    /// <param name="callSessionToken"></param>
    /// <returns>True if call session was stopped, false otherwise</returns>
    bool StopCallSession(int expertId, Guid callSessionToken);

    /// <summary>
    /// Check if call session is active and not expired
    /// </summary>
    /// <param name="expertId"></param>
    /// <param name="callSessionToken"></param>
    /// <param name="callStartedAtUtc">When the call session started</param>
    /// <returns>True if session is active and valid, false otherwise</returns>
    bool TryGetActiveCallSession(int expertId, Guid callSessionToken, out DateTimeOffset? callStartedAtUtc);

    /// <summary>
    /// Get active call session with full details (start time, manual ID, counterparty ID)
    /// </summary>
    /// <param name="expertId"></param>
    /// <param name="callSessionToken"></param>
    /// <param name="callStartedAtUtc">When the call session started</param>
    /// <param name="callManualId">Manual ID associated with the call</param>
    /// <param name="callCounterpartyUserId">User ID of the counterparty</param>
    /// <returns>True if session is active and valid, false otherwise</returns>
    bool TryGetCallSessionDetails(
        int expertId,
        Guid callSessionToken,
        out DateTimeOffset? callStartedAtUtc,
        out int callManualId,
        out int callCounterpartyUserId);
}

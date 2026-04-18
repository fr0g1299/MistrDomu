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
    /// Set expert as waiting/not waiting for all assigned manuals
    /// </summary>
    void SetWaiting(int expertId, bool isWaiting);
    
    /// <summary>
    /// Keep expert alive (reset timeout)
    /// </summary>
    void Heartbeat(int expertId);
    
    /// <summary>
    /// Get all expert IDs currently waiting
    /// </summary>
    IReadOnlySet<int> GetWaitingExpertIds();

    /// <summary>
    /// Returns true when expert is currently waiting and outputs when waiting started.
    /// </summary>
    bool TryGetWaitingSince(int expertId, out DateTimeOffset waitingSinceUtc);
    
    /// <summary>
    /// Queue incoming call invitation for an expert
    /// </summary>
    void QueueInvitation(int expertId, int manualId, PendingCallInvitation invitation);
    
    /// <summary>
    /// Try to get next pending invitation for expert
    /// </summary>
    bool TryTakeInvitation(int expertId, out PendingCallInvitation? invitation);
}

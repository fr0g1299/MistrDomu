using System.Collections.Concurrent;
using AspNetReactTemplate.Server.Services.Abstraction.Calls;

namespace AspNetReactTemplate.Server.Services.Implementation.Calls;

public class CallPresenceService : ICallPresenceService
{
    // frontend posílá heartbeat každých 10s = 50s rezerva kvůli případným výpadkům sítě/zpožděním kvůli throttlingu 
    private static readonly TimeSpan WaitingTtl = TimeSpan.FromSeconds(60);
    // Keep waiting session state longer than visibility TTL to survive transient heartbeat drops.
    private static readonly TimeSpan WaitingSessionRetentionTtl = TimeSpan.FromMinutes(5);
    private static readonly TimeSpan InvitationTtl = TimeSpan.FromMinutes(2);
    private static readonly TimeSpan HeartBeatTouchTtl = TimeSpan.FromSeconds(5);

    private class ExpertState
    {
        public Guid SessionToken { get; set; }
        public DateTimeOffset WaitingSinceUtc { get; set; }
        public DateTimeOffset LastHeartbeat { get; set; }
        public Queue<PendingCallInvitation> PendingInvitations { get; } = new();
    }

    private readonly ConcurrentDictionary<int, ExpertState> _waitingExperts = new();

    public Guid StartWaiting(int expertId)
    {
        var sessionToken = Guid.NewGuid();

        _waitingExperts.AddOrUpdate(
            expertId,
            new ExpertState
            {
                SessionToken = sessionToken,
                WaitingSinceUtc = DateTimeOffset.UtcNow,
                LastHeartbeat = DateTimeOffset.UtcNow,
            },
            (_, existing) =>
            {
                existing.SessionToken = sessionToken;
                existing.WaitingSinceUtc = DateTimeOffset.UtcNow;
                existing.LastHeartbeat = DateTimeOffset.UtcNow;
                return existing;
            });

        return sessionToken;
    }

    public bool StopWaiting(int expertId, Guid sessionToken)
    {
        if (_waitingExperts.TryGetValue(expertId, out var state) && state.SessionToken == sessionToken)
        {
            return _waitingExperts.TryRemove(expertId, out _);
        }

        return false;
    }

    public bool Heartbeat(int expertId, Guid sessionToken)
    {
        if (_waitingExperts.TryGetValue(expertId, out var state) && state.SessionToken == sessionToken)
        {
            state.LastHeartbeat = DateTimeOffset.UtcNow;
            return true;
        }

        return false;
    }

    public void HeartbeatTouch(int expertId, Guid sessionToken)
    {
        if (_waitingExperts.TryGetValue(expertId, out var state)
            && state.SessionToken == sessionToken
            && DateTimeOffset.UtcNow - state.LastHeartbeat >= HeartBeatTouchTtl)
        {
            state.LastHeartbeat = DateTimeOffset.UtcNow;
        }
    }

    public IReadOnlySet<int> GetWaitingExpertIds()
    {
        CleanupExpired();

        var now = DateTimeOffset.UtcNow;
        var waiting = new HashSet<int>();

        foreach (var (expertId, state) in _waitingExperts)
        {
            if (now - state.LastHeartbeat <= WaitingTtl)
            {
                waiting.Add(expertId);
            }
        }

        return waiting;
    }

    public bool TryGetWaitingSession(
        int expertId,
        out DateTimeOffset waitingSinceUtc,
        out Guid sessionToken)
    {
        CleanupExpired();

        if (_waitingExperts.TryGetValue(expertId, out var state)
            && DateTimeOffset.UtcNow - state.LastHeartbeat <= WaitingTtl)
        {
            waitingSinceUtc = state.WaitingSinceUtc;
            sessionToken = state.SessionToken;
            return true;
        }

        waitingSinceUtc = default;
        sessionToken = Guid.Empty;
        return false;
    }

    public void QueueInvitation(int expertId, int manualId, PendingCallInvitation invitation)
    {
        CleanupExpired();

        if (_waitingExperts.TryGetValue(expertId, out var state))
        {
            state.PendingInvitations.Enqueue(invitation);
        }
    }

    public bool TryTakeInvitation(int expertId, out PendingCallInvitation? invitation)
    {
        CleanupExpired();

        if (_waitingExperts.TryGetValue(expertId, out var state)
            && state.PendingInvitations.TryDequeue(out var found)
            && DateTimeOffset.UtcNow - found.CreatedAtUtc <= InvitationTtl)
        {
            invitation = found;
            return true;
        }

        invitation = null;
        return false;
    }

    private void CleanupExpired()
    {
        var now = DateTimeOffset.UtcNow;

        foreach (var (expertId, state) in _waitingExperts.ToList())
        {
            if (now - state.LastHeartbeat > WaitingSessionRetentionTtl)
            {
                _waitingExperts.TryRemove(expertId, out _);
            }
        }
    }
}

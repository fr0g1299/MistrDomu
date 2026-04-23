using System.Collections.Concurrent;
using AspNetReactTemplate.Server.Services.Abstraction.Calls;

namespace AspNetReactTemplate.Server.Services.Implementation.Calls;

public class CallPresenceService : ICallPresenceService
{
    // frontend posílá heartbeat každých 10s = 50s rezerva kvůli případným výpadkům sítě/zpožděním kvůli throttlingu 
    private static readonly TimeSpan WaitingTtl = TimeSpan.FromSeconds(60);
    // aktivní call session bude považována za platnou po dobu 30 minut od startu
    private static readonly TimeSpan CallSessionTtl = TimeSpan.FromMinutes(30);
    // po tuto dobu budeme uchovávat waiting session i bez heartbeatů, aby se mohl expert znovu přihlásit a navázat na stejnou session (např. po pádu prohlížeče nebo dočasném výpadku sítě)
    private static readonly TimeSpan WaitingSessionRetentionTtl = TimeSpan.FromMinutes(5);
    // po tuto dobu bude pozbánky ke callu platná
    private static readonly TimeSpan InvitationTtl = TimeSpan.FromMinutes(2);
    // 5s interval jako throttling pro aktualizaci heartbeatu
    private static readonly TimeSpan HeartBeatTouchTtl = TimeSpan.FromSeconds(5);

    private class ExpertState
    {
        public Guid WaitingSessionToken { get; set; }
        public Guid CallSessionToken { get; set; }
        public bool IsInCall { get; set; }
        public DateTimeOffset? CallStartedAtUtc { get; set; }
        public int CallManualId { get; set; }
        public int CallCounterpartyUserId { get; set; }
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
                WaitingSessionToken = sessionToken,
                WaitingSinceUtc = DateTimeOffset.UtcNow,
                LastHeartbeat = DateTimeOffset.UtcNow,
            },
            (_, existing) =>
            {
                existing.WaitingSessionToken = sessionToken;
                existing.WaitingSinceUtc = DateTimeOffset.UtcNow;
                existing.LastHeartbeat = DateTimeOffset.UtcNow;
                return existing;
            });

        return sessionToken;
    }

    public bool StopWaiting(int expertId, Guid sessionToken)
    {
        if (_waitingExperts.TryGetValue(expertId, out var state) && state.WaitingSessionToken == sessionToken)
        {
            return _waitingExperts.TryRemove(expertId, out _);
        }

        return false;
    }

    public bool Heartbeat(int expertId, Guid sessionToken)
    {
        if (_waitingExperts.TryGetValue(expertId, out var state) && state.WaitingSessionToken == sessionToken)
        {
            state.LastHeartbeat = DateTimeOffset.UtcNow;
            return true;
        }

        return false;
    }

    public void HeartbeatTouch(int expertId, Guid sessionToken)
    {
        if (_waitingExperts.TryGetValue(expertId, out var state)
            && state.WaitingSessionToken == sessionToken
            && DateTimeOffset.UtcNow - state.LastHeartbeat >= HeartBeatTouchTtl)
        {
            state.LastHeartbeat = DateTimeOffset.UtcNow;
        }
    }

    public IReadOnlySet<int> GetWaitingExpertIds()
    {
        CleanupExpiredWaiting();

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
        CleanupExpiredWaiting();

        if (_waitingExperts.TryGetValue(expertId, out var state)
            && DateTimeOffset.UtcNow - state.LastHeartbeat <= WaitingTtl)
        {
            waitingSinceUtc = state.WaitingSinceUtc;
            sessionToken = state.WaitingSessionToken;
            return true;
        }

        waitingSinceUtc = default;
        sessionToken = Guid.Empty;
        return false;
    }

    public void QueueInvitation(int expertId, int manualId, PendingCallInvitation invitation)
    {
        CleanupExpiredWaiting();

        if (_waitingExperts.TryGetValue(expertId, out var state))
        {
            state.PendingInvitations.Enqueue(invitation);
        }
    }

    public bool TryTakeInvitation(int expertId, out PendingCallInvitation? invitation)
    {
        CleanupExpiredWaiting();

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

    private void CleanupExpiredWaiting()
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

    public Guid StartCallSession(int expertId, int manualId, int counterpartyUserId)
    {
        CleanupExpiredCalls();

        var callSessionToken = Guid.NewGuid();

        _waitingExperts.AddOrUpdate(
            expertId,
            new ExpertState
            {
                CallSessionToken = callSessionToken,
                IsInCall = true,
                CallStartedAtUtc = DateTimeOffset.UtcNow,
                CallManualId = manualId,
                CallCounterpartyUserId = counterpartyUserId,
                WaitingSinceUtc = DateTimeOffset.UtcNow,
                LastHeartbeat = DateTimeOffset.UtcNow,
            },
            (_, existing) =>
            {
                existing.CallSessionToken = callSessionToken;
                existing.IsInCall = true;
                existing.CallStartedAtUtc = DateTimeOffset.UtcNow;
                existing.CallManualId = manualId;
                existing.CallCounterpartyUserId = counterpartyUserId;
                return existing;
            });

        return callSessionToken;
    }

    public bool StopCallSession(int expertId, Guid callSessionToken)
    {
        CleanupExpiredCalls();

        if (_waitingExperts.TryGetValue(expertId, out var state)
            && state.CallSessionToken == callSessionToken
            && state.IsInCall)
        {
            state.IsInCall = false;
            state.CallSessionToken = Guid.Empty;
            state.CallStartedAtUtc = null;
            return true;
        }

        return false;
    }

    public bool TryGetActiveCallSession(int expertId, Guid callSessionToken, out DateTimeOffset? callStartedAtUtc)
    {
        CleanupExpiredCalls();

        if (_waitingExperts.TryGetValue(expertId, out var state)
            && state.CallSessionToken == callSessionToken
            && state.IsInCall
            && state.CallStartedAtUtc.HasValue
            && DateTimeOffset.UtcNow - state.CallStartedAtUtc.Value <= CallSessionTtl)
        {
            callStartedAtUtc = state.CallStartedAtUtc;
            return true;
        }

        callStartedAtUtc = null;
        return false;
    }

    public bool TryGetCallSessionDetails(
        int expertId,
        Guid callSessionToken,
        out DateTimeOffset? callStartedAtUtc,
        out int callManualId,
        out int callCounterpartyUserId)
    {
        CleanupExpiredCalls();

        if (_waitingExperts.TryGetValue(expertId, out var state)
            && state.CallSessionToken == callSessionToken
            && state.IsInCall
            && state.CallStartedAtUtc.HasValue
            && DateTimeOffset.UtcNow - state.CallStartedAtUtc.Value <= CallSessionTtl)
        {
            callStartedAtUtc = state.CallStartedAtUtc;
            callManualId = state.CallManualId;
            callCounterpartyUserId = state.CallCounterpartyUserId;
            return true;
        }

        callStartedAtUtc = null;
        callManualId = 0;
        callCounterpartyUserId = 0;
        return false;
    }

    private void CleanupExpiredCalls()
    {
        var now = DateTimeOffset.UtcNow;

        foreach (var (expertId, state) in _waitingExperts.ToList())
        {
            if (state.IsInCall && state.CallStartedAtUtc.HasValue && now - state.CallStartedAtUtc.Value > CallSessionTtl)
            {
                state.IsInCall = false;
                state.CallSessionToken = Guid.Empty;
                state.CallStartedAtUtc = null;
            }
        }
    }
}

using System.Collections.Concurrent;
using AspNetReactTemplate.Server.Services.Abstraction.Calls;

namespace AspNetReactTemplate.Server.Services.Implementation.Calls;

public class CallPresenceService : ICallPresenceService
{
    private static readonly TimeSpan WaitingTtl = TimeSpan.FromSeconds(25);
    private static readonly TimeSpan InvitationTtl = TimeSpan.FromMinutes(2);

    private class ExpertState
    {
        public DateTimeOffset WaitingSinceUtc { get; set; }
        public DateTimeOffset LastHeartbeat { get; set; }
        public Queue<PendingCallInvitation> PendingInvitations { get; } = new();
    }

    private readonly ConcurrentDictionary<int, ExpertState> _waitingExperts = new();

    public void SetWaiting(int expertId, bool isWaiting)
    {
        if (isWaiting)
        {
            _waitingExperts.AddOrUpdate(
                expertId,
                new ExpertState
                {
                    WaitingSinceUtc = DateTimeOffset.UtcNow,
                    LastHeartbeat = DateTimeOffset.UtcNow,
                },
                (_, existing) =>
                {
                    existing.LastHeartbeat = DateTimeOffset.UtcNow;
                    return existing;
                });
            return;
        }

        _waitingExperts.TryRemove(expertId, out _);
    }

    public void Heartbeat(int expertId)
    {
        if (_waitingExperts.TryGetValue(expertId, out var state))
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

    public bool TryGetWaitingSince(int expertId, out DateTimeOffset waitingSinceUtc)
    {
        CleanupExpired();

        if (_waitingExperts.TryGetValue(expertId, out var state)
            && DateTimeOffset.UtcNow - state.LastHeartbeat <= WaitingTtl)
        {
            waitingSinceUtc = state.WaitingSinceUtc;
            return true;
        }

        waitingSinceUtc = default;
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
            if (now - state.LastHeartbeat > WaitingTtl)
            {
                _waitingExperts.TryRemove(expertId, out _);
            }
        }
    }
}

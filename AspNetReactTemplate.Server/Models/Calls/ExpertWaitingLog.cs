using AspNetReactTemplate.Server.Models.Identity;

namespace AspNetReactTemplate.Server.Models.Calls;

public class ExpertWaitingLog
{
    public int Id { get; set; }
    public int ExpertUserId { get; set; }
    public DateTimeOffset StartedAtUtc { get; set; }
    public DateTimeOffset? EndedAtUtc { get; set; }
    public int DurationSeconds { get; set; }

    public User? ExpertUser { get; set; }
}

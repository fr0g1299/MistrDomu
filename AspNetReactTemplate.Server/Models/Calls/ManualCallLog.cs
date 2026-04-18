using AspNetReactTemplate.Server.Models.Identity;

namespace AspNetReactTemplate.Server.Models.Calls;

public class ManualCallLog
{
    public int Id { get; set; }
    public int ManualId { get; set; }
    public int ParticipantUserId { get; set; }
    public int CounterpartyUserId { get; set; }
    public string RoomName { get; set; } = string.Empty;
    public int DurationSeconds { get; set; }
    public DateTimeOffset LoggedAtUtc { get; set; }

    public User? ParticipantUser { get; set; }
    public User? CounterpartyUser { get; set; }
}

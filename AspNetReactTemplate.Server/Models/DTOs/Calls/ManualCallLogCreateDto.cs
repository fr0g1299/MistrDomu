namespace AspNetReactTemplate.Server.Models.DTOs.Calls;

public class ManualCallLogCreateDto
{
    public int ManualId { get; set; }
    public int CounterpartyUserId { get; set; }
    public string RoomName { get; set; } = string.Empty;
    public int DurationSeconds { get; set; }
}

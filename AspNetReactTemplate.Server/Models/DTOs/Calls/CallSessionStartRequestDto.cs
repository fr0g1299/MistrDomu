namespace AspNetReactTemplate.Server.Models.DTOs.Calls;

public class CallSessionStartRequestDto
{
    public int ManualId { get; set; }
    public int CounterpartyUserId { get; set; }
    public string RoomName { get; set; } = string.Empty;
}

namespace AspNetReactTemplate.Server.Models.DTOs.Calls;

public class CallSessionStopRequestDto
{
    public Guid SessionToken { get; set; }
    public string RoomName { get; set; } = string.Empty;
}

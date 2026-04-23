namespace AspNetReactTemplate.Server.Models.DTOs.Calls;

public class CallSessionStartResponseDto
{
    public Guid SessionToken { get; set; }
    public DateTimeOffset ExpiresAtUtc { get; set; }
}

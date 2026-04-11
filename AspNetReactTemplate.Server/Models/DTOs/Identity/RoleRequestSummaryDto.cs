namespace AspNetReactTemplate.Server.Models.DTOs.Identity;

public class RoleRequestSummaryDto
{
    public int Id { get; set; }
    public string RequestedRole { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime RequestedAtUtc { get; set; }
    public DateTime? ReviewedAtUtc { get; set; }
    public string? UserNote { get; set; }
    public string? AdminNote { get; set; }
}


namespace AspNetReactTemplate.Server.Models.DTOs.Identity;

public class RoleRequestUserListItemDto
{
    public int Id { get; set; }
    public string RequestType { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime RequestedAtUtc { get; set; }
    public DateTime? ReviewedAtUtc { get; set; }
}


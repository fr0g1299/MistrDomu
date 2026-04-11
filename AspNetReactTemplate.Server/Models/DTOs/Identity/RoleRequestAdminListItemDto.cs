namespace AspNetReactTemplate.Server.Models.DTOs.Identity;

public class RoleRequestAdminListItemDto
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? UserNote { get; set; }
    public DateTime RequestedAtUtc { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime? ReviewedAtUtc { get; set; }
    public string? AdminNote { get; set; }
}

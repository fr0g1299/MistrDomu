namespace AspNetReactTemplate.Server.Models.DTOs.Identity;

public class UserListDto
{
    public int Id { get; set; }
    public string? Username { get; set; }
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string Roles { get; set; } = string.Empty;
    public int TotalCallDurationSeconds { get; set; }
    public int TotalWaitingDurationSeconds { get; set; }
}

using System.ComponentModel.DataAnnotations;
using AspNetReactTemplate.Server.Models.Entity;
using AspNetReactTemplate.Server.Models.Identity.Enums;

namespace AspNetReactTemplate.Server.Models.Identity;

public class RoleRequest : Entity<int>
{
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    
    [Required]
    [MaxLength(50)]
    public required string RequestedRole { get; set; } = Roles.Expert.ToString();
    public RoleRequestStatus Status { get; set; } = RoleRequestStatus.Pending;
    
    public DateTime RequestedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? ReviewedAtUtc { get; set; }

    [MaxLength(500)]
    public string? UserNote { get; set; }

    public int? ReviewedByUserId { get; set; }
    public User? ReviewedByUser { get; set; }

    [MaxLength(500)]
    public string? AdminNote { get; set; }
}

using System.ComponentModel.DataAnnotations;
using AspNetReactTemplate.Server.Models.Entity;

namespace AspNetReactTemplate.Server.Models.Identity;

public class Notification : Entity<int>
{
    public int UserId { get; set; }
    public User User { get; set; } = null!;

    [Required]
    [MaxLength(100)]
    public string Type { get; set; } = string.Empty;

    [Required]
    [MaxLength(120)]
    public string Title { get; set; } = string.Empty;

    [Required]
    [MaxLength(500)]
    public string Message { get; set; } = string.Empty;

    public bool IsRead { get; set; }
}


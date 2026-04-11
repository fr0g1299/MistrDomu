using System.ComponentModel.DataAnnotations;

namespace AspNetReactTemplate.Server.Models.DTOs.Identity;

public class CreateRoleRequestDto
{
    [Required]
    [MaxLength(50)]
    public string RequestType { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }
}


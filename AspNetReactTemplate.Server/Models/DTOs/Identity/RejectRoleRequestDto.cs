using System.ComponentModel.DataAnnotations;

namespace AspNetReactTemplate.Server.Models.DTOs.Identity;

public class RejectRoleRequestDto
{
    [MaxLength(500)]
    public string? Note { get; set; }
}

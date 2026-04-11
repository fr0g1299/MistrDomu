using System.ComponentModel.DataAnnotations;

namespace AspNetReactTemplate.Server.Models.DTOs.Identity;

public class UpdateRoleRequestNoteDto
{
    [MaxLength(100)]
    public string? Note { get; set; }
}


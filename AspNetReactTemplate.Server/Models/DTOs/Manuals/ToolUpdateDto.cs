using System.ComponentModel.DataAnnotations;

namespace AspNetReactTemplate.Server.Models.DTOs.Manuals;

public class ToolUpdateDto
{
    [Required]
    [StringLength(50, ErrorMessage = "Název nástroje nesmí být delší než 50 znaků.")]
    [MinLength(3, ErrorMessage = "Název nástroje musí být alespoň 3 znaky.")]
    public string Name { get; set; } = null!;
    [StringLength(500, ErrorMessage = "URL nesmí být delší než 500 znaků.")]
    public string? Url { get; set; }
}
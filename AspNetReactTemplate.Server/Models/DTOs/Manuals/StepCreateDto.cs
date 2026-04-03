using System.ComponentModel.DataAnnotations;

namespace AspNetReactTemplate.Server.Models.DTOs.Manuals;

public class StepCreateDto
{
    [Required]
    [StringLength(50, ErrorMessage = "Nazev kroku nesmi byt delsi nez 50 znaku.")]
    [MinLength(5, ErrorMessage = "Nazev kroku musi byt alespon 5 znaku.")]
    public string Title { get; set; } = null!;

    [Required]
    [StringLength(500, ErrorMessage = "Obsah kroku nesmi byt delsi nez 500 znaku.")]
    [MinLength(10, ErrorMessage = "Obsah kroku musi byt alespon 10 znaku.")]
    public string Content { get; set; } = null!;

    [Required]
    public int OrderNumber { get; set; }

    [StringLength(500, ErrorMessage = "URL nesmi byt delsi nez 500 znaku.")]
    public string? ImageUrl { get; set; }
}

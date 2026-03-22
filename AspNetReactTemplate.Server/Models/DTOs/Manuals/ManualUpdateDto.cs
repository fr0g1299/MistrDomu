using System.ComponentModel.DataAnnotations;
using AspNetReactTemplate.Server.Models.Manuals.Enums;

namespace AspNetReactTemplate.Server.Models.DTOs.Manuals;

public class ManualUpdateDto
{
    [Required]
    [StringLength(100)]
    public string Title { get; set; } = null!;

    [StringLength(500, ErrorMessage = "URL nesmi byt delsi nez 500 znaku.")]
    public string? ImageUrl { get; set; }

    [Required]
    [StringLength(10000, ErrorMessage = "Popis nesmi byt delsi nez 10000 znaku.")]
    public string Description { get; set; } = null!;

    [Required]
    [MinLength(1, ErrorMessage = "Musi byt alespon jeden krok.")]
    public List<StepCreateDto> Steps { get; set; } = [];

    public Difficulty Difficulty { get; set; }

    public int EstimatedTimeMinutes { get; set; }

    [StringLength(1000, ErrorMessage = "Nastroje nesmi byt delsi nez 1000 znaku.")]
    public string RequiredTools { get; set; } = null!;
}
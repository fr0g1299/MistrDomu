using AspNetReactTemplate.Server.Models.Manuals.Enums;

namespace AspNetReactTemplate.Server.Models.DTOs.Manuals;

public class ManualReadDto
{
    public int Id { get; set; }
    public string Title { get; set; } = null!;
    public string? ImageUrl { get; set; }
    public string Description { get; set; } = null!;
    public Difficulty Difficulty { get; set; }
    public int EstimatedTimeMinutes { get; set; }
    public string RequiredTools { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
}
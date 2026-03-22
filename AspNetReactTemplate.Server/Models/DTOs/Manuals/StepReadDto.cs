namespace AspNetReactTemplate.Server.Models.DTOs.Manuals;

public class StepReadDto
{
    public int Id { get; set; }
    public string Title { get; set; } = null!;
    public string Content { get; set; } = null!;
    public string? ImageUrl { get; set; }
    public int ManualId { get; set; }
}

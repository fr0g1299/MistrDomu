namespace AspNetReactTemplate.Server.Models.DTOs.Manuals;

public class ToolReadDto
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public string? Url { get; set; }
    public string? Note { get; set; }
    public List<string> Manuals { get; set; } = new();
}
namespace AspNetReactTemplate.Server.Models.DTOs.Manuals;

public class ExpertManualHelpReadDto
{
    public int ManualId { get; set; }
    public string ManualTitle { get; set; } = null!;
    public int ExpertId { get; set; }
    public string ExpertName { get; set; } = null!;
}
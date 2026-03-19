using System.ComponentModel.DataAnnotations;

namespace AspNetReactTemplate.Server.Models;

public enum Difficulty
{
    Easy,
    Medium,
    Hard
}

public class Manual
{
    [Key]
    public int Id { get; set; }

    [Required]
    [StringLength(100)]
    public string Title { get; set; } = string.Empty;

    public string? ImageUrl { get; set; }

    [Required]
    public string Description { get; set; } = string.Empty;

    public Difficulty Difficulty { get; set; }

    public int EstimatedTimeMinutes { get; set; }

    // Pro jednoduchost teď jako jeden řetězec, později může být List<Tool>
    public string RequiredTools { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
using System.ComponentModel.DataAnnotations;

namespace AspNetReactTemplate.Server.Models
{

    public enum Difficulty
    {
        Easy,
        Medium,
        Hard
    }

    public class Manual : Entity<int>
    {

        [Required]
        [StringLength(100)] 
        public string Title { get; set; } = string.Empty;

        [StringLength(500, ErrorMessage = "URL nesmí být delší než 500 znaků.")]
        public string? ImageUrl { get; set; }

        [Required]
        [StringLength(10000, ErrorMessage = "Popis nesmí být delší než 10000 znaků.")]
        public string Description { get; set; } = string.Empty;

        public Difficulty Difficulty { get; set; }

        public int EstimatedTimeMinutes { get; set; }

        // Pro jednoduchost teď jako jeden řetězec, později může být List<Tool>
        [StringLength(1000, ErrorMessage = "Nástroje nesmí být delší než 1000 znaků.")]
        public string RequiredTools { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
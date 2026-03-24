using System.ComponentModel.DataAnnotations;
using AspNetReactTemplate.Server.Models.Manuals.Enums;

namespace AspNetReactTemplate.Server.Models.Manuals
{
    public class Manual : Entity<int>
    {
        [Required]
        [StringLength(100, ErrorMessage = "Název nesmí být delší než 100 znaků.")]
        public string Title { get; set; } = string.Empty;

        [StringLength(500, ErrorMessage = "URL nesmí být delší než 500 znaků.")]
        public string? ImageUrl { get; set; }

        [Required]
        [StringLength(10000, ErrorMessage = "Popis nesmí být delší než 10000 znaků.")]
        public string Description { get; set; } = string.Empty;

        [Required]
        [MinLength(1, ErrorMessage = "Musí být alespoň jeden krok.")]
        public virtual ICollection<Step> Steps { get; set; } = new List<Step>();

        [Required]
        [MinLength(1, ErrorMessage = "Musí být alespoň jeden tag.")]
        public List<string> Tags { get; set; } = new List<string>();

        public Difficulty Difficulty { get; set; }

        public int EstimatedTimeMinutes { get; set; }

        // Pro jednoduchost teď jako jeden řetězec, později může být List<Tool>
        [StringLength(1000, ErrorMessage = "Nástroje nesmí být delší než 1000 znaků.")]
        public string RequiredTools { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
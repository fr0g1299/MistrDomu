using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AspNetReactTemplate.Server.Models.Manuals
{
    public class Step : Entity<int>
    {
        [Required]
        [StringLength(50, ErrorMessage = "Název kroku nesmí být delší než 50 znaků.")]
        [MinLength(5, ErrorMessage = "Název kroku musí být alespoň 5 znaků.")]
        public string Title { get; set; } = string.Empty;

        [Required]
        [StringLength(500, ErrorMessage = "Obsah kroku nesmí být delší než 500 znaků.")]
        [MinLength(10, ErrorMessage = "Obsah kroku musí být alespoň 10 znaků.")]
        public string Content { get; set; } = string.Empty;

        [StringLength(500, ErrorMessage = "URL nesmí být delší než 500 znaků.")]
        public string? ImageUrl { get; set; }

        public int ManualId { get; set; }

        [ForeignKey(nameof(ManualId))]
        public virtual Manual? Manual { get; set; }

        public Step(string title, string content, int manualId, string? imageUrl = null)
        {
            Title = title;
            Content = content;
            ManualId = manualId;
            ImageUrl = imageUrl;
        }

        protected Step() { }
    }
}
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using AspNetReactTemplate.Server.Models.Identity;
using AspNetReactTemplate.Server.Models.Manuals;

namespace AspNetReactTemplate.Server.Models
{
    public class AiChatInteraction
    {
        [Key]
        public int Id { get; set; }

        public int UserId { get; set; }

        [ForeignKey("UserId")]
        public virtual User? User { get; set; }

        public int ManualId { get; set; }

        [ForeignKey("ManualId")]
        public virtual Manual? Manual { get; set; }

        public required string UserMessage { get; set; }

        public required string AiResponse { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}

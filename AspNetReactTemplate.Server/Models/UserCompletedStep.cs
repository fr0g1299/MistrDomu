using System.ComponentModel.DataAnnotations.Schema;
using AspNetReactTemplate.Server.Models.Identity;
using AspNetReactTemplate.Server.Models.Manuals;

namespace AspNetReactTemplate.Server.Models
{
    public class UserCompletedStep
    {
        public int UserId { get; set; }
        [ForeignKey("UserId")]
        public virtual User? User { get; set; }

        public int StepId { get; set; }
        [ForeignKey("StepId")]
        public virtual Step? Step { get; set; }

        /// <summary>Denormalised for fast per-manual queries without joining Steps.</summary>
        public int ManualId { get; set; }
        [ForeignKey("ManualId")]
        public virtual Manual? Manual { get; set; }

        public DateTime CompletedAt { get; set; } = DateTime.UtcNow;
    }
}

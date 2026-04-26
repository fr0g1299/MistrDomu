using System.ComponentModel.DataAnnotations;

namespace AspNetReactTemplate.Server.Models.Entity
{
    public class WaitlistEmail : Entity<int>
    {
        [Required]
        [EmailAddress]
        [StringLength(50, ErrorMessage = "Email nesmí být delší než 50 znaků.")]
        public string Email { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}

using System.ComponentModel.DataAnnotations;

namespace AspNetReactTemplate.Server.Models
{
    public class WaitlistEmail
    {
        public int Id { get; set; }

        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}

using System.ComponentModel.DataAnnotations;

namespace AspNetReactTemplate.Server.Models.DTOs.Identity
{
    public class LoginDto
    {
        [Required(ErrorMessage = "Emial není zadán.")]
        [EmailAddress(ErrorMessage = "Neplatný formát emailu.")]
        public string? Email { get; set; }

        [Required(ErrorMessage = "Heslo není zadáno.")]
        public string? Password { get; set; }
    }
}


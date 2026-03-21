using System.ComponentModel.DataAnnotations;

namespace AspNetReactTemplate.Server.Models.DTOs.Identity
{
    public class UserRegisterDto
    {
        [Required(ErrorMessage = "Křestní jméno je povinné")]
        [Display(Name="Jméno:")]
        public string? FirstName { get; set; }

        [Required(ErrorMessage = "Příjmení je povinné")]
        [Display(Name="Příjmení:")]
        public string? LastName { get; set; }

        [EmailAddress(ErrorMessage = "Neplatná emailová adresa")] 
        [Required(ErrorMessage = "Email je povinný")]
        [Display(Name="Email:")]
        public string? Email { get; set; }

        [Required(ErrorMessage = "Heslo je povinné")]
        [Display(Name="Heslo:")]
        public string? Password { get; set; }

        [Required(ErrorMessage = "Potvrzení hesla je povinné")]
        [Compare(nameof(Password), ErrorMessage = "Hesla se neshodují")]
        public string? ConfirmPassword { get; set; }
        
    }
}


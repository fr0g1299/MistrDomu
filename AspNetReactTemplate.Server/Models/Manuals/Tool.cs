using System.ComponentModel.DataAnnotations;

namespace AspNetReactTemplate.Server.Models.Manuals
{
    public class Tool : Entity<int>
    {
        [Required]
        [StringLength(50, ErrorMessage = "Název nástroje nesmí být delší než 50 znaků.")]
        [MinLength(3, ErrorMessage = "Název nástroje musí být alespoň 3 znaky.")]
        public string Name { get; set; } = string.Empty;

        [StringLength(500, ErrorMessage = "URL nesmí být delší než 500 znaků.")]
        public string? Url { get; set; }

        public virtual ICollection<Manual> Manuals { get; set; } = new List<Manual>();

        public Tool(string name, string? url = null)
        {
            Name = name;
            Url = url;
        }

        public Tool() { }
    }
}
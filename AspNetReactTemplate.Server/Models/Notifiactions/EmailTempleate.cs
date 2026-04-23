using System.ComponentModel.DataAnnotations;

namespace AspNetReactTemplate.Server.Models.Notifiactions;

public class EmailTemplate : Entity<int>
{
    [Key]
    [MaxLength(100)]
    public string Key { get; set; } = string.Empty;

    [Required]
    [MaxLength(120)]
    public string Subject { get; set; } = string.Empty;

    [Required]
    [MaxLength(4000)]
    public string Body { get; set; } = string.Empty;

}
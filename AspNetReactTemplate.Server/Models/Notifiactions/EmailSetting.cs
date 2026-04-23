using System.ComponentModel.DataAnnotations;

namespace AspNetReactTemplate.Server.Models.Notifiactions;

public class EmailSetting : Entity<int>
{
    
    [Required]
    [MaxLength(100)]
    public string SmtpServer { get; set; } = string.Empty;
    
    [Required]
    public int SmtpPort { get; set; }
    
    [Required]
    [MaxLength(100)]
    public string SmtpUser { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(100)]
    public string SmtpFrom { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(100)]
    public string SmtpPassword { get; set; } = string.Empty;
    
    [Required]
    public bool SmtpUseSsl { get; set; } = true;
}
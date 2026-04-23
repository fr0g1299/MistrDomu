namespace AspNetReactTemplate.Server.Models.DTOs.Notifications;

public class EmailMessage
{
    public IList<string> To { get; set; } = new List<string>();
    public string Subject { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
}

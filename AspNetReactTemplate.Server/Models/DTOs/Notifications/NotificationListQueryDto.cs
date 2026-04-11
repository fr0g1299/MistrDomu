namespace AspNetReactTemplate.Server.Models.DTOs.Notifications;

public class NotificationListQueryDto
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public bool UnreadOnly { get; set; }
}


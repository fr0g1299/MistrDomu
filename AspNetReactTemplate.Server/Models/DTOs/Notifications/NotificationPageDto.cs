namespace AspNetReactTemplate.Server.Models.DTOs.Notifications;

public class NotificationPageDto
{
    public List<NotificationListItemDto> Items { get; set; } = new();
    public int CurrentPage { get; set; }
    public int PageSize { get; set; }
    public int TotalItems { get; set; }
    public int TotalPages { get; set; }
    public int UnreadCount { get; set; }
}


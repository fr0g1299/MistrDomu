using AspNetReactTemplate.Server.Models.DTOs.Notifications;
using AspNetReactTemplate.Server.Models.DTOs.System;

namespace AspNetReactTemplate.Server.Services.Abstraction.Notifications;

public interface INotificationService
{
    Task<ServiceResultDto<NotificationPageDto>> GetMyNotificationsAsync(NotificationListQueryDto queryDto);
    Task<ServiceResultDto> MarkAsReadAsync(int notificationId);
    Task<ServiceResultDto> MarkAllAsReadAsync();
    Task<ServiceResultDto> DeleteMyNotificationAsync(int notificationId);
    Task CreateForUserAsync(int userId, string type, string title, string message);
    Task CreateForUsersAsync(IEnumerable<int> userIds, string type, string title, string message);
}


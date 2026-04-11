using AspNetReactTemplate.Server.Extensions.Controller;
using AspNetReactTemplate.Server.Models.DTOs.Notifications;
using AspNetReactTemplate.Server.Services.Abstraction.Notifications;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AspNetReactTemplate.Server.Controllers.Identity;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class NotificationController : ControllerBase
{
    private readonly INotificationService _notificationService;

    public NotificationController(INotificationService notificationService)
    {
        _notificationService = notificationService;
    }

    [HttpGet("my")]
    public async Task<IActionResult> GetMyNotifications([FromQuery] NotificationListQueryDto query)
    {
        var result = await _notificationService.GetMyNotificationsAsync(query);
        return this.ToActionResult(result);
    }

    [HttpPut("{notificationId:int}/read")]
    public async Task<IActionResult> MarkAsRead([FromRoute] int notificationId)
    {
        var result = await _notificationService.MarkAsReadAsync(notificationId);
        return this.ToActionResult(result);
    }

    [HttpPost("my/read-all")]
    public async Task<IActionResult> MarkAllAsRead()
    {
        var result = await _notificationService.MarkAllAsReadAsync();
        return this.ToActionResult(result);
    }

    [HttpDelete("{notificationId:int}")]
    public async Task<IActionResult> DeleteMyNotification([FromRoute] int notificationId)
    {
        var result = await _notificationService.DeleteMyNotificationAsync(notificationId);
        return this.ToActionResult(result);
    }
}


using AspNetReactTemplate.Server.Models.Identity.Enums;

namespace AspNetReactTemplate.Server.Services.Abstraction.Notifications;

public interface IEmailNotificationService
{
    Task SendNewRoleRequestToAdminsAsync(
        string requesterDisplayName,
        string? requesterEmail,
        string? userNote,
        int pendingCount);

    Task SendRoleRequestUpdatedToUserAsync(
        int userId,
        RoleRequestStatus status,
        string? adminNote);
}




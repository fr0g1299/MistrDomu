using AspNetReactTemplate.Server.Models.Identity.Enums;

namespace AspNetReactTemplate.Server.Services.Abstraction.Notifications;

public interface IRoleRequestNotificationTexts
{

   Task<string> RenderNewRequestBody(
        string templateBody,
        string? requesterDisplayName,
        string? requesterEmail,
        string? userNote,
        int pendingCount);

   Task<string> RenderUserUpdatedBody(
        string templateBody,
        string? displayName,
        RoleRequestStatus status,
        string? adminNote);
   Task<string> BuildUserUpdatedMessage(
        RoleRequestStatus status);
}
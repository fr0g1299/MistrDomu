using AspNetReactTemplate.Server.Models.Identity.Enums;

namespace AspNetReactTemplate.Server.Services.Abstraction.Notifications;

public interface IRoleRequestNotificationTextsService
{

   string RenderNewRequestBody(
        string templateBody,
        string? requesterDisplayName,
        string? requesterEmail,
        string? userNote,
        int pendingCount);

   string RenderUserUpdatedBody(
        string templateBody,
        RoleRequestStatus status,
        string? adminNote);
   
   string BuildUserUpdatedMessage(
       RoleRequestStatus status);

   string BuildNewRequestMessage(
       string displayName);

}
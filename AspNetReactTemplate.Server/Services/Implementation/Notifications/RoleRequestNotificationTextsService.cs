using System.Net;
using AspNetReactTemplate.Server.Models.Identity.Enums;
using AspNetReactTemplate.Server.Services.Abstraction.Notifications;

namespace AspNetReactTemplate.Server.Services.Implementation.Notifications;

public class RoleRequestNotificationTextsService : IRoleRequestNotificationTextsService
{
    private readonly IConfiguration _configuration;

    public RoleRequestNotificationTextsService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    private string GetStatusCzech(RoleRequestStatus status)
    {
        return status switch
        {
            RoleRequestStatus.Pending => "Čeká na zpracování",
            RoleRequestStatus.Approved => "Schválena",
            RoleRequestStatus.Rejected => "Zamítnuta",
            _ => status.ToString()
        };
    }

    public string  BuildUserUpdatedMessage(RoleRequestStatus status)
    {
        return status switch
        {
            RoleRequestStatus.Approved => "Tvoje žádost o roli Expert byla schválena.",
            RoleRequestStatus.Rejected => "Tvoje žádost o roli Expert byla zamítnuta.",
            _ => "Admin upravil tvoji žádost o roli Expert."
        };
    }

    public string BuildNewRequestMessage(string displayName)
    {
        return $"{displayName} podal(a) novou žádost o roli Expert.";
    }

    public string RenderNewRequestBody(string templateBody, string? requesterDisplayName, string? requesterEmail, string? userNote, int pendingCount)
    {
        var noteSection = string.IsNullOrWhiteSpace(userNote)
            ? string.Empty
            : $"<p><strong>Poznámka:</strong> {WebUtility.HtmlEncode(userNote)}</p>";
        
            var adminUrl = _configuration["Url:PublicBaseUrl"] + _configuration["Url:RequestAdministration"];


            return templateBody
                .Replace("{DisplayName}",
                    WebUtility.HtmlEncode(string.IsNullOrWhiteSpace(requesterDisplayName)
                        ? "Neznámý uživatel"
                        : requesterDisplayName))
                .Replace("{Email}", WebUtility.HtmlEncode(requesterEmail ?? "Neznámý uživatel"))
                .Replace("{RequesterEmail}", WebUtility.HtmlEncode(requesterEmail ?? "Neznámý uživatel"))
                .Replace("{UserNote}",
                    string.IsNullOrWhiteSpace(userNote) ? "Žádná poznámka" : WebUtility.HtmlEncode(userNote))
                .Replace("{PendingCount}", pendingCount.ToString())
                .Replace("{NoteSection}", noteSection)
                .Replace("{AdminUrl}", adminUrl);   

    }

    public string RenderUserUpdatedBody(string templateBody, RoleRequestStatus status, string? adminNote)
    {
        var statusCz = GetStatusCzech(status);
        var adminNoteSection = string.IsNullOrWhiteSpace(adminNote)
            ? string.Empty
            : $"<p><strong>Poznámka administrátora:</strong> {WebUtility.HtmlEncode(adminNote)}</p>";
            
            return templateBody
            .Replace("{Status}", statusCz)
            .Replace("{AdminNote}", string.IsNullOrWhiteSpace(adminNote) ? string.Empty : WebUtility.HtmlEncode(adminNote))
            .Replace("{AdminNoteSection}", adminNoteSection);
    }
}


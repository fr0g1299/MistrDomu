using System.Net;
using System.Text;
using AspNetReactTemplate.Server.Models.Identity.Enums;
using AspNetReactTemplate.Server.Services.Abstraction.Notifications;
using Microsoft.AspNetCore.Http.HttpResults;

namespace AspNetReactTemplate.Server.Extensions.Notification;

public class RoleRequestNotificationTexts : IRoleRequestNotificationTexts
{
    public const string RoleRequestUser = "role_request";
    public const string RoleRequestAdmin = "role_request_admin";
    public const string UserUpdatedTitle = "Aktualizace žádosti o roli Expert";
    public const string NewRequestTitle = "Nová žádost o roli Expert";
    public const string NewRequestSubject = "Nová žádost o roli Expert";
    public const string UpdatedUserSubject = "Změna stavu žádosti o roli";
    private readonly IConfiguration _configuration;

    public RoleRequestNotificationTexts(IConfiguration configuration)
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

    public async Task<string>  BuildUserUpdatedMessage(RoleRequestStatus status)
    {
        return status switch
        {
            RoleRequestStatus.Approved => "Tvoje žádost o roli Expert byla schválena.",
            RoleRequestStatus.Rejected => "Tvoje žádost o roli Expert byla zamítnuta.",
            _ => "Admin upravil tvoji žádost o roli Expert."
        };
    }

    public static string BuildNewRequestMessage(string displayName)
    {
        return $"{displayName} podal(a) novou žádost o roli Expert.";
    }

    public async Task<string> RenderNewRequestBody(string templateBody, string? requesterDisplayName, string? requesterEmail, string? userNote, int pendingCount)
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

    async Task<string> IRoleRequestNotificationTexts.RenderUserUpdatedBody(string templateBody, string? displayName, RoleRequestStatus status, string? adminNote)
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


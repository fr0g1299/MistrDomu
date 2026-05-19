using AspNetReactTemplate.Server.Extensions.Notification;
using AspNetReactTemplate.Server.Models.Notifications;
using AspNetReactTemplate.Server.Services.Implementation.Identity.Requests;
using AspNetReactTemplate.Server.Services.Implementation.Notifications;

namespace AspNetReactTemplate.Server.Data.Seeding;

public static class EmailTemplateInit
{
    public static EmailTemplate[] GetTemplates() => new[]
    {
        new EmailTemplate
        {
            Key = EmailTemplateKeys.NewRoleRequestAdmin,
            Subject = NotificationTypes.NewRequestSubject,
            Body = """
                   <p>Uživatel <strong>{DisplayName}</strong> ({Email}) podal novou žádost o roli Expert.</p>
                   {NoteSection}
                   <p><strong>Počet čekajících žádostí:</strong> {PendingCount}</p>
                   <p>
                       <a href="{AdminUrl}">Otevřete administraci a žádost prosím zpracujte.</a>
                   </p>
                   <p>Zasláno z aplikace Mistr domu.</p>
                   """
        },
        new EmailTemplate
        {
            Key = EmailTemplateKeys.RoleRequestUpdatedUser,
            Subject = NotificationTypes.UpdatedUserSubject,
            Body = """
                   <p>Dobrý den,</p>
                   <p>Stav vaší žádosti o roli Expert byl změněn na: <strong>{Status}</strong>.</p>
                   {AdminNoteSection}
                   <p>Váš Mistr domu.</p>
                   """
        },
    };
}
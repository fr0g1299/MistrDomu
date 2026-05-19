using AspNetReactTemplate.Server.Data;
using AspNetReactTemplate.Server.Extensions.Notification;
using AspNetReactTemplate.Server.Models.Identity.Enums;
using AspNetReactTemplate.Server.Models.Notifications;
using AspNetReactTemplate.Server.Services.Abstraction.Identity.Select;
using AspNetReactTemplate.Server.Services.Abstraction.Notifications;
using Microsoft.EntityFrameworkCore;

namespace AspNetReactTemplate.Server.Services.Implementation.Notifications
{
    public class EmailNotificationService : IEmailNotificationService
    {

        private readonly ILogger<EmailService> _logger;
        private readonly AppDbContext _appDbContext;
        private readonly IUserSelectService _userSelectService;
        private readonly IRoleRequestNotificationTextsService _roleRequestNotificationTexts;
        public EmailNotificationService (ILogger<EmailService> logger, AppDbContext appDbContext,
            IUserSelectService userSelectService,  IRoleRequestNotificationTextsService roleRequestNotificationTexts)
        {
            _logger = logger;
            _appDbContext = appDbContext;
            _userSelectService = userSelectService;
            _roleRequestNotificationTexts = roleRequestNotificationTexts;
        }
        
        public async Task SendNewRoleRequestToAdminsAsync(
                string requesterDisplayName,
                string? requesterEmail,
                string? userNote,
                int pendingCount)
        {
            var recipientEmails = await GetRecipientEmailsByRolesAsync(new[] { Roles.Admin.ToString() });
            if (recipientEmails.Count == 0)
            {
                _logger.LogWarning(
                    "Role-request admin email was not queued because no admin recipients were found.");
                return;
            }

            var template =
                await _appDbContext.EmailTemplates.FirstOrDefaultAsync(t =>
                    t.Key == EmailTemplateKeys.NewRoleRequestAdmin);
            if (template == null)
            {
                _logger.LogWarning("Role-request admin email template '{TemplateKey}' was not found.",
                    EmailTemplateKeys.NewRoleRequestAdmin);
                return;
            }

            if (string.IsNullOrWhiteSpace(template.Subject) || string.IsNullOrWhiteSpace(template.Body))
            {
                _logger.LogWarning("Role-request admin email template '{TemplateKey}' is incomplete.",
                    EmailTemplateKeys.NewRoleRequestAdmin);
                return;
            }

            await QueueOutboxEmailAsync(
                recipientEmails,
                template.Subject.Trim(),
                 _roleRequestNotificationTexts.RenderNewRequestBody(template.Body, requesterDisplayName,
                    requesterEmail, userNote, pendingCount));
            }

        public async Task SendRoleRequestUpdatedToUserAsync(
                int userId,
                RoleRequestStatus status,
                string? adminNote)
        {
            var user = await _userSelectService.SelectAsync(userId);
            var userEmail = user?.Email;

            if (string.IsNullOrWhiteSpace(userEmail))
            {
                _logger.LogWarning(
                    "Role-request user email was not queued because the recipient has no e-mail address. UserId={UserId}",
                    userId);
                return;
            }

            var template =
                await _appDbContext.EmailTemplates.FirstOrDefaultAsync(t =>
                    t.Key == EmailTemplateKeys.RoleRequestUpdatedUser);
            if (template == null)
            {
                _logger.LogWarning("Role-request user email template '{TemplateKey}' was not found.",
                    EmailTemplateKeys.RoleRequestUpdatedUser);
                return;
            }

            if (string.IsNullOrWhiteSpace(template.Body))
            {
                _logger.LogWarning("Role-request user email template '{TemplateKey}' is incomplete.",
                    EmailTemplateKeys.RoleRequestUpdatedUser);
                return;
            }

            var subject = string.IsNullOrWhiteSpace(template.Subject)
                ? NotificationTypes.UpdatedUserSubject
                : template.Subject.Trim();
            var displayName = string.Join(" ", new[] { user?.FirstName, user?.LastName }
                .Where(x => !string.IsNullOrWhiteSpace(x))).Trim();
            if (string.IsNullOrWhiteSpace(displayName))
            {
                displayName = user?.UserName ?? "Uživateli";
            }

            await QueueOutboxEmailAsync(
                new List<string> { userEmail },
                subject,
                 _roleRequestNotificationTexts.RenderUserUpdatedBody(template.Body, status, adminNote));
            }

        private async Task QueueOutboxEmailAsync(IList<string> recipients, string subject, string body)
        {
            if (recipients.Count == 0 || string.IsNullOrWhiteSpace(subject) || string.IsNullOrWhiteSpace(body))
            {
                _logger.LogWarning(
                    "Email outbox message was not queued because payload is incomplete. Recipients={RecipientCount}, SubjectEmpty={SubjectEmpty}, BodyEmpty={BodyEmpty}",
                    recipients.Count,
                    string.IsNullOrWhiteSpace(subject),
                    string.IsNullOrWhiteSpace(body));
                return;
            }

            var outboxMessage = new EmailOutboxMessage
            {
                To = recipients.Where(email => !string.IsNullOrWhiteSpace(email)).Select(email => email.Trim())
                    .ToList(),
                Subject = subject.Trim(),
                Body = body
            };

            _appDbContext.EmailOutboxMessages.Add(outboxMessage);
            await _appDbContext.SaveChangesAsync();
            }

        private async Task<List<string>> GetRecipientEmailsByRolesAsync(IEnumerable<string> roles)
        {
            var requestedRoles = roles
                .Where(role => !string.IsNullOrWhiteSpace(role))
                .Select(role => role.Trim())
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();

            if (requestedRoles.Count == 0)
            {
                return new List<string>();
            }
            var recipients = await _userSelectService.GetUsersByRoles(requestedRoles);
            return recipients
                .Where(user => !string.IsNullOrWhiteSpace(user.Email))
                .Select(user => user.Email!)
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();
        }
    }
}

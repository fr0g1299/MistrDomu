using System.Net;
using System.Net.Mail;
using AspNetReactTemplate.Server.Services.Abstraction.Notifications;
using AspNetReactTemplate.Server.Data;
using AspNetReactTemplate.Server.Models.DTOs.Notifications;
using Microsoft.EntityFrameworkCore;

namespace AspNetReactTemplate.Server.Services.Implementation.Notifications
{
    public class EmailService : IEmailAppService
    {
        private readonly ILogger<EmailService> _logger;
        private readonly AppDbContext _appDbContext;

        public EmailService(ILogger<EmailService> logger, AppDbContext appDbContext)
        {
            _logger = logger;
            _appDbContext = appDbContext;
        }
        
        public async Task SendEmailAsync(EmailMessage message)
        {
            message.To = message.To.Where(email => !string.IsNullOrWhiteSpace(email)).ToList();
            if (message.To.Count == 0)
            {
                _logger.LogWarning("Email not sent because there are no recipients. Subject: {Subject}", message.Subject);
                return;
            }

            var settings = await _appDbContext.EmailSettings.AsNoTracking().FirstOrDefaultAsync();
            if (settings is null)
            {
                _logger.LogError(
                    "Email settings were not found. Subject: {Subject}, Recipients: {RecipientCount}",
                    message.Subject,
                    message.To.Count);
                throw new InvalidOperationException("Email settings were not found in the database.");
            }

            if (string.IsNullOrWhiteSpace(settings.SmtpServer) ||
                string.IsNullOrWhiteSpace(settings.SmtpUser) ||
                string.IsNullOrWhiteSpace(settings.SmtpFrom))
            {
                _logger.LogError(
                    "Email settings are incomplete. Host={Host}, User={User}, From={From}, Subject={Subject}",
                    settings.SmtpServer,
                    settings.SmtpUser,
                    settings.SmtpFrom,
                    message.Subject);
                throw new InvalidOperationException("Email settings are incomplete.");
            }

            _logger.LogInformation(
                "Preparing email via SMTP {Host}:{Port}, SSL={Ssl}, From={From}, Recipients={RecipientCount}, Subject={Subject}",
                settings.SmtpServer,
                settings.SmtpPort,
                settings.SmtpUseSsl,
                settings.SmtpFrom,
                message.To.Count,
                message.Subject);

            using var mailMessage = new MailMessage();
            mailMessage.From = new MailAddress(settings.SmtpFrom);
            mailMessage.Subject = message.Subject;
            mailMessage.Body = message.Body;
            mailMessage.IsBodyHtml = true;

            foreach (var to in message.To)
            {
                mailMessage.Bcc.Add(to);
            }

            if (!mailMessage.Bcc.Any())
            {
                return;
            }

            using var smtpClient = new SmtpClient(settings.SmtpServer, settings.SmtpPort);
            smtpClient.Credentials = new NetworkCredential(settings.SmtpUser, settings.SmtpPassword);
            smtpClient.EnableSsl = settings.SmtpUseSsl;
            smtpClient.UseDefaultCredentials = false;
            smtpClient.DeliveryMethod = SmtpDeliveryMethod.Network;

            await smtpClient.SendMailAsync(mailMessage);

            _logger.LogInformation("Email sent successfully. Subject: {Subject}, Recipients: {RecipientCount}", message.Subject, message.To.Count);
        }
    }
}
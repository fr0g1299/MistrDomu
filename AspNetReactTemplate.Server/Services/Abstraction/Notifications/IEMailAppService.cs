using AspNetReactTemplate.Server.Models.DTOs.Notifications;
using AspNetReactTemplate.Server.Models.Notifiactions;

namespace AspNetReactTemplate.Server.Services.Abstraction.Notifications;

public interface IEmailAppService
{
    public Task SendEmailAsync(EmailMessage message);
}
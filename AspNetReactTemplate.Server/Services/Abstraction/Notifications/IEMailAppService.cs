using AspNetReactTemplate.Server.Models.DTOs.Notifications;
using AspNetReactTemplate.Server.Models.Notifications;

namespace AspNetReactTemplate.Server.Services.Abstraction.Notifications;

public interface IEmailAppService
{
    public Task SendEmailAsync(EmailMessage message);
}
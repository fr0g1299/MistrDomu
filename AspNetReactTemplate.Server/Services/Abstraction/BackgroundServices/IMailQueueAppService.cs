using AspNetReactTemplate.Server.Models.DTOs.Notifications;
using AspNetReactTemplate.Server.Models.Notifications;

namespace AspNetReactTemplate.Server.Services.Abstraction.BackgroundServices;

public interface IMailQueueAppService
{
    Task EnqueueEmailAsync(IList<string> to, string subject, string body);
    IAsyncEnumerable <EmailMessage> GetEmailsAsync(CancellationToken cancellationToken);
    
}
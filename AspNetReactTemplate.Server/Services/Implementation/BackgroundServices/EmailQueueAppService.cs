using System.Threading.Channels;
using AspNetReactTemplate.Server.Models.DTOs.Notifications;
using AspNetReactTemplate.Server.Models.Notifications;
using AspNetReactTemplate.Server.Services.Abstraction.BackgroundServices;

namespace AspNetReactTemplate.Server.Services.Implementation.BackgroundServices;

public class EmailQueueAppService : IMailQueueAppService
{
    private readonly Channel<EmailMessage> _queue = Channel.CreateUnbounded<EmailMessage>();
    private readonly ILogger<EmailQueueAppService> _logger;

    public EmailQueueAppService(ILogger<EmailQueueAppService> logger)
    {
        _logger = logger;
    }

    public async Task EnqueueEmailAsync(IList<string> to, string subject, string body)
    {
        var message = new EmailMessage
        {
            To = to,
            Subject = subject,
            Body = body
        };

        await _queue.Writer.WriteAsync(message);
        _logger.LogInformation("Email queued: {@Email}", message);
    }

    public IAsyncEnumerable<EmailMessage> GetEmailsAsync(CancellationToken cancellationToken)
    {
        return _queue.Reader.ReadAllAsync(cancellationToken);
    }
}
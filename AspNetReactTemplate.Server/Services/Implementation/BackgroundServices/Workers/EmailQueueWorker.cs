using System.Net.Mail;
using AspNetReactTemplate.Server.Data;
using AspNetReactTemplate.Server.Models;
using AspNetReactTemplate.Server.Models.DTOs.Notifications;
using AspNetReactTemplate.Server.Models.Notifications;
using AspNetReactTemplate.Server.Services.Abstraction.Notifications;
using Microsoft.EntityFrameworkCore;

namespace AspNetReactTemplate.Server.Services.Implementation.BackgroundServices.Workers;

public class EmailQueueWorker : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<EmailQueueWorker> _logger;

    private const int BatchSize = 20;
    private const int MaxRetryAttempts = 5;

    private static readonly TimeSpan RetryDelay = TimeSpan.FromMinutes(2);
    private static readonly TimeSpan PollDelay = TimeSpan.FromSeconds(15);
    private static readonly TimeSpan StaleProcessingTimeout = TimeSpan.FromMinutes(10);

    public EmailQueueWorker(
        IServiceScopeFactory scopeFactory,
        ILogger<EmailQueueWorker> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("EmailQueueWorker started.");

        try
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await ProcessOutboxBatchAsync(stoppingToken);
                }
                catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
                {
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error while processing email outbox batch.");
                }

                if (!stoppingToken.IsCancellationRequested)
                {
                    await Task.Delay(PollDelay, stoppingToken);
                }
            }
        }
        catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
        {
            _logger.LogInformation("EmailQueueWorker cancelled.");
        }
        finally
        {
            _logger.LogInformation("EmailQueueWorker stopped.");
        }
    }

    private async Task ProcessOutboxBatchAsync(CancellationToken stoppingToken)
    {
        using var scope = _scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var mailAppService = scope.ServiceProvider.GetRequiredService<IEmailAppService>();

        var now = DateTime.UtcNow;

        await RequeueStaleMessagesAsync(dbContext, now, stoppingToken);

        var claimedIds = await ClaimOutboxMessageIdsAsync(dbContext, now, stoppingToken);
        if (claimedIds.Count == 0)
        {
            return;
        }

        var messages = await dbContext.EmailOutboxMessages
            .Where(message => claimedIds.Contains(message.Id))
            .OrderBy(message => message.CreatedAtUtc)
            .ToListAsync(stoppingToken);

        foreach (var message in messages)
        {
            try
            {
                await mailAppService.SendEmailAsync(new EmailMessage
                {
                    To = message.To.ToList(),
                    Subject = message.Subject,
                    Body = message.Body
                });

                var sentAt = DateTime.UtcNow;

                message.Status = EmailOutboxStatus.Sent;
                message.SentAtUtc = sentAt;
                message.LastError = null;
                message.ProcessingStartedAtUtc = null;
                message.DeadLetteredAtUtc = null;

                _logger.LogInformation(
                    "Email sent successfully. MessageId: {MessageId}, RecipientCount: {RecipientCount}, AttemptCount: {AttemptCount}",
                    message.Id,
                    message.To.Count,
                    message.AttemptCount);
            }
            catch (InvalidOperationException ex)
            {
                ApplyFailure(message, ex, DateTime.UtcNow, permanentFailure: true);
                _logger.LogWarning(ex, "Permanent error while sending outbox email. MessageId: {MessageId}", message.Id);
            }
            catch (ArgumentException ex)
            {
                ApplyFailure(message, ex, DateTime.UtcNow, permanentFailure: true);
                _logger.LogWarning(ex, "Permanent invalid payload while sending outbox email. MessageId: {MessageId}", message.Id);
            }
            catch (SmtpException ex)
            {
                ApplyFailure(message, ex, DateTime.UtcNow);
                _logger.LogWarning(ex, "SMTP error while sending outbox email. MessageId: {MessageId}", message.Id);
            }
            catch (Exception ex)
            {
                ApplyFailure(message, ex, DateTime.UtcNow);
                _logger.LogWarning(ex, "Unexpected error while sending outbox email. MessageId: {MessageId}", message.Id);
            }
        }

        await dbContext.SaveChangesAsync(stoppingToken);
    }

    private async Task<List<int>> ClaimOutboxMessageIdsAsync(
        AppDbContext dbContext,
        DateTime now,
        CancellationToken stoppingToken)
    {
        var candidateIds = await dbContext.EmailOutboxMessages
            .AsNoTracking()
            .Where(message =>
                (message.Status == EmailOutboxStatus.Pending || message.Status == EmailOutboxStatus.Failed) &&
                message.NextAttemptAtUtc <= now)
            .OrderBy(message => message.CreatedAtUtc)
            .Select(message => message.Id)
            .Take(BatchSize)
            .ToListAsync(stoppingToken);

        if (candidateIds.Count == 0)
        {
            return [];
        }

        var claimedIds = new List<int>(candidateIds.Count);

        foreach (var candidateId in candidateIds)
        {
            var affected = await dbContext.EmailOutboxMessages
                .Where(message =>
                    message.Id == candidateId &&
                    (message.Status == EmailOutboxStatus.Pending || message.Status == EmailOutboxStatus.Failed) &&
                    message.NextAttemptAtUtc <= now)
                .ExecuteUpdateAsync(setters => setters
                    .SetProperty(message => message.Status, EmailOutboxStatus.Processing)
                    .SetProperty(message => message.ProcessingStartedAtUtc, now)
                    .SetProperty(message => message.LastAttemptAtUtc, now)
                    .SetProperty(message => message.AttemptCount, message => message.AttemptCount + 1)
                    .SetProperty(message => message.LastError, (string?)null), stoppingToken);

            if (affected == 1)
            {
                claimedIds.Add(candidateId);
            }
        }

        return claimedIds;
    }

    private async Task RequeueStaleMessagesAsync(
        AppDbContext dbContext,
        DateTime now,
        CancellationToken stoppingToken)
    {
        var staleThreshold = now - StaleProcessingTimeout;

        var affected = await dbContext.EmailOutboxMessages
            .Where(message =>
                message.Status == EmailOutboxStatus.Processing &&
                message.ProcessingStartedAtUtc != null &&
                message.ProcessingStartedAtUtc < staleThreshold)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(message => message.Status, EmailOutboxStatus.Failed)
                .SetProperty(message => message.ProcessingStartedAtUtc, (DateTime?)null)
                .SetProperty(message => message.NextAttemptAtUtc, now)
                .SetProperty(message => message.LastError, "Processing timeout; message requeued."), stoppingToken);

        if (affected > 0)
        {
            _logger.LogWarning("Requeued {Count} stale outbox messages.", affected);
        }
    }

    private static void ApplyFailure(
        EmailOutboxMessage message,
        Exception exception,
        DateTime now,
        bool permanentFailure = false)
    {
        message.LastError = exception.Message;
        message.ProcessingStartedAtUtc = null;
        message.LastAttemptAtUtc = now;

        if (permanentFailure || message.AttemptCount >= MaxRetryAttempts)
        {
            message.Status = EmailOutboxStatus.DeadLettered;
            message.DeadLetteredAtUtc = now;
            message.NextAttemptAtUtc = now;
            return;
        }

        message.Status = EmailOutboxStatus.Failed;
        message.DeadLetteredAtUtc = null;
        message.NextAttemptAtUtc = now.Add(RetryDelay);
    }
}
using AspNetReactTemplate.Server.Data;
using AspNetReactTemplate.Server.Models.Notifiactions;
using Microsoft.EntityFrameworkCore;

namespace AspNetReactTemplate.Server.Services.Implementation.BackgroundServices;

public class EmailOutboxCleanupWorker : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<EmailOutboxCleanupWorker> _logger;

    private const int DeleteBatchSize = 500;

    private static readonly TimeSpan PollDelay = TimeSpan.FromHours(24);
    private static readonly TimeSpan Retention = TimeSpan.FromDays(30);

    public EmailOutboxCleanupWorker(
        IServiceScopeFactory scopeFactory,
        ILogger<EmailOutboxCleanupWorker> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("EmailOutboxCleanupWorker started.");

        try
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await CleanupAsync(stoppingToken);
                }
                catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
                {
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error while cleaning email outbox.");
                }

                if (!stoppingToken.IsCancellationRequested)
                {
                    await Task.Delay(PollDelay, stoppingToken);
                }
            }
        }
        catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
        {
            _logger.LogInformation("EmailOutboxCleanupWorker cancelled.");
        }
        finally
        {
            _logger.LogInformation("EmailOutboxCleanupWorker stopped.");
        }
    }

    private async Task CleanupAsync(CancellationToken stoppingToken)
    {
        using var scope = _scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var now = DateTime.UtcNow;
        var msgCutoff = now - Retention;
        var deleted = await DeleteMessagesAsync(dbContext, msgCutoff,stoppingToken);

        if (deleted > 0)
        {
            _logger.LogInformation(
                "Email outbox cleanup finished. Deleted: {Deleted}",
                deleted);
        }
    }

    private static async Task<int> DeleteMessagesAsync(
        AppDbContext dbContext,
        DateTime cutoff,
        CancellationToken stoppingToken)
    {
        var ids = await dbContext.EmailOutboxMessages
            .AsNoTracking()
            .Where(message =>
                message.Status == EmailOutboxStatus.Sent &&
                message.SentAtUtc != null &&
                message.SentAtUtc < cutoff)
            .OrderBy(message => message.SentAtUtc)
            .Select(message => message.Id)
            .Take(DeleteBatchSize)
            .ToListAsync(stoppingToken);

        if (ids.Count == 0)
        {
            return 0;
        }

        return await dbContext.EmailOutboxMessages
            .Where(message => ids.Contains(message.Id))
            .ExecuteDeleteAsync(stoppingToken);
    }
    
}
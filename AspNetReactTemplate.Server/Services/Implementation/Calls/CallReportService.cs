using AspNetReactTemplate.Server.Data;
using AspNetReactTemplate.Server.Services.Abstraction.Calls;

namespace AspNetReactTemplate.Server.Services.Implementation.Calls;

public class CallReportService : ICallSessionReportService
{
    private readonly AppDbContext _dbContext;

    public CallReportService(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public Task<int> GetNumberOfCallsByExpertAsync(int expertUserId, CancellationToken cancellationToken = default)
    {
        var totalCalls = _dbContext.ManualCallLogs.Count(log => log.ParticipantUserId == expertUserId);

        return Task.FromResult(totalCalls);
    }

    public Task<int> GetTotalCallsByExpertForManualAsync(int expertId, int manualId, CancellationToken cancellationToken = default)
    {
        var totalCalls = _dbContext.ManualCallLogs.Count(log => log.ParticipantUserId == expertId && log.ManualId == manualId);

        return Task.FromResult(totalCalls);
    }
}
using AspNetReactTemplate.Server.Data;
using AspNetReactTemplate.Server.Models;
using AspNetReactTemplate.Server.Services.Abstraction.Calls;
using Microsoft.EntityFrameworkCore;

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

    public async Task<int> GetTotalEarningsCzkByExpertAsync(int expertUserId, CancellationToken cancellationToken = default)
    {
        var expertBalance = await _dbContext.ExpertBalances
            .AsNoTracking()
            .FirstOrDefaultAsync(balance => balance.ExpertUserId == expertUserId, cancellationToken);

        if (expertBalance is null)
        {
            return 0;
        }

        return expertBalance.BalanceCzk;
    }
}
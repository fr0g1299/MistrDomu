using AspNetReactTemplate.Server.Data;
using AspNetReactTemplate.Server.Models.DTOs.Manuals;
using AspNetReactTemplate.Server.Services.Abstraction.Manuals;
using Microsoft.EntityFrameworkCore;

namespace AspNetReactTemplate.Server.Services.Implementation.Manuals;

public class ExpertManualHelpQueryService : IExpertManualHelpQueryService
{
    private readonly AppDbContext _context;

    public ExpertManualHelpQueryService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<ExpertManualHelpReadDto>> GetManualHelps(int manualId)
    {
        var helps = await _context.ExpertManualHelps
            .AsNoTracking()
            .Where(h => h.ManualId == manualId)
            .Select(h => new ExpertManualHelpReadDto
            {
                ManualId = h.ManualId,
                ManualTitle = h.Manual.Title,
                ExpertId = h.ExpertId,
                ExpertName = ((h.Expert.FirstName ?? string.Empty) + " " + (h.Expert.LastName ?? string.Empty)).Trim()
            })
            .ToListAsync();

        if (helps.Count == 0)
        {
            var manualExists = await _context.Manuals.AnyAsync(m => m.Id == manualId);
            if (!manualExists)
            {
                throw new KeyNotFoundException($"Manual with ID {manualId} was not found.");
            }
        }

        return helps;
    }

    public async Task<IReadOnlyList<ManualForExpertReadDto>> GetManualsForExpert(int expertId)
    {
        var helps = await _context.ExpertManualHelps
            .AsNoTracking()
            .Where(h => h.ExpertId == expertId)
            .Select(h => new ManualForExpertReadDto
            {
                ManualId = h.ManualId,
                ManualTitle = h.Manual.Title
            })
            .ToListAsync();

        if (helps.Count == 0)
        {
            var expertExists = await _context.Users.AnyAsync(u => u.Id == expertId);
            if (!expertExists)
            {
                throw new KeyNotFoundException($"Expert with ID {expertId} was not found.");
            }
        }

        return helps;
    }

    // May be useful for some endpoints to avoid fetching unnecessary manual info
    public async Task<IReadOnlyList<ExpertForManualReadDto>> GetExpertsForManual(int manualId)
    {
        var manualHelps = await GetManualHelps(manualId);

        if (manualHelps.Count == 0)
        {
            var manualExists = await _context.Manuals.AnyAsync(m => m.Id == manualId);
            if (!manualExists)
            {
                throw new KeyNotFoundException($"Manual with ID {manualId} was not found.");
            }
        }

        return manualHelps
            .Select(h => new ExpertForManualReadDto
            {
                ExpertId = h.ExpertId,
                ExpertName = h.ExpertName
            })
            .ToList();
    }
}

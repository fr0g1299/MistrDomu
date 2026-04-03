using AspNetReactTemplate.Server.Data;
using AspNetReactTemplate.Server.Models.DTOs.Manuals;
using AspNetReactTemplate.Server.Services.Abstraction.Manuals;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using AspNetReactTemplate.Server.Models.Manuals;

namespace AspNetReactTemplate.Server.Services.Implementation.Manuals;

public class ExpertManualHelpCommandService : IExpertManualHelpCommandService
{
    private readonly AppDbContext _context;

    public ExpertManualHelpCommandService(AppDbContext context)
    {
        _context = context;
    }

    public async Task AddManualToExpert(ExpertManualHelpCreateDto dto, ClaimsPrincipal user)
    {
        var manual = await _context.Manuals.FindAsync(dto.ManualId);

        if (manual == null)
        {
            throw new KeyNotFoundException($"Manual with ID {dto.ManualId} was not found.");
        }

        var expert = await _context.Users.FindAsync(dto.ExpertId);

        if (expert == null)
        {
            throw new KeyNotFoundException($"Expert with ID {dto.ExpertId} was not found.");
        }

        var existingHelp = await _context.ExpertManualHelps
            .FirstOrDefaultAsync(h => h.ManualId == dto.ManualId && h.ExpertId == dto.ExpertId);

        if (existingHelp != null)
        {
            throw new InvalidOperationException($"Expert with ID {dto.ExpertId} is already helping with manual ID {dto.ManualId}.");
        }

        var newHelp = new ExpertManualHelp
        {
            ManualId = dto.ManualId,
            ExpertId = dto.ExpertId
        };

        _context.ExpertManualHelps.Add(newHelp);
        await _context.SaveChangesAsync();
    }

    public async Task RemoveManualFromExpert(int manualId, int expertId, ClaimsPrincipal user)
    {
        var existingHelp = await _context.ExpertManualHelps
            .FirstOrDefaultAsync(h => h.ManualId == manualId && h.ExpertId == expertId);

        if (existingHelp == null)
        {
            throw new KeyNotFoundException($"No existing help found for expert ID {expertId} and manual ID {manualId}.");
        }

        _context.ExpertManualHelps.Remove(existingHelp);
        await _context.SaveChangesAsync();
    }
}
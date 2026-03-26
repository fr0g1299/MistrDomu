using AspNetReactTemplate.Server.Data;
using AspNetReactTemplate.Server.Models.DTOs.Manuals;
using AspNetReactTemplate.Server.Models.Manuals;
using AspNetReactTemplate.Server.Services.Abstraction.Tools;
using Microsoft.EntityFrameworkCore;

namespace AspNetReactTemplate.Server.Services.Implementation.Tools;

public class ToolQueryService : IToolQueryService
{
    private readonly AppDbContext _context;

    public ToolQueryService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<ToolReadDto>> GetAllToolsAsync()
    {
        return await _context.Tools
            .AsNoTracking()
            .Include(t => t.Manuals)
            .Select(t => new ToolReadDto
            {
                Id = t.Id,
                Name = t.Name,
                Url = t.Url,
                Manuals = t.Manuals.Select(m => m.Title).ToList()
            })
            .ToListAsync();
    }

    public async Task<ToolReadDto?> GetToolByIdAsync(int id)
    {
        return await _context.Tools
            .AsNoTracking()
            .Where(t => t.Id == id)
            .Select(t => new ToolReadDto
            {
                Id = t.Id,
                Name = t.Name,
                Url = t.Url
            })
            .FirstOrDefaultAsync();
    }

    public async Task<IEnumerable<ToolReadDto>> GetAllToolsByManualIdAsync(int manualId)
    {
        return await _context.Tools
            .AsNoTracking()
            .Where(t => t.Manuals.Any(m => m.Id == manualId))
            .Select(t => new ToolReadDto
            {
                Id = t.Id,
                Name = t.Name,
                Url = t.Url
            })
            .ToListAsync();
    }
}
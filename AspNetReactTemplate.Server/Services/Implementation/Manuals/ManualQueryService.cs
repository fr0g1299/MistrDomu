using Microsoft.EntityFrameworkCore;
using AspNetReactTemplate.Server.Data;
using AspNetReactTemplate.Server.Models.DTOs.Manuals;
using AspNetReactTemplate.Server.Models.Manuals;
using AspNetReactTemplate.Server.Services.Abstraction.Manuals;

namespace AspNetReactTemplate.Server.Services.Implementation.Manuals;

public class ManualQueryService : IManualQueryService
{
    private readonly AppDbContext _context;

    public ManualQueryService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<ManualReadDto>> GetAllManualsAsync()
    {
        var manuals = await _context.Manuals
            .AsNoTracking()
            .ToListAsync();

        return manuals.Select(MapToReadDto);
    }

    public async Task<ManualReadDto?> GetManualByIdAsync(int id)
    {
        var manual = await _context.Manuals
            .AsNoTracking()
            .FirstOrDefaultAsync(m => m.Id == id);

        return manual is null ? null : MapToReadDto(manual);
    }

    public async Task<IEnumerable<ManualReadDto>> SearchManualsAsync(string keyword)
    {
        if (string.IsNullOrWhiteSpace(keyword))
        {
            return Enumerable.Empty<ManualReadDto>();
        }

        var pattern = $"%{keyword.Trim()}%";

        var manuals = await _context.Manuals
            .AsNoTracking()
            .Where(m => EF.Functions.ILike(m.Title, pattern) || EF.Functions.ILike(m.Description, pattern))
            .ToListAsync();

        return manuals.Select(MapToReadDto);
    }

    private static ManualReadDto MapToReadDto(Manual manual)
    {
        return new ManualReadDto
        {
            Id = manual.Id,
            Title = manual.Title,
            ImageUrl = manual.ImageUrl,
            Description = manual.Description,
            Difficulty = manual.Difficulty,
            EstimatedTimeMinutes = manual.EstimatedTimeMinutes,
            RequiredTools = manual.RequiredTools,
            CreatedAt = manual.CreatedAt
        };
    }
}
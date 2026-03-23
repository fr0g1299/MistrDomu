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

    public async Task<IEnumerable<ManualReadDto>> GetAllManualsAsync(bool includeSteps = false)
    {
        var manuals = await BuildManualQuery(includeSteps)
            .ToListAsync();

        return manuals.Select(manual => MapToReadDto(manual, includeSteps));
    }

    public async Task<ManualReadDto?> GetManualByIdAsync(int id, bool includeSteps = false)
    {
        var manual = await BuildManualQuery(includeSteps)
            .FirstOrDefaultAsync(m => m.Id == id);

        return manual is null ? null : MapToReadDto(manual, includeSteps);
    }

    public async Task<IEnumerable<ManualReadDto>> SearchManualsAsync(string keyword, bool includeSteps = false)
    {
        if (string.IsNullOrWhiteSpace(keyword))
        {
            return Enumerable.Empty<ManualReadDto>();
        }

        var pattern = $"%{keyword.Trim()}%";

        var manuals = await BuildManualQuery(includeSteps)
            .Where(m =>EF.Functions.ILike(EF.Functions.Unaccent(m.Title), EF.Functions.Unaccent(pattern)) ||
                EF.Functions.ILike(EF.Functions.Unaccent(m.Description), EF.Functions.Unaccent(pattern)) || 
                m.Tags.Any(tag => EF.Functions.ILike(EF.Functions.Unaccent(tag), EF.Functions.Unaccent(pattern))))
            .ToListAsync();

        return manuals.Select(manual => MapToReadDto(manual, includeSteps));
    }

    public async Task<IEnumerable<StepReadDto>> GetStepsByManualIdAsync(int manualId)
    {
        var steps = await _context.Steps
            .AsNoTracking()
            .Where(s => s.ManualId == manualId)
            .ToListAsync();

        return steps.Select(step => new StepReadDto
        {
            Id = step.Id,
            Title = step.Title,
            Content = step.Content,
            ImageUrl = step.ImageUrl,
            ManualId = step.ManualId
        });
    }

    private IQueryable<Manual> BuildManualQuery(bool includeSteps)
    {
        var query = _context.Manuals
            .AsNoTracking();

        if (includeSteps)
        {
            query = query.Include(m => m.Steps);
        }

        return query;
    }

    private static ManualReadDto MapToReadDto(Manual manual, bool includeSteps)
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
            Steps = includeSteps
                ? manual.Steps
                    .Select(step => new StepReadDto
                    {
                        Id = step.Id,
                        Title = step.Title,
                        Content = step.Content,
                        ImageUrl = step.ImageUrl,
                        ManualId = step.ManualId
                    })
                    .ToList()
                : [],
            Tags = manual.Tags,
            CreatedAt = manual.CreatedAt
        };
    }
}
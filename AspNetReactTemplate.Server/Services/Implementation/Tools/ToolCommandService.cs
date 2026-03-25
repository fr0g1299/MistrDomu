using AspNetReactTemplate.Server.Data;
using AspNetReactTemplate.Server.Models.Manuals;
using AspNetReactTemplate.Server.Models.DTOs.Manuals;
using AspNetReactTemplate.Server.Services.Abstraction.Tools;

namespace AspNetReactTemplate.Server.Services.Implementation.Tools;

public class ToolCommandService : IToolCommandService
{
    private readonly AppDbContext _context;

    public ToolCommandService(AppDbContext context)
    {
        _context = context;
    }

    public Task<ToolCreateDto> CreateToolAsync(int manualId, ToolCreateDto tool)
    {
        throw new NotImplementedException();
    }

    public Task<bool> DeleteToolAsync(int id)
    {
        throw new NotImplementedException();
    }

    public Task<ToolUpdateDto> UpdateToolAsync(int id, ToolUpdateDto tool)
    {
        throw new NotImplementedException();
    }
}
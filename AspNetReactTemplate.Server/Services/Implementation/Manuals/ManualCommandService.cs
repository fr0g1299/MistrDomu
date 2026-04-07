using AspNetReactTemplate.Server.Data;
using AspNetReactTemplate.Server.Models.DTOs.Manuals;
using AspNetReactTemplate.Server.Models.Manuals;
using AspNetReactTemplate.Server.Services.Abstraction.Manuals;

namespace AspNetReactTemplate.Server.Services.Implementation.Manuals;

public class ManualCommandService : IManualCommandService
{
    private readonly AppDbContext _context;

    public ManualCommandService(AppDbContext context)
    {
        _context = context;
    }

    public Task<ManualCreateDto> CreateManualAsync(ManualCreateDto manual)
    {
        throw new NotImplementedException();
    }

    public Task<ManualUpdateDto> UpdateManualAsync(int id, ManualUpdateDto manual)
    {
        throw new NotImplementedException();
    }

    public Task<bool> DeleteManualAsync(int id)
    {
        throw new NotImplementedException();
    }
}
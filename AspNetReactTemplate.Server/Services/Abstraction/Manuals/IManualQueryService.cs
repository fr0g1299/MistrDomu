using AspNetReactTemplate.Server.Models.DTOs.Manuals;

namespace AspNetReactTemplate.Server.Services.Abstraction.Manuals;

public interface IManualQueryService
{
    Task<IEnumerable<ManualReadDto>> GetAllManualsAsync();
    Task<ManualReadDto?> GetManualByIdAsync(int id);
    Task<IEnumerable<ManualReadDto>> SearchManualsAsync(string keyword);
}
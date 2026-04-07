using AspNetReactTemplate.Server.Models.DTOs.Manuals;

namespace AspNetReactTemplate.Server.Services.Abstraction.Manuals;

public interface IManualCommandService
{
    Task<ManualCreateDto> CreateManualAsync(ManualCreateDto manual);
    Task<ManualUpdateDto> UpdateManualAsync(int id, ManualUpdateDto manual);
    Task<bool> DeleteManualAsync(int id);
}
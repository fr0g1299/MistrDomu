using AspNetReactTemplate.Server.Models.Manuals;

namespace AspNetReactTemplate.Server.Services.Abstraction.Manuals;

public interface IManualCommandService
{
    Task<Manual> CreateManualAsync(Manual manual);
    Task<Manual?> UpdateManualAsync(int id, Manual manual);
    Task<bool> DeleteManualAsync(int id);
}
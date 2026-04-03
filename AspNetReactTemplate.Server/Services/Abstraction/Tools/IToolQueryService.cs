using AspNetReactTemplate.Server.Models.DTOs.Manuals;

namespace AspNetReactTemplate.Server.Services.Abstraction.Tools;

public interface IToolQueryService
{
    /// <summary>
    /// Vrati vsechny nastroje.
    /// </summary>
    /// <returns></returns>
    Task<IEnumerable<ToolReadDto>> GetAllToolsAsync();

    /// <summary>
    /// Vrati detail nastroje podle ID.
    /// </summary>
    /// <param name="id"></param>
    /// <returns></returns>
    Task<ToolReadDto?> GetToolByIdAsync(int id);

    /// <summary>
    /// Vrati vsechny nastroje pro dany manual podle jeho ID.
    /// </summary>
    /// <param name="manualId"></param>
    /// <returns></returns>
    Task<IEnumerable<ToolReadDto>> GetAllToolsByManualIdAsync(int manualId);
}
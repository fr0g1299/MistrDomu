using AspNetReactTemplate.Server.Models.DTOs.Manuals;

namespace AspNetReactTemplate.Server.Services.Abstraction.Tools;

public interface IToolCommandService
{
    /// <summary>
    /// Vytvori novy nastroj pro dany manual.
    /// </summary>
    /// <param name="manualId"></param>
    /// <param name="tool"></param>
    /// <returns></returns>
    Task<ToolCreateDto> CreateToolAsync(int manualId, ToolCreateDto tool);

    /// <summary>
    /// Aktualizuje nastroj podle ID.
    /// </summary>
    /// <param name="id"></param>
    /// <param name="tool"></param>
    /// <returns></returns>
    Task<ToolUpdateDto> UpdateToolAsync(int id, ToolUpdateDto tool);

    /// <summary>
    /// Smaze nastroj podle ID.
    /// </summary>
    /// <param name="id"></param>
    /// <returns></returns>
    Task<bool> DeleteToolAsync(int id);
}
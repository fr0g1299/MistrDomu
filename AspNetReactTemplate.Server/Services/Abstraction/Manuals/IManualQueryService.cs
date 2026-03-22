using AspNetReactTemplate.Server.Models.DTOs.Manuals;

namespace AspNetReactTemplate.Server.Services.Abstraction.Manuals;

public interface IManualQueryService
{
    /// <summary>
    /// Vrati vsechny manualy.
    /// </summary>
    /// <param name="includeSteps">
    /// Pokud je <c>true</c>, nacte a vrati i kolekci kroku (Steps).
    /// Pokud je <c>false</c>, kroky nenacita kvuli rychlejsimu dotazu.
    /// </param>
    /// <returns>Kolekce manualu.</returns>
    Task<IEnumerable<ManualReadDto>> GetAllManualsAsync(bool includeSteps = false);

    /// <summary>
    /// Vrati detail manualu podle ID.
    /// </summary>
    /// <param name="id">Identifikator manualu.</param>
    /// <param name="includeSteps">
    /// Pokud je <c>true</c>, nacte a vrati i kolekci kroku (Steps).
    /// Pokud je <c>false</c>, kroky nenacita kvuli rychlejsimu dotazu.
    /// </param>
    /// <returns>Manual nebo <c>null</c>, pokud neexistuje.</returns>
    Task<ManualReadDto?> GetManualByIdAsync(int id, bool includeSteps = false);

    /// <summary>
    /// Vyhleda manualy podle zadaneho klicoveho slova.
    /// </summary>
    /// <param name="keyword">Hledany text.</param>
    /// <param name="includeSteps">
    /// Pokud je <c>true</c>, nacte a vrati i kolekci kroku (Steps).
    /// Pokud je <c>false</c>, kroky nenacita kvuli rychlejsimu dotazu.
    /// </param>
    /// <returns>Kolekce nalezenych manualu.</returns>
    Task<IEnumerable<ManualReadDto>> SearchManualsAsync(string keyword, bool includeSteps = false);

    /// <summary>
    /// Vrati kroky pro dany manual podle jeho ID.
    /// </summary>
    /// <param name="manualId">Identifikator manualu.</param>
    /// <returns>Kolekce kroku.</returns>
    Task<IEnumerable<StepReadDto>> GetStepsByManualIdAsync(int manualId);
}
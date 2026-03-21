using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using AspNetReactTemplate.Server.Services.Abstraction.Manuals;
using AspNetReactTemplate.Server.Models.DTOs.Manuals;

namespace AspNetReactTemplate.Server.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class ManualsController : ControllerBase
{
    private readonly IManualQueryService _manualQueryService;

    public ManualsController(IManualQueryService manualQueryService)
    {
        _manualQueryService = manualQueryService;
    }

    // GET: api/Manuals
    [HttpGet]
    public async Task<ActionResult<IEnumerable<ManualReadDto>>> GetManuals()
    {
        var manuals = await _manualQueryService.GetAllManualsAsync();
        return Ok(manuals);
    }

    // GET: api/Manuals/5
    [HttpGet("{id:int}")]
    public async Task<ActionResult<ManualReadDto>> GetManual(int id)
    {
        var manual = await _manualQueryService.GetManualByIdAsync(id);

        if (manual is null)
        {
            return NotFound();
        }

        return Ok(manual);
    }

    // GET: api/Manuals/{query}
    [HttpGet("search/{query}")]
    public async Task<ActionResult<IEnumerable<ManualReadDto>>> SearchManuals(string query)
    {
        if (string.IsNullOrWhiteSpace(query))
        {
            return BadRequest("Search keyword is required.");
        }

        var manuals = await _manualQueryService.SearchManualsAsync(query);
        return Ok(manuals);
    }
}
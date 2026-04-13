using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using AspNetReactTemplate.Server.Infrastracture.Identity;
using AspNetReactTemplate.Server.Services.Abstraction.Manuals;
using AspNetReactTemplate.Server.Models.DTOs.Manuals;

namespace AspNetReactTemplate.Server.Controllers;

[ApiController]
[Authorize(Policy = AuthorizationPolicies.AuthenticatedUser)]
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
    public async Task<ActionResult<IEnumerable<ManualReadDto>>> GetManuals([FromQuery] bool includeSteps = false)
    {
        var manuals = await _manualQueryService.GetAllManualsAsync(includeSteps);
        return Ok(manuals);
    }

    // GET: api/Manuals/{id}
    [HttpGet("{id:int}")]
    public async Task<ActionResult<ManualReadDto>> GetManual(int id, [FromQuery] bool includeSteps = false)
    {
        var manual = await _manualQueryService.GetManualByIdAsync(id, includeSteps);

        if (manual is null)
        {
            return NotFound();
        }

        return Ok(manual);
    }

    // GET: api/Manuals/search/{query}
    [HttpGet("search/{query}")]
    public async Task<ActionResult<IEnumerable<ManualReadDto>>> SearchManuals(string query, [FromQuery] bool includeSteps = false)
    {
        if (string.IsNullOrWhiteSpace(query))
        {
            return BadRequest("Search keyword is required.");
        }

        var manuals = await _manualQueryService.SearchManualsAsync(query, includeSteps);
        return Ok(manuals);
    }

    // GET: api/Manuals/{id}/steps
    [HttpGet("{id:int}/steps")]
    public async Task<ActionResult<IEnumerable<StepReadDto>>> GetManualSteps(int id)
    {
        var steps = await _manualQueryService.GetStepsByManualIdAsync(id);
        return Ok(steps);
    }
}
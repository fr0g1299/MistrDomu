using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using AspNetReactTemplate.Server.Services.Abstraction.Tools;
using AspNetReactTemplate.Server.Models.DTOs.Manuals;
using AspNetReactTemplate.Server.Infrastracture.Identity;

namespace AspNetReactTemplate.Server.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize(Policy = AuthorizationPolicies.AuthenticatedUser)]
public class ToolsController : ControllerBase
{
    private readonly IToolQueryService _toolQueryService;
    private readonly IToolCommandService _toolCommandService;

    public ToolsController(IToolQueryService toolQueryService, IToolCommandService toolCommandService)
    {
        _toolQueryService = toolQueryService;
        _toolCommandService = toolCommandService;
    }

    // GET: api/Tools
    [HttpGet]
    public async Task<ActionResult<IEnumerable<ToolReadDto>>> GetTools()
    {
        var tools = await _toolQueryService.GetAllToolsAsync();
        return Ok(tools);
    }

    // GET: api/Tools/{id}
    [HttpGet("{id:int}")]
    public async Task<ActionResult<ToolReadDto>> GetTool(int id)
    {
        var tool = await _toolQueryService.GetToolByIdAsync(id);

        if (tool is null)
        {
            return NotFound();
        }

        return Ok(tool);
    }

    // GET: api/Tools/manual/{manualId}
    [HttpGet("manual/{manualId:int}")]
    [HttpGet("~/api/manuals/{manualId:int}/tools")]
    public async Task<ActionResult<IEnumerable<ToolReadDto>>> GetToolsByManualId(int manualId)
    {
        var tools = await _toolQueryService.GetAllToolsByManualIdAsync(manualId);
        return Ok(tools);
    }

    // POST: api/Tools/manual/{manualId}
    [HttpPost("manual/{manualId:int}")]
    [Authorize(Policy = AuthorizationPolicies.AdminOnly)]
    public async Task<ActionResult<ToolReadDto>> CreateTool(int manualId, [FromBody] ToolCreateDto toolDto)
    {
        try
        {
            var result = await _toolCommandService.CreateToolAsync(manualId, toolDto, User);

            return CreatedAtAction(nameof(GetTool), new { id = result.Id }, result);
        }
        catch (UnauthorizedAccessException) { return Forbid(); }
        catch (KeyNotFoundException ex) { return NotFound(ex.Message); }
    }

    // PUT: api/Tools/{id}
    [HttpPut("{id:int}")]
    [Authorize(Policy = AuthorizationPolicies.AdminOnly)]
    public async Task<IActionResult> UpdateTool(int id, [FromBody] ToolUpdateDto toolDto)
    {
        try
        {
            await _toolCommandService.UpdateToolAsync(id, toolDto, User);
            return NoContent();
        }
        catch (UnauthorizedAccessException) { return Forbid(); }
        catch (InvalidOperationException ex) { return NotFound(ex.Message); }
    }

    // DELETE: api/Tools/{id}
    [HttpDelete("{id:int}")]
    [Authorize(Policy = AuthorizationPolicies.AdminOnly)]
    public async Task<IActionResult> DeleteTool(int id)
    {
        try
        {
            var success = await _toolCommandService.DeleteToolAsync(id, User);
            return success ? NoContent() : NotFound();
        }
        catch (UnauthorizedAccessException) { return Forbid(); }
    }
}
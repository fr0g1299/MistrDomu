using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using AspNetReactTemplate.Server.Services.Abstraction.Tools;
using AspNetReactTemplate.Server.Models.DTOs.Manuals;

namespace AspNetReactTemplate.Server.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class ToolsController : ControllerBase
{
    private readonly IToolQueryService _toolQueryService;

    public ToolsController(IToolQueryService toolQueryService)
    {
        _toolQueryService = toolQueryService;
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
}
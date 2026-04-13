using AspNetReactTemplate.Server.Infrastracture.Identity;
using AspNetReactTemplate.Server.Models.DTOs.Manuals;
using AspNetReactTemplate.Server.Services.Abstraction.Manuals;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AspNetReactTemplate.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = AuthorizationPolicies.AdminOrExpertOnly)]
public class ExpertManualHelpController : ControllerBase
{
    private readonly IExpertManualHelpCommandService _commandService;
    private readonly IExpertManualHelpQueryService _queryService;
    private readonly IAuthorizationService _authorizationService;

    public ExpertManualHelpController(IExpertManualHelpCommandService commandService, IExpertManualHelpQueryService queryService, IAuthorizationService authorizationService)
    {
        _commandService = commandService;
        _queryService = queryService;
        _authorizationService = authorizationService;
    }

    // GET: api/ExpertManualHelp/manual/{manualId}
    [HttpGet("manual/{manualId:int}")]
    public async Task<ActionResult<IEnumerable<ExpertManualHelpReadDto>>> GetHelpsForManual(int manualId)
    {
        try
        {
            var authorization = await _authorizationService.AuthorizeAsync(User, manualId, AuthorizationPolicies.AdminOrAssignedManual);
            if (!authorization.Succeeded)
            {
                return Forbid();
            }

            var helps = await _queryService.GetManualHelps(manualId);
            return Ok(helps);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
        catch (Exception)
        {
            return StatusCode(500, "An error occurred while retrieving the expert helps for the manual.");
        }
    }

    // GET: api/ExpertManualHelp/manual/{manualId}/experts
    [HttpGet("manual/{manualId:int}/experts")]
    public async Task<ActionResult<IEnumerable<ExpertForManualReadDto>>> GetExpertsForManual(int manualId)
    {
        try
        {
            var authorization = await _authorizationService.AuthorizeAsync(User, manualId, AuthorizationPolicies.AdminOrAssignedManual);
            if (!authorization.Succeeded)
            {
                return Forbid();
            }

            var experts = await _queryService.GetExpertsForManual(manualId);
            return Ok(experts);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
        catch (Exception)
        {
            return StatusCode(500, "An error occurred while retrieving the experts for the manual.");
        }
    }

    // GET: api/ExpertManualHelp/expert/{expertId}/manuals
    [HttpGet("expert/{expertId:int}/manuals")]
    public async Task<ActionResult<IEnumerable<ManualForExpertReadDto>>> GetManualsForExpert(int expertId)
    {
        try
        {
            var authorization = await _authorizationService.AuthorizeAsync(User, expertId, AuthorizationPolicies.AdminOrSelfExpert);
            if (!authorization.Succeeded)
            {
                return Forbid();
            }

            var manuals = await _queryService.GetManualsForExpert(expertId);
            return Ok(manuals);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
        catch (Exception)
        {
            return StatusCode(500, "An error occurred while retrieving the manuals for the expert.");
        }
    }

    // POST: api/ExpertManualHelp
    [HttpPost]
    public async Task<ActionResult> AddManualToExpert([FromBody] ExpertManualHelpCreateDto dto)
    {
        try
        {
            var authorization = await _authorizationService.AuthorizeAsync(User, dto.ExpertId, AuthorizationPolicies.AdminOrSelfExpert);
            if (!authorization.Succeeded)
            {
                return Forbid();
            }

            await _commandService.AddManualToExpert(dto, User);
            return Ok();
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (Exception)
        {
            return StatusCode(500, "An error occurred while adding the expert to the manual.");
        }
    }

    // DELETE: api/ExpertManualHelp/manual/{manualId}/expert/{expertId}
    [HttpDelete("manual/{manualId:int}/expert/{expertId:int}")]
    public async Task<ActionResult> RemoveManualFromExpert(int manualId, int expertId)
    {
        try
        {
            var authorization = await _authorizationService.AuthorizeAsync(User, expertId, AuthorizationPolicies.AdminOrSelfExpert);
            if (!authorization.Succeeded)
            {
                return Forbid();
            }

            await _commandService.RemoveManualFromExpert(manualId, expertId, User);
            return Ok();
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
        catch (Exception)
        {
            return StatusCode(500, "An error occurred while removing the expert from the manual.");
        }
    }
}
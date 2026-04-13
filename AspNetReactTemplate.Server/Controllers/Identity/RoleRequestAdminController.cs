using AspNetReactTemplate.Server.Extensions.Controller;
using AspNetReactTemplate.Server.Infrastracture.Identity;
using AspNetReactTemplate.Server.Models.DTOs.Identity;
using AspNetReactTemplate.Server.Services.Abstraction.Identity.RoleRequest;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AspNetReactTemplate.Server.Controllers.Identity;

[ApiController]
[Authorize(Policy = AuthorizationPolicies.AdminOnly)]
[Route("api/[controller]")]
public class RoleRequestAdminController : ControllerBase
{
    private readonly IAdminRoleRequestService _roleRequestService;

    public RoleRequestAdminController(IAdminRoleRequestService roleRequestService)
    {
        _roleRequestService = roleRequestService;
    }

    [HttpGet("expert/pending")]
    public async Task<IActionResult> GetPendingExpertRequests([FromQuery] RoleRequestListQueryDto query)
    {
        var result = await _roleRequestService.GetPendingExpertRequestsAsync(query);
        return this.ToActionResult(result);
    }

    [HttpGet("expert/pending/count")]
    public async Task<IActionResult> GetPendingExpertRequestCount()
    {
        var result = await _roleRequestService.GetPendingExpertRequestCountAsync();
        return this.ToActionResult(result);
    }

    [HttpPost("expert/{requestId:int}/approve")]
    public async Task<IActionResult> ApproveExpertRequest([FromRoute] int requestId, [FromBody] ApproveRoleRequestDto? dto)
    {
        var result = await _roleRequestService.ApproveExpertRequestAsync(requestId, dto?.Note);
        return this.ToActionResult(result);
    }

    [HttpPost("expert/{requestId:int}/reject")]
    public async Task<IActionResult> RejectExpertRequest([FromRoute] int requestId, [FromBody] RejectRoleRequestDto dto)
    {
        var result = await _roleRequestService.RejectExpertRequestAsync(requestId, dto.Note);
        return this.ToActionResult(result);
    }

    [HttpPut("expert/{requestId:int}/note")]
    public async Task<IActionResult> UpdateExpertRoleRequestNote([FromRoute] int requestId, [FromBody] UpdateRoleRequestNoteDto dto)
    {
        var result = await _roleRequestService.UpdateExpertRoleRequestNoteAsync(requestId, dto.Note);
        return this.ToActionResult(result);
    }
}

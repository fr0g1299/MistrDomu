using AspNetReactTemplate.Server.Extensions.Controller;
using AspNetReactTemplate.Server.Infrastracture.Identity;
using AspNetReactTemplate.Server.Models.DTOs.Identity;
using AspNetReactTemplate.Server.Models.DTOs.System;
using AspNetReactTemplate.Server.Services.Abstraction.Identity.RoleRequest;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AspNetReactTemplate.Server.Controllers.Identity;

[ApiController]
[Authorize(Policy = AuthorizationPolicies.AuthenticatedUser)]
[Route("api/[controller]")]
public class RoleRequestController : ControllerBase
{
    private readonly IUserRoleRequestService _roleRequestService;

    public RoleRequestController(IUserRoleRequestService roleRequestService)
    {
        _roleRequestService = roleRequestService;
    }

    [HttpPost]
    public async Task<IActionResult> CreateRoleRequest([FromBody] CreateRoleRequestDto dto)
    {
        var result = await _roleRequestService.CreateRoleRequestAsync(dto);
        return this.ToActionResult(result);
    }

    [HttpGet("my")]
    public async Task<IActionResult> GetMyRequests([FromQuery] RoleRequestListQueryDto query)
    {
        var result = await _roleRequestService.GetMyRoleRequestsAsync(query);
        return this.ToActionResult(result);
    }

    [HttpGet("my/{requestId:int}")]
    public async Task<IActionResult> GetMyRequestDetail([FromRoute] int requestId)
    {
        var result = await _roleRequestService.GetMyRoleRequestDetailAsync(requestId);
        return this.ToActionResult(result);
    }

    [HttpPost("expert")]
    public async Task<IActionResult> CreateExpertRequest()
    {
        var result = await _roleRequestService.CreateExpertRequestAsync();
        return this.ToActionResult(result);
    }

    [HttpGet("my-expert")]
    public async Task<IActionResult> GetMyLatestExpertRequest()
    {
        var result = await _roleRequestService.GetMyLatestExpertRequestAsync();
        if (result.ErrorType == ServiceErrorType.NotFound)
        {
            return NoContent();
        }

        return this.ToActionResult(result);
    }
}

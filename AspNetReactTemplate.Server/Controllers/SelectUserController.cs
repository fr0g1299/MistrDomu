using AspNetReactTemplate.Server.Models.DTOs.Identity;
using AspNetReactTemplate.Server.Models.DTOs.System;
using AspNetReactTemplate.Server.Services.Abstraction.Identity.Select;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AspNetReactTemplate.Server.Controllers;

[ApiController]
[Authorize(Policy = "CanSeeAllUsers")]
[Route("api/[controller]")]
public class SelectUserController : ControllerBase
{
    private readonly IUserSelectService _userSelectService;
    
    public SelectUserController(IUserSelectService userSelectService)
    {
        _userSelectService = userSelectService;
    }
    
    [HttpGet]
    public async Task<IActionResult> GetUsers([FromQuery] UserListQueryDto query)
    {
        var result = await _userSelectService.SelectPageAsync(query);

        if (result.IsSuccess)
        {
            return Ok(result.Data);
        }

        return result.ErrorType switch
        {
            ServiceErrorType.Validation => BadRequest(new { Errors = result.Errors }),
            ServiceErrorType.Forbidden => Forbid(),
            _ => StatusCode(StatusCodes.Status500InternalServerError, new { Errors = result.Errors })
        };
    }

}
using System.ComponentModel.DataAnnotations;
using AspNetReactTemplate.Server.Models.DTOs.System;
using AspNetReactTemplate.Server.Services.Abstraction.Identity.Edit;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AspNetReactTemplate.Server.Controllers.Identity
{
    [ApiController]
    [Authorize]
    [Route("api/[controller]")]
    public class EditUserController : ControllerBase
    {
        private readonly IEditUserService _editUserService;

        public EditUserController(IEditUserService editUserService)
        {
            _editUserService = editUserService;
        }

        [HttpPut("{userId}/role")]
        [Authorize(Policy = "CanSetRole")]
        public async Task<IActionResult> SetRole([FromRoute] string userId, [FromBody] EditRoleRequest request)
        {
        
            var result = await _editUserService.SetRoleAsync(userId, request.Role);

            if (result.IsSuccess)
            {
                return Ok(new { Message = "Role byla úspěšně nastavena." });
            }

            return result.ErrorType switch
            {
                ServiceErrorType.Validation => BadRequest(new { Errors = result.Errors }),
                ServiceErrorType.Forbidden => Forbid(),
                ServiceErrorType.NotFound => NotFound(new { Errors = result.Errors }),
                _ => StatusCode(StatusCodes.Status500InternalServerError, new { Errors = result.Errors })
            };
        }
    }

    public sealed record EditRoleRequest([param: Required] string Role);

}

using AspNetReactTemplate.Server.Extensions.Controller;
using AspNetReactTemplate.Server.Infrastracture.Identity;
using AspNetReactTemplate.Server.Models.DTOs.Identity;
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
        [Authorize(Policy = AuthorizationPolicies.CanSetRole)]
        public async Task<IActionResult> SetRole([FromRoute] string userId, [FromBody] EditRoleRequestDto request)
        {
            var result = await _editUserService.SetRoleAsync(userId, request.Role);
            return this.ToActionResult(result, new { message = "Role byla úspěšně nastavena." });
        }
    }
}

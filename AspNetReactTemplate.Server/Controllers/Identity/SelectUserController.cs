using AspNetReactTemplate.Server.Extensions.Controller;
using AspNetReactTemplate.Server.Infrastracture.Identity;
using AspNetReactTemplate.Server.Models.DTOs.Identity;
using AspNetReactTemplate.Server.Services.Abstraction.Identity.Select;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AspNetReactTemplate.Server.Controllers.Identity
{
    [ApiController]
    [Authorize(Policy = AuthorizationPolicies.AdminOnly)]
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
            return this.ToActionResult(result);
        }

    }
}
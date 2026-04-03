using AspNetReactTemplate.Server.Models.DTOs.Identity;
using AspNetReactTemplate.Server.Models.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Identity;
using AspNetReactTemplate.Server.Services.Abstraction.Identity.Auth;
using AspNetReactTemplate.Server.Services.Abstraction.Identity.Register;

namespace AspNetReactTemplate.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IRegisterService _registerService;
        private readonly IAuthService _authService;
        private readonly UserManager<User> _userManager;

        public AuthController(
            IAuthService authService,
            IRegisterService registerService,
            UserManager<User> userManager)
        {

            _authService = authService;
            _registerService = registerService;
            _userManager = userManager;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] UserRegisterDto model)
        {
            var result = await _registerService.RegisterAsync(model);

            if (result.Succeeded)
            {
                return Ok(new { message = "Registrace proběhla úspěšně." });
            }

            return BadRequest(result.Errors);
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto model)
        {
            var result = await _authService.LoginAsync(model);

            if (result.Succeeded)
            {
                return Ok(new { message = "Přihlášení úspěšné." });
            }

            if (result.IsLockedOut)
            {
                return StatusCode(423, new { message = "Účet je dočasně uzamčen." });
            }

            return Unauthorized(new { message = "Neplatné přihlašovací údaje." });
        }

        [HttpPost("logout")]
        public async Task<IActionResult> Logout()
        {
            await _authService.LogoutAsync();
            return Ok(new { message = "Odhlášení úspěšné." });
        }

        [HttpGet("me")]
        public async Task<IActionResult> GetCurrentUser()
        {
            if (User.Identity?.IsAuthenticated == true)
            {
                var appUser = await _userManager.GetUserAsync(User);

                if (appUser == null)
                {
                    return Unauthorized(new { message = "Žádný přihlášený uživatel" });
                }

                var userDto = new CurrentUserDto
                {
                    IsAuthenticated = true,
                    Email = appUser.Email,
                    FirstName = appUser.FirstName,
                    LastName = appUser.LastName,
                    Roles = (await _userManager.GetRolesAsync(appUser)).ToList()
                };

                return Ok(userDto);
            }

            var unauthenticatedDto = new CurrentUserDto
            {
                IsAuthenticated = false
            };

            return Ok(unauthenticatedDto);
        }
    }
}
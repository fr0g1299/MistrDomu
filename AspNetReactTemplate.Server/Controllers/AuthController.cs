using AspNetReactTemplate.Server.Models.DTOs.Identity;
using Microsoft.AspNetCore.Mvc;
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
        
        public AuthController(
            IAuthService authService,
            IRegisterService registerService)
        {
            
            _authService = authService;
            _registerService = registerService;
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
        public IActionResult GetCurrentUser()
        {
            if (User.Identity?.IsAuthenticated == true)
            {
                return Ok(new
                {
                    isAuthenticated = true,
                    email = User.Identity.Name,
                });
            }

            return Ok(new { isAuthenticated = false });
        }
    }
}
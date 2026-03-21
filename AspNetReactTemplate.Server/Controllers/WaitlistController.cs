using Microsoft.AspNetCore.Mvc;
using AspNetReactTemplate.Server.Data;
using AspNetReactTemplate.Server.Models;
using Microsoft.EntityFrameworkCore;

namespace AspNetReactTemplate.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class WaitlistController : ControllerBase
    {
        private readonly AppDbContext _context;

        public WaitlistController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("count")]
        public async Task<IActionResult> GetWaitlistCount()
        {
            var count = await _context.WaitlistEmails.CountAsync();
            return Ok(new { count });
        }

        [HttpPost]
        public async Task<IActionResult> JoinWaitlist([FromBody] WaitlistEmailRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.Email))
                {
                    return BadRequest("Email is required.");
                }

                // Check if email already exists
                var existing = await _context.WaitlistEmails.AnyAsync(e => e.Email == request.Email);
                if (existing)
                {
                    return Conflict("This email is already on the waitlist.");
                }

                var waitlistEmail = new WaitlistEmail
                {
                    Email = request.Email,
                    CreatedAt = DateTime.UtcNow
                };

                _context.WaitlistEmails.Add(waitlistEmail);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Successfully joined the waitlist!" });
            }
            catch (Exception ex)
            {
                // Diagnostic: Return the actual error message to the client
                var errorMessage = ex.InnerException != null 
                    ? $"{ex.Message} -> {ex.InnerException.Message}" 
                    : ex.Message;
                return StatusCode(500, errorMessage);
            }
        }
    }

    public class WaitlistEmailRequest
    {
        public string Email { get; set; } = string.Empty;
    }
}

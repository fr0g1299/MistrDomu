using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text.Json;
using System.Text;
using AspNetReactTemplate.Server.Data;
using AspNetReactTemplate.Server.Models;
using AspNetReactTemplate.Server.Models.DTOs.AiChat;
using AspNetReactTemplate.Server.Models.Identity;

namespace AspNetReactTemplate.Server.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/[controller]")]
    public class ChatController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;

        public ChatController(AppDbContext context, HttpClient httpClient, IConfiguration configuration)
        {
            _context = context;
            _httpClient = httpClient;
            _configuration = configuration;
        }

        [HttpGet("{manualId}")]
        public async Task<ActionResult<IEnumerable<AiChatInteractionDto>>> GetHistory(int manualId)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            var interactions = await _context.AiChatInteractions
                .Where(i => i.UserId == userId && i.ManualId == manualId)
                .OrderBy(i => i.CreatedAt)
                .ToListAsync();

            var history = new List<AiChatInteractionDto>();
            foreach (var interaction in interactions)
            {
                history.Add(new AiChatInteractionDto
                {
                    Id = interaction.Id * 2 - 1,
                    Role = "user",
                    Text = interaction.UserMessage,
                    CreatedAt = interaction.CreatedAt
                });
                history.Add(new AiChatInteractionDto
                {
                    Id = interaction.Id * 2,
                    Role = "assistant",
                    Text = interaction.AiResponse,
                    CreatedAt = interaction.CreatedAt
                });
            }

            return Ok(history);
        }

        [HttpPost]
        public async Task<ActionResult> PostMessage([FromBody] AiChatRequestDto request)
        {
            if (string.IsNullOrWhiteSpace(request.Message))
            {
                return BadRequest("Message cannot be empty.");
            }

            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var apiKey = Environment.GetEnvironmentVariable("GEMINI_API_KEY") ?? _configuration["GEMINI_API_KEY"];
            
            if (string.IsNullOrEmpty(apiKey))
            {
                return StatusCode(500, "API key is not configured.");
            }

            // Construct Gemini Request
                        var geminiUrl = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key={apiKey}";
            
            var geminiRequest = new
            {
                contents = new[]
                {
                    new
                    {
                        parts = new[]
                        {
                            new { text = "Jsi užitečný AI asistent pro technický návod/manuál. Odpovídej uživateli na jeho dotazy ohledně návodu stručně, přesně a česky. Zde je dotaz: " + request.Message }
                        }
                    }
                }
            };

            var content = new StringContent(JsonSerializer.Serialize(geminiRequest), Encoding.UTF8, "application/json");
            
            var response = await _httpClient.PostAsync(geminiUrl, content);
            var responseString = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                return StatusCode((int)response.StatusCode, "Error from Gemini API: " + responseString);
            }

            // Parse response
            using var jsonDocument = JsonDocument.Parse(responseString);
            var aiResponseText = jsonDocument.RootElement
                .GetProperty("candidates")[0]
                .GetProperty("content")
                .GetProperty("parts")[0]
                .GetProperty("text")
                .GetString() ?? "Omlouvám se, nepodařilo se mi vygenerovat odpověď.";

            // Save to DB
            var interaction = new AiChatInteraction
            {
                UserId = userId,
                ManualId = request.ManualId,
                UserMessage = request.Message,
                AiResponse = aiResponseText,
                CreatedAt = DateTime.UtcNow
            };

            _context.AiChatInteractions.Add(interaction);
            await _context.SaveChangesAsync();

            return Ok(new { reply = aiResponseText });
        }
    }
}

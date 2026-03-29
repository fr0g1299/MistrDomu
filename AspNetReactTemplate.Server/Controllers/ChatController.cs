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

            // ── API key: DB setting takes precedence, fall back to env / appsettings ──
            var dbApiKey = (await _context.AppSettings.FindAsync("GeminiApiKey"))?.Value;
            var apiKey = !string.IsNullOrWhiteSpace(dbApiKey)
                ? dbApiKey
                : (Environment.GetEnvironmentVariable("GEMINI_API_KEY") ?? _configuration["GEMINI_API_KEY"]);

            if (string.IsNullOrEmpty(apiKey))
            {
                return StatusCode(500, "API key is not configured.");
            }

            // ── Model: read from DB, default to gemini-2.5-flash-lite ──────────────
            var geminiModel = (await _context.AppSettings.FindAsync("GeminiModel"))?.Value;
            if (string.IsNullOrWhiteSpace(geminiModel))
                geminiModel = "gemini-2.5-flash-lite";

            // ── 1. Load manual context ──────────────────────────────────────────
            var manual = await _context.Manuals
                .Include(m => m.Steps)
                .Include(m => m.Tools)
                .FirstOrDefaultAsync(m => m.Id == request.ManualId);

            var systemPrompt = BuildSystemPrompt(manual);

            // ── 2. Load chat history for this user + manual ─────────────────────
            var history = await _context.AiChatInteractions
                .Where(i => i.UserId == userId && i.ManualId == request.ManualId)
                .OrderBy(i => i.CreatedAt)
                .ToListAsync();

            // ── 3. Build multi-turn contents array ──────────────────────────────
            //    Gemini alternates: user → model → user → model …
            var contentsTurns = new List<object>();

            foreach (var turn in history)
            {
                contentsTurns.Add(new
                {
                    role = "user",
                    parts = new[] { new { text = turn.UserMessage } }
                });
                contentsTurns.Add(new
                {
                    role = "model",
                    parts = new[] { new { text = turn.AiResponse } }
                });
            }

            // Append the current user message as the final turn
            contentsTurns.Add(new
            {
                role = "user",
                parts = new[] { new { text = request.Message } }
            });

            // ── 4. Call Gemini ──────────────────────────────────────────────────
            var geminiUrl = $"https://generativelanguage.googleapis.com/v1beta/models/{geminiModel}:generateContent?key={apiKey}";

            var geminiRequest = new
            {
                systemInstruction = new
                {
                    parts = new[] { new { text = systemPrompt } }
                },
                contents = contentsTurns
            };

            var content = new StringContent(JsonSerializer.Serialize(geminiRequest), Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync(geminiUrl, content);
            var responseString = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                return StatusCode((int)response.StatusCode, "Error from Gemini API: " + responseString);
            }

            // ── 5. Parse response ───────────────────────────────────────────────
            using var jsonDocument = JsonDocument.Parse(responseString);
            var aiResponseText = jsonDocument.RootElement
                .GetProperty("candidates")[0]
                .GetProperty("content")
                .GetProperty("parts")[0]
                .GetProperty("text")
                .GetString() ?? "Omlouvám se, nepodařilo se mi vygenerovat odpověď.";

            // ── 6. Persist interaction ──────────────────────────────────────────
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

        // ── Helpers ───────────────────────────────────────────────────────────────

        private static string BuildSystemPrompt(AspNetReactTemplate.Server.Models.Manuals.Manual? manual)
        {
            var sb = new System.Text.StringBuilder();

            sb.AppendLine("Jsi AI asistent specializovaný na technické návody a manuály. Odpovídej stručně, přesně a vždy česky.");
            sb.AppendLine("Pokud uživatel položí otázku, která nesouvisí s tímto návodem, přátelsky ho nasměruj zpět k tématu.");
            sb.AppendLine("Pokud by odpověd měla obsahovat informace o zásahu do elektrického zařízení, upozorni uživatele na riziko úrazu elektrickým proudem a doporuč mu, aby se obrátil na kvalifikovaného elektrikáře. Nikdy neposkytuj návod na zásah do elektrického zařízení.");
            sb.AppendLine();

            if (manual is null)
            {
                sb.AppendLine("Kontext konkrétního návodu není k dispozici.");
                return sb.ToString();
            }

            sb.AppendLine($"## Název návodu: {manual.Title}");
            sb.AppendLine();

            if (!string.IsNullOrWhiteSpace(manual.Description))
            {
                sb.AppendLine("### Popis:");
                sb.AppendLine(manual.Description);
                sb.AppendLine();
            }

            var steps = manual.Steps.OrderBy(s => s.OrderNumber).ToList();
            if (steps.Count > 0)
            {
                sb.AppendLine("### Kroky návodu:");
                int displayNumber = 1;
                foreach (var step in steps)
                {
                    sb.AppendLine($"{displayNumber}. **{step.Title}** — {step.Content}");
                    displayNumber++;
                }
                sb.AppendLine();
            }

            var tools = manual.Tools.ToList();
            if (tools.Count > 0)
            {
                sb.AppendLine("### Potřebné nástroje / materiály:");
                foreach (var tool in tools)
                {
                    sb.AppendLine($"- {tool.Name}");
                }
                sb.AppendLine();
            }

            sb.AppendLine("Odpovídej vždy v kontextu tohoto návodu. Pokud si nejsi jistý, řekni to.");

            return sb.ToString();
        }
    }
}

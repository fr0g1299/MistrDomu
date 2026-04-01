using AspNetReactTemplate.Server.Data;
using AspNetReactTemplate.Server.Models.DTOs.AiChat;
using AspNetReactTemplate.Server.Models;
using AspNetReactTemplate.Server.Services.Abstraction.AiChat;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text;
using System.Text.Json;

namespace AspNetReactTemplate.Server.Services.Implementation.AiChat;

public class AiChatCommandService : IAiChatCommandService
{
    private readonly AppDbContext _context;
    private readonly IAuthorizationService _authorizationService;
    private readonly IConfiguration _configuration;
    private readonly HttpClient _httpClient;

    public AiChatCommandService(AppDbContext context, IAuthorizationService authorizationService, IConfiguration configuration, HttpClient httpClient)
    {
        _context = context;
        _authorizationService = authorizationService;
        _configuration = configuration;
        _httpClient = httpClient;
    }

    public async Task<ActionResult> PostMessage([FromBody] AiChatRequestDto request, ClaimsPrincipal user)
    {
        var userIdClaim = user.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdClaim, out var userId))
        {
            return new UnauthorizedResult();
        }

        // ── Free tier limit: 2 interactions per manual ──────────────────────
        var interactionCount = await _context.AiChatInteractions
            .CountAsync(i => i.UserId == userId && i.ManualId == request.ManualId);

        if (interactionCount >= 2)
        {
            var hasPaid = await _context.ManualPayments
                .AnyAsync(p => p.UserId == userId && p.ManualId == request.ManualId);

            if (!hasPaid)
            {
                return new ObjectResult(new { requiresPayment = true, manualId = request.ManualId })
                {
                    StatusCode = 402
                };
            }
        }

        // ── API key: DB setting takes precedence, fall back to env / appsettings ──
        var dbApiKey = (await _context.AppSettings.FindAsync("GeminiApiKey"))?.Value;

        var apiKey = !string.IsNullOrWhiteSpace(dbApiKey)
            ? dbApiKey
            : (Environment.GetEnvironmentVariable("GEMINI_API_KEY") ?? _configuration["GEMINI_API_KEY"]);

        if (string.IsNullOrEmpty(apiKey))
        {
            return new ObjectResult("API key is not configured.") { StatusCode = 500 };
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

        if (manual is null)
        {
            return new NotFoundObjectResult($"Manual with id {request.ManualId} was not found.");
        }

        // ── 2. Load user's completed steps → map to 1-based display numbers ─
        var completedDbStepIds = (await _context.UserCompletedSteps
            .Where(u => u.UserId == userId && u.ManualId == request.ManualId)
            .Select(u => u.StepId)
            .ToListAsync()).ToHashSet();

        var completedDisplayNumbers = new HashSet<int>();
        if (manual is not null && completedDbStepIds.Count > 0)
        {
            var orderedSteps = manual.Steps.OrderBy(s => s.OrderNumber).ToList();
            for (int i = 0; i < orderedSteps.Count; i++)
            {
                if (completedDbStepIds.Contains(orderedSteps[i].Id))
                    completedDisplayNumbers.Add(i + 1);
            }
        }

        var systemPrompt = BuildSystemPrompt(manual, completedDisplayNumbers);

        // ── 3. Load chat history for this user + manual ─────────────────────
        var history = await _context.AiChatInteractions
            .Where(i => i.UserId == userId && i.ManualId == request.ManualId)
            .OrderBy(i => i.CreatedAt)
            .ToListAsync();

        // ── 4. Build multi-turn contents array ──────────────────────────────
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

        // ── 5. Call Gemini ──────────────────────────────────────────────────
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
            return new ObjectResult("Error from Gemini API: " + responseString)
            {
                StatusCode = (int)response.StatusCode
            };
        }

        // ── 6. Parse response ───────────────────────────────────────────────
        using var jsonDocument = JsonDocument.Parse(responseString);
        var aiResponseText = jsonDocument.RootElement
            .GetProperty("candidates")[0]
            .GetProperty("content")
            .GetProperty("parts")[0]
            .GetProperty("text")
            .GetString() ?? "Omlouvám se, nepodařilo se mi vygenerovat odpověď.";

        // ── 7. Persist interaction ──────────────────────────────────────────
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

        return new OkObjectResult(new { reply = aiResponseText });
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static string BuildSystemPrompt(Models.Manuals.Manual? manual, IEnumerable<int>? completedStepIds = null)
    {
        var sb = new System.Text.StringBuilder();
        var completedSet = new HashSet<int>(completedStepIds ?? Enumerable.Empty<int>());

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
                var status = completedSet.Contains(displayNumber) ? " ✓ dokončeno" : " ○ nedokončeno";
                sb.AppendLine($"{displayNumber}. **{step.Title}**{status} — {step.Content}");
                displayNumber++;
            }
            sb.AppendLine();

            var validCompleted = completedSet.Count(id => id >= 1 && id <= steps.Count);
            sb.AppendLine($"Uživatel dokončil {validCompleted} z {steps.Count} kroků.");
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
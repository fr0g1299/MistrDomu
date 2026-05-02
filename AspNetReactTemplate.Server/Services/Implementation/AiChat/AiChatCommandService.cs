using AspNetReactTemplate.Server.Data;
using AspNetReactTemplate.Server.Models.DTOs.AiChat;
using AspNetReactTemplate.Server.Models;
using AspNetReactTemplate.Server.Services.Abstraction.AiChat;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Azure.AI.OpenAI;
using OpenAI.Chat;

namespace AspNetReactTemplate.Server.Services.Implementation.AiChat;

public class AiChatCommandService : IAiChatCommandService
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;

    public AiChatCommandService(AppDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    public async Task<AiChatMessageResult> PostMessage(AiChatRequestDto request, ClaimsPrincipal user)
    {
        var userIdClaim = user.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdClaim, out var userId))
        {
            return new AiChatMessageResult(AiChatStatus.Unauthorized);
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
                return new AiChatMessageResult(AiChatStatus.RequiresPayment, ManualId: request.ManualId);
            }
        }

        // ── API key: DB setting takes precedence, fall back to env / appsettings ──
        var dbApiKey = (await _context.AppSettings.FindAsync("AiApiKey"))?.Value;

        var apiKey = !string.IsNullOrWhiteSpace(dbApiKey)
            ? dbApiKey
            : (Environment.GetEnvironmentVariable("AI_API_KEY") ?? _configuration["AI_API_KEY"]);

        if (string.IsNullOrEmpty(apiKey))
        {
            return new AiChatMessageResult(AiChatStatus.Error, ErrorMessage: "API key is not configured.");
        }

        // ── Model: read from DB, default to gemini-2.5-flash-lite ──────────────
        var aiModel = (await _context.AppSettings.FindAsync("AiModel"))?.Value;
        if (string.IsNullOrWhiteSpace(aiModel))
            aiModel = "gpt-5.4-mini";

        // ── 1. Load manual context ──────────────────────────────────────────
        var manual = await _context.Manuals
            .Include(m => m.Steps)
            .Include(m => m.Tools)
            .FirstOrDefaultAsync(m => m.Id == request.ManualId);

        if (manual is null)
        {
            return new AiChatMessageResult(AiChatStatus.NotFound, ErrorMessage: $"Manual with id {request.ManualId} was not found.");
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

        // ── 4. Build Azure/OpenAI chat messages ─────────────────────────────
        var messages = new List<ChatMessage>
        {
            new SystemChatMessage(systemPrompt)
        };

        foreach (var turn in history)
        {
            messages.Add(new UserChatMessage(turn.UserMessage));

            if (!string.IsNullOrWhiteSpace(turn.AiResponse))
                messages.Add(new AssistantChatMessage(turn.AiResponse));
        }

        messages.Add(new UserChatMessage(request.Message));

        // ── 5. Call Azure OpenAI ────────────────────────────────────────────
        var endpoint = new Uri("https://tjuri-moiwxfn6-eastus2.cognitiveservices.azure.com/");

        AzureOpenAIClient azureClient = new(
            endpoint,
            new System.ClientModel.ApiKeyCredential(apiKey)
        );
        
        ChatClient chatClient = azureClient.GetChatClient(aiModel);

        ChatCompletion completion;

        try
        {
            completion = await chatClient.CompleteChatAsync(messages);
        }
        catch (Exception ex)
        {
            return new AiChatMessageResult(
                AiChatStatus.Error,
                ErrorMessage: "Error from Azure OpenAI: " + ex.Message
            );
        }

        // ── 6. Parse response ───────────────────────────────────────────────
        var aiResponseText = completion.Content.FirstOrDefault()?.Text
                             ?? "Omlouvám se, nepodařilo se mi vygenerovat odpověď.";
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

        return new AiChatMessageResult(AiChatStatus.Success, Reply: aiResponseText);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static string BuildSystemPrompt(Models.Manuals.Manual? manual, IEnumerable<int>? completedStepIds = null)
    {
        var sb = new System.Text.StringBuilder();
        var completedSet = new HashSet<int>(completedStepIds ?? Enumerable.Empty<int>());
        sb.AppendLine("Jsi AI asistent pro konkrétní technický návod. Odpovídej vždy česky, stručně, prakticky a sebevědomě.");
        sb.AppendLine("Odpovídej na vše, co prakticky souvisí s provedením tohoto návodu: kroky, nástroje, materiály, bezpečnost, kontrola výsledku, časté chyby, řešení problémů, vhodné a nevhodné alternativy, kdy zavolat odborníka a kdo může uživateli bezpečně pomoct.");
        sb.AppendLine("Otázka se považuje za související i tehdy, když se uživatel ptá neformálně, například na instalatéra, souseda, pomocníka, náhradní materiál, jiný nástroj, co dělat když něco nejde, nebo jestli může postup udělat jednodušším způsobem.");
        sb.AppendLine("Pokud uživatel navrhne alternativu, která souvisí s návodem, neodmítej ji automaticky. Posuď ji: pokud je vhodná, potvrď ji; pokud je nevhodná nebo riziková, vysvětli krátce proč a doporuč bezpečnější postup.");
        sb.AppendLine("Pokud se uživatel ptá, jestli může pomoct soused nebo jiná osoba, odpověz prakticky. U jednoduchých bezpečných činností může pomoct šikovná dospělá osoba. U odborných, rizikových nebo nejasných situací doporuč kvalifikovaného odborníka.");
        sb.AppendLine("Odmítej pouze otázky, které s návodem opravdu nesouvisí, například programování, politika, zábava, obecné znalosti nebo jiné téma mimo aktuální manuál. V takovém případě krátce řekni, že to nesouvisí s tímto návodem, a nabídni pomoc s aktuálním postupem.");
        sb.AppendLine("Pokud by odpověď měla obsahovat zásah do elektrického zařízení, upozorni na riziko úrazu elektrickým proudem a doporuč kvalifikovaného elektrikáře. Neposkytuj návod na zásah do elektrického zařízení.");
        sb.AppendLine("Nepoužívej Markdown formátování. Nepoužívej hvězdičky pro tučný text, Markdown nadpisy ani Markdown tabulky. Odpovídej čistým textem.");

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
using AspNetReactTemplate.Server.Data;
using AspNetReactTemplate.Server.Models.DTOs.AiChat;
using AspNetReactTemplate.Server.Services.Abstraction.AiChat;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace AspNetReactTemplate.Server.Services.Implementation.AiChat;

public class AiChatQueryService : IAiChatQueryService
{
    private readonly AppDbContext _context;

    public AiChatQueryService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<ActionResult<IEnumerable<AiChatInteractionDto>>> GetHistory(int manualId, ClaimsPrincipal user)
    {
        var userIdClaim = user.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdClaim, out var userId))
        {
            return new UnauthorizedResult();
        }

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

        return new OkObjectResult(history);
    }
}
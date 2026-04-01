using AspNetReactTemplate.Server.Models.DTOs.AiChat;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace AspNetReactTemplate.Server.Services.Abstraction.AiChat;

public interface IAiChatQueryService
{
    /// <summary>
    /// Gets the chat history for a specific manual. This includes all interactions between the user and the AI related to that manual.
    /// </summary>
    /// <param name="manualId"></param>
    /// <returns></returns>
    Task<ActionResult<IEnumerable<AiChatInteractionDto>>> GetHistory(int manualId, ClaimsPrincipal user);
}
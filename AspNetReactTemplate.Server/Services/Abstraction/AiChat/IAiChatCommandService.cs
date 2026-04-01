using AspNetReactTemplate.Server.Models.DTOs.AiChat;
using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;

namespace AspNetReactTemplate.Server.Services.Abstraction.AiChat;

public interface IAiChatCommandService
{
    /// <summary>
    /// Sends a message to the AI chat system. The request should include the manual ID, the user's message, and any relevant context. The response will contain the AI's reply and any additional information needed for the conversation.
    /// </summary>
    /// <param name="request"></param>
    /// <returns></returns>
    Task<ActionResult> PostMessage([FromBody] AiChatRequestDto request, ClaimsPrincipal user);
}
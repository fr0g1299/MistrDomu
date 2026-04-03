using AspNetReactTemplate.Server.Services.Abstraction.AiChat;
using AspNetReactTemplate.Server.Models.DTOs.AiChat;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AspNetReactTemplate.Server.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/[controller]")]
    public class AiChatController : ControllerBase
    {
        private readonly IAiChatCommandService _commandService;
        private readonly IAiChatQueryService _queryService;

        public AiChatController(IAiChatCommandService commandService, IAiChatQueryService queryService)
        {
            _commandService = commandService;
            _queryService = queryService;
        }

        // ── GET /api/aichat/{manualId} ────────────────────────────────────────
        [HttpGet("{manualId}")]
        public async Task<ActionResult<IEnumerable<AiChatInteractionDto>>> GetHistory(int manualId)
        {
            var historyResult = await _queryService.GetHistory(manualId, User);

            if (historyResult.Status == AiChatStatus.Unauthorized)
            {
                return Unauthorized();
            }

            if (historyResult.Status == AiChatStatus.NotFound)
            {
                return NotFound(historyResult.ErrorMessage);
            }

            if (historyResult.Status == AiChatStatus.Success)
            {
                return Ok(historyResult.History ?? Array.Empty<AiChatInteractionDto>());
            }

            return StatusCode(500, historyResult.ErrorMessage ?? "Failed to retrieve chat history.");
        }

        // ── POST /api/aichat ────────────────────────────────────────────────
        [HttpPost]
        public async Task<ActionResult> PostMessage([FromBody] AiChatRequestDto request)
        {
            if (string.IsNullOrWhiteSpace(request.Message))
            {
                return BadRequest("Message cannot be empty.");
            }

            var result = await _commandService.PostMessage(request, User);

            if (result.Status == AiChatStatus.Unauthorized)
            {
                return Unauthorized();
            }

            if (result.Status == AiChatStatus.RequiresPayment)
            {
                return StatusCode(402, new { requiresPayment = true, manualId = result.ManualId });
            }

            if (result.Status == AiChatStatus.NotFound)
            {
                return NotFound(result.ErrorMessage);
            }

            if (result.Status == AiChatStatus.Error)
            {
                return StatusCode(500, result.ErrorMessage);
            }

            return Ok(new { reply = result.Reply });
        }
    }
}

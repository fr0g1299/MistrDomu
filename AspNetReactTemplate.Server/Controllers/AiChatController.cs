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

            if (historyResult.Result is OkObjectResult okResult)
            {
                var history = okResult.Value as IEnumerable<AiChatInteractionDto> ?? new List<AiChatInteractionDto>();
                return Ok(history);
            }

            if (historyResult.Result is not null)
            {
                return StatusCode((historyResult.Result as ObjectResult)?.StatusCode ?? 500, "Failed to retrieve chat history.");
            }

            var historyFromValue = historyResult.Value ?? new List<AiChatInteractionDto>();

            return Ok(historyFromValue);
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
            return result;
        }
    }
}

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AspNetReactTemplate.Server.Models.DTOs.Payments;
using AspNetReactTemplate.Server.Services.Abstraction.Payments;

namespace AspNetReactTemplate.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PaymentController : ControllerBase
    {
        private readonly IPaymentsCommandService _commandService;
        private readonly IPaymentsQueryService _queryService;

        public PaymentController(IPaymentsCommandService commandService, IPaymentsQueryService queryService)
        {
            _commandService = commandService;
            _queryService = queryService;
        }

        // ── POST /api/payment/checkout ────────────────────────────────────────
        /// <summary>Creates a Stripe Checkout session for purchasing AI access to a manual.</summary>
        [HttpPost("checkout")]
        [Authorize]
        public async Task<ActionResult> CreateCheckout([FromBody] CheckoutRequestDto request)
        {
            var result = await _commandService.CreateCheckout(request, User);

            if (result.Status == PaymentServiceStatus.Unauthorized)
            {
                return Unauthorized();
            }

            if (result.Status == PaymentServiceStatus.NotFound)
            {
                return NotFound(result.ErrorMessage);
            }

            if (result.Status == PaymentServiceStatus.Error)
            {
                return StatusCode(500, result.ErrorMessage);
            }

            if (result.AlreadyPaid)
            {
                return Ok(new { alreadyPaid = true });
            }

            return Ok(new { url = result.Url });
        }

        // ── POST /api/payment/webhook ─────────────────────────────────────────
        /// <summary>Stripe webhook — records a ManualPayment row on successful checkout.</summary>
        [HttpPost("webhook")]
        [AllowAnonymous]
        public async Task<IActionResult> PaymentsWebhook()
        {
            var result = await _commandService.PaymentsWebhook();

            if (result.Success)
            {
                return Ok();
            }

            return BadRequest(result.ErrorMessage ?? "Webhook processing failed.");
        }

        // ── GET /api/payment/check/{manualId} ────────────────────────────────
        /// <summary>Checks if the current user has paid for the specified manual.</summary>
        [HttpGet("check/{manualId}")]
        [Authorize]
        public async Task<ActionResult> CheckPaymentStatus(int manualId)
        {
            var result = await _queryService.CheckPaymentStatus(manualId, User);

            if (result.Status == PaymentServiceStatus.Unauthorized)
            {
                return Unauthorized();
            }

            if (result.Status == PaymentServiceStatus.Success)
            {
                return Ok(new { hasPaid = result.HasPaid });
            }

            return StatusCode(500, result.ErrorMessage ?? "Unexpected error checking payment status.");
        }

        // ── GET /api/payment/check/manual-ids ───────────────────────────────────
        /// <summary>Returns manual IDs for which the current user has paid unlimited AI chat access.</summary>
        [HttpGet("check/manual-ids")]
        [Authorize]
        public async Task<ActionResult<IEnumerable<int>>> GetMyPaidManualIds()
        {
            var result = await _queryService.GetPaidManualIdsForUser(User);

            if (result.Status == PaymentServiceStatus.Unauthorized)
            {
                return Unauthorized();
            }

            if (result.Status == PaymentServiceStatus.Success)
            {
                return Ok(result.ManualIds ?? Array.Empty<int>());
            }

            return StatusCode(500, result.ErrorMessage ?? "Unexpected error retrieving paid manual IDs.");
        }

        // ── GET /api/payment/admin/paid-access ───────────────────────────────
        /// <summary>Returns all paid access records (Admin only).</summary>
        [HttpGet("admin/paid-access")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<IEnumerable<PaidAccessDto>>> GetPaidAccess()
        {
            var result = await _queryService.GetPaidAccess();

            if (result.Status == PaymentServiceStatus.Success)
            {
                return Ok(result.Records ?? Array.Empty<PaidAccessDto>());
            }

            return StatusCode(500, result.ErrorMessage ?? "Unexpected error retrieving paid access records.");
        }
    }
}

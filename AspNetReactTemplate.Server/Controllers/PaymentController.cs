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
        public async Task<ActionResult> CreateCheckout([FromBody] CheckoutRequest request)
        {
            return await _commandService.CreateCheckout(request, User);
        }

        // ── POST /api/payment/webhook ─────────────────────────────────────────
        /// <summary>Stripe webhook — records a ManualPayment row on successful checkout.</summary>
        [HttpPost("webhook")]
        [AllowAnonymous]
        public async Task<IActionResult> PaymentsWebhook()
        {
            return await _commandService.PaymentsWebhook();
        }

        // ── GET /api/payment/check/{manualId} ────────────────────────────────
        /// <summary>Checks if the current user has paid for the specified manual.</summary>
        [HttpGet("check/{manualId}")]
        [Authorize]
        public async Task<ActionResult> CheckPaymentStatus(int manualId)
        {
            var result = await _queryService.CheckPaymentStatus(manualId, User);

            if (result is OkObjectResult okResult)
            {
                return Ok(okResult.Value);
            }
            else if (result is ObjectResult errorResult)
            {
                return StatusCode(errorResult.StatusCode ?? 500, errorResult.Value);
            }
            else
            {
                return StatusCode(500, "Unexpected error checking payment status.");
            }
        }

        // ── GET /api/payment/admin/paid-access ───────────────────────────────
        /// <summary>Returns all paid access records (Admin only).</summary>
        [HttpGet("admin/paid-access")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<IEnumerable<PaidAccessDto>>> GetPaidAccess()
        {
            var result = await _queryService.GetPaidAccess();

            if (result.Result is OkObjectResult okResult)
            {
                return Ok(okResult.Value);
            }
            else if (result.Result is ObjectResult errorResult)
            {
                return StatusCode(errorResult.StatusCode ?? 500, errorResult.Value);
            }
            else
            {
                return StatusCode(500, "Unexpected error retrieving paid access records.");
            }
        }
    }
}

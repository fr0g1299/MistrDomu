using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using AspNetReactTemplate.Server.Data;
using AspNetReactTemplate.Server.Models;
using Stripe;
using Stripe.Checkout;

namespace AspNetReactTemplate.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PaymentController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;

        public PaymentController(AppDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        // ── POST /api/payment/checkout ────────────────────────────────────────
        /// <summary>Creates a Stripe Checkout session for purchasing AI access to a manual.</summary>
        [HttpPost("checkout")]
        [Authorize]
        public async Task<ActionResult> CreateCheckout([FromBody] CheckoutRequest request)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            // If user already paid, nothing to do
            var alreadyPaid = await _context.ManualPayments
                .AnyAsync(p => p.UserId == userId && p.ManualId == request.ManualId);

            if (alreadyPaid)
                return Ok(new { alreadyPaid = true });

            var priceId = Environment.GetEnvironmentVariable("STRIPE_PRICE_ID");
            if (string.IsNullOrEmpty(priceId))
                return StatusCode(500, "Stripe Price ID is not configured.");

            var manual = await _context.Manuals.FindAsync(request.ManualId);
            var manualName = manual?.Title ?? $"Manual #{request.ManualId}";

            // Build absolute success / cancel URLs
            var baseUrl = $"{Request.Scheme}://{Request.Host}";
            var successUrl = $"{baseUrl}/guide/{request.ManualId}?payment=success";
            var cancelUrl = $"{baseUrl}/guide/{request.ManualId}";

            var options = new SessionCreateOptions
            {
                PaymentMethodTypes = ["card"],
                LineItems =
                [
                    new SessionLineItemOptions
                    {
                        Price = priceId,
                        Quantity = 1,
                    }
                ],
                Mode = "payment",
                SuccessUrl = successUrl,
                CancelUrl = cancelUrl,
                Metadata = new Dictionary<string, string>
                {
                    { "userId", userId.ToString() },
                    { "manualId", request.ManualId.ToString() }
                }
            };

            var service = new SessionService();
            Session session = await service.CreateAsync(options);

            return Ok(new { url = session.Url });
        }

        // ── POST /api/payment/webhook ─────────────────────────────────────────
        /// <summary>Stripe webhook — records a ManualPayment row on successful checkout.</summary>
        [HttpPost("webhook")]
        [AllowAnonymous]
        public async Task<IActionResult> Webhook()
        {
            var webhookSecret = Environment.GetEnvironmentVariable("STRIPE_WEBHOOK_SECRET");

            string json;
            using (var reader = new System.IO.StreamReader(Request.Body))
                json = await reader.ReadToEndAsync();

            try
            {
                var stripeEvent = EventUtility.ConstructEvent(
                    json,
                    Request.Headers["Stripe-Signature"],
                    webhookSecret
                );

                if (stripeEvent.Type == "checkout.session.completed")
                {
                    var session = (Session)stripeEvent.Data.Object;

                    if (session.Metadata != null &&
                        session.Metadata.TryGetValue("userId", out var userIdStr) &&
                        session.Metadata.TryGetValue("manualId", out var manualIdStr) &&
                        int.TryParse(userIdStr, out var uid) &&
                        int.TryParse(manualIdStr, out var mid))
                    {
                        // Idempotent: only insert if not already present
                        var exists = await _context.ManualPayments
                            .AnyAsync(p => p.UserId == uid && p.ManualId == mid);

                        if (!exists)
                        {
                            _context.ManualPayments.Add(new ManualPayment
                            {
                                UserId = uid,
                                ManualId = mid,
                                StripeSessionId = session.Id,
                                PaidAt = DateTime.UtcNow
                            });
                            await _context.SaveChangesAsync();
                        }
                    }
                }

                return Ok();
            }
            catch (StripeException ex)
            {
                return BadRequest($"Webhook error: {ex.Message}");
            }
        }

        // ── GET /api/payment/admin/paid-access ───────────────────────────────
        /// <summary>Returns all paid access records (Admin only).</summary>
        [HttpGet("admin/paid-access")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<IEnumerable<PaidAccessDto>>> GetPaidAccess()
        {
            var records = await _context.ManualPayments
                .Include(p => p.User)
                .Include(p => p.Manual)
                .OrderByDescending(p => p.PaidAt)
                .Select(p => new PaidAccessDto
                {
                    Id = p.Id,
                    UserId = p.UserId,
                    UserName = (p.User!.FirstName + " " + p.User.LastName).Trim(),
                    UserEmail = p.User!.Email ?? "",
                    ManualId = p.ManualId,
                    ManualTitle = p.Manual!.Title,
                    StripeSessionId = p.StripeSessionId,
                    PaidAt = p.PaidAt
                })
                .ToListAsync();

            return Ok(records);
        }
    }

    // ── DTOs ─────────────────────────────────────────────────────────────────

    public class CheckoutRequest
    {
        public int ManualId { get; set; }
    }

    public class PaidAccessDto
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string UserName { get; set; } = "";
        public string UserEmail { get; set; } = "";
        public int ManualId { get; set; }
        public string ManualTitle { get; set; } = "";
        public string StripeSessionId { get; set; } = "";
        public DateTime PaidAt { get; set; }
    }
}

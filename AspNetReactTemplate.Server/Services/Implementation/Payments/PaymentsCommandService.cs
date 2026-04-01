using System.Security.Claims;
using AspNetReactTemplate.Server.Data;
using AspNetReactTemplate.Server.Models.DTOs.Payments;
using AspNetReactTemplate.Server.Models;
using AspNetReactTemplate.Server.Services.Abstraction.Payments;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Stripe;
using Stripe.Checkout;

namespace AspNetReactTemplate.Server.Services.Implementation.Payments;

public class PaymentsCommandService : IPaymentsCommandService
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public PaymentsCommandService(AppDbContext context, IConfiguration configuration, IHttpContextAccessor httpContextAccessor)
    {
        _context = context;
        _configuration = configuration;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task<ActionResult> CreateCheckout([FromBody] CheckoutRequest request, ClaimsPrincipal user)
    {
        var userId = int.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)!);

        // If user already paid, nothing to do
        var alreadyPaid = await _context.ManualPayments
            .AnyAsync(p => p.UserId == userId && p.ManualId == request.ManualId);

        if (alreadyPaid)
            return new ObjectResult(new { alreadyPaid = true }) { StatusCode = 200 };

        var priceIdSetting = await _context.AppSettings.FirstOrDefaultAsync(s => s.Key == "StripePriceId");
        var priceId = !string.IsNullOrEmpty(priceIdSetting?.Value)
            ? priceIdSetting.Value
            : _configuration["Stripe:PriceId"] ?? _configuration["STRIPE_PRICE_ID"] ?? Environment.GetEnvironmentVariable("STRIPE_PRICE_ID");

        if (string.IsNullOrEmpty(priceId))
            return new ObjectResult(new { error = "Stripe Price ID is not configured." }) { StatusCode = 500 };

        var secretKeySetting = await _context.AppSettings.FirstOrDefaultAsync(s => s.Key == "StripeSecretKey");
        var secretKey = !string.IsNullOrEmpty(secretKeySetting?.Value)
            ? secretKeySetting.Value
            : _configuration["Stripe:SecretKey"] ?? _configuration["STRIPE_SECRET_KEY"] ?? Environment.GetEnvironmentVariable("STRIPE_SECRET_KEY");

        if (string.IsNullOrEmpty(secretKey))
            return new ObjectResult(new { error = "Stripe Secret Key is not configured." }) { StatusCode = 500 };

        var manual = await _context.Manuals.FindAsync(request.ManualId);
        var manualName = manual?.Title ?? $"Manual #{request.ManualId}";

        // Build absolute success / cancel URLs
        var httpRequest = _httpContextAccessor.HttpContext?.Request;
        var baseUrl = $"{httpRequest?.Scheme}://{httpRequest?.Host}";
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
        Session session;
        try
        {
            session = await service.CreateAsync(options, new RequestOptions { ApiKey = secretKey });
        }
        catch (StripeException ex)
        {
            return new ObjectResult($"Stripe error: {ex.StripeError?.Message ?? ex.Message}") { StatusCode = 500 };
        }

        return new OkObjectResult(new { url = session.Url });
    }

    public async Task<IActionResult> PaymentsWebhook()
    {
        var webhookSecretSetting = await _context.AppSettings.FirstOrDefaultAsync(s => s.Key == "StripeWebhookSecret");
        var webhookSecret = !string.IsNullOrEmpty(webhookSecretSetting?.Value)
            ? webhookSecretSetting.Value
            : _configuration["Stripe:WebhookSecret"] ?? _configuration["STRIPE_WEBHOOK_SECRET"] ?? Environment.GetEnvironmentVariable("STRIPE_WEBHOOK_SECRET");

        var httpContext = _httpContextAccessor.HttpContext;
        if (httpContext is null)
        {
            return new ObjectResult("Http context is unavailable.") { StatusCode = 500 };
        }

        string json;
        using (var reader = new StreamReader(httpContext.Request.Body))
        {
            json = await reader.ReadToEndAsync();
        }

        try
        {
            var stripeEvent = EventUtility.ConstructEvent(
                json,
                httpContext.Request.Headers["Stripe-Signature"],
                webhookSecret,
                throwOnApiVersionMismatch: false
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

            return new OkResult();
        }
        catch (StripeException ex)
        {
            return new BadRequestObjectResult($"Webhook error: {ex.Message}");
        }
    }
}
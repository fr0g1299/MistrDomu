using System.Security.Claims;
using AspNetReactTemplate.Server.Data;
using AspNetReactTemplate.Server.Models.DTOs.Payments;
using AspNetReactTemplate.Server.Models;
using AspNetReactTemplate.Server.Services.Abstraction.Payments;
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

    public async Task<PaymentCheckoutResult> CreateCheckout(CheckoutRequestDto request, ClaimsPrincipal user)
    {
        var userIdClaim = user.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdClaim, out var userId))
        {
            return new PaymentCheckoutResult(PaymentServiceStatus.Unauthorized);
        }

        var manual = await _context.Manuals.FindAsync(request.ManualId);
        if (manual is null)
        {
            return new PaymentCheckoutResult(PaymentServiceStatus.NotFound, ErrorMessage: $"Manual with id {request.ManualId} was not found.");
        }

        // If user already paid, nothing to do
        var alreadyPaid = await _context.ManualPayments
            .AnyAsync(p => p.UserId == userId && p.ManualId == request.ManualId);

        if (alreadyPaid)
            return new PaymentCheckoutResult(PaymentServiceStatus.Success, AlreadyPaid: true);

        var priceIdSetting = await _context.AppSettings.FirstOrDefaultAsync(s => s.Key == "StripePriceId");
        var priceId = !string.IsNullOrEmpty(priceIdSetting?.Value)
            ? priceIdSetting.Value
            : _configuration["Stripe:PriceId"] ?? _configuration["STRIPE_PRICE_ID"] ?? Environment.GetEnvironmentVariable("STRIPE_PRICE_ID");

        if (string.IsNullOrEmpty(priceId))
            return new PaymentCheckoutResult(PaymentServiceStatus.Error, ErrorMessage: "Stripe Price ID is not configured.");

        var secretKeySetting = await _context.AppSettings.FirstOrDefaultAsync(s => s.Key == "StripeSecretKey");
        var secretKey = !string.IsNullOrEmpty(secretKeySetting?.Value)
            ? secretKeySetting.Value
            : _configuration["Stripe:SecretKey"] ?? _configuration["STRIPE_SECRET_KEY"] ?? Environment.GetEnvironmentVariable("STRIPE_SECRET_KEY");

        if (string.IsNullOrEmpty(secretKey))
            return new PaymentCheckoutResult(PaymentServiceStatus.Error, ErrorMessage: "Stripe Secret Key is not configured.");

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
            return new PaymentCheckoutResult(PaymentServiceStatus.Error, ErrorMessage: $"Stripe error: {ex.StripeError?.Message ?? ex.Message}");
        }

        return new PaymentCheckoutResult(PaymentServiceStatus.Success, Url: session.Url);
    }

    public async Task<PaymentsWebhookResultDto> PaymentsWebhook()
    {
        var webhookSecretSetting = await _context.AppSettings.FirstOrDefaultAsync(s => s.Key == "StripeWebhookSecret");
        var webhookSecret = !string.IsNullOrEmpty(webhookSecretSetting?.Value)
            ? webhookSecretSetting.Value
            : _configuration["Stripe:WebhookSecret"] ?? _configuration["STRIPE_WEBHOOK_SECRET"] ?? Environment.GetEnvironmentVariable("STRIPE_WEBHOOK_SECRET");

        var httpContext = _httpContextAccessor.HttpContext;
        if (httpContext is null)
        {
            return new PaymentsWebhookResultDto { Success = false, ErrorMessage = "Http context is unavailable." };
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

            return new PaymentsWebhookResultDto { Success = true };
        }
        catch (StripeException ex)
        {
            return new PaymentsWebhookResultDto { Success = false, ErrorMessage = $"Webhook error: {ex.Message}" };
        }
    }
}
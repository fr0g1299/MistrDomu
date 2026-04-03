using AspNetReactTemplate.Server.Models.DTOs.Payments;
using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;

namespace AspNetReactTemplate.Server.Services.Abstraction.Payments;

public interface IPaymentsCommandService
{
    /// <summary>
    /// Initiates the checkout process for a specific manual. This will create a Stripe Checkout Session and return the URL to which the frontend should redirect the user to complete the payment. The request should include the manual ID for which the user wants to purchase access.
    /// </summary>
    /// <param name="request"></param>
    /// <returns></returns>
    Task<PaymentCheckoutResult> CreateCheckout([FromBody] CheckoutRequestDto request, ClaimsPrincipal user);

    /// <summary>
    /// Stripe webhook endpoint that listens for payment events. When a payment is successful, this endpoint will be called by Stripe, and it should record the payment in the database by creating a ManualPayment entry for the user and manual associated with the payment. This ensures that the user's access to the manual is properly granted after a successful payment.
    /// </summary>
    /// <returns></returns>
    Task<IActionResult> PaymentsWebhook();
}
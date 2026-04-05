using AspNetReactTemplate.Server.Models.DTOs.Payments;
using System.Security.Claims;

namespace AspNetReactTemplate.Server.Services.Abstraction.Payments;

public interface IPaymentsQueryService
{
    /// <summary>
    /// Checks the payment status for a specific manual. This will return whether the user has paid for access to the manual, and if so, when the access expires. If the user has not paid, it will return an appropriate message indicating that payment is required.
    /// </summary>
    /// <param name="manualId"></param>
    /// <returns></returns>
    Task<PaymentStatusResult> CheckPaymentStatus(int manualId, ClaimsPrincipal user);

    /// <summary>
    /// Gets a list of all manuals that the user has paid for, along with their access expiration dates. This allows the frontend to display which manuals the user currently has access to and when that access will expire.
    /// </summary>
    /// <returns></returns>
    Task<PaidAccessResult> GetPaidAccess();

    /// <summary>
    /// Gets all manual IDs for which the current user has paid unlimited AI chat access.
    /// </summary>
    /// <param name="user"></param>
    /// <returns></returns>
    Task<PaidManualIdsResult> GetPaidManualIdsForUser(ClaimsPrincipal user);
}
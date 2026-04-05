using System.Security.Claims;
using AspNetReactTemplate.Server.Data;
using AspNetReactTemplate.Server.Models.DTOs.Payments;
using Microsoft.EntityFrameworkCore;

namespace AspNetReactTemplate.Server.Services.Abstraction.Payments;

public class PaymentsQueryService : IPaymentsQueryService
{
    private readonly AppDbContext _context;

    public PaymentsQueryService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<PaymentStatusResult> CheckPaymentStatus(int manualId, ClaimsPrincipal user)
    {
        var userIdClaim = user.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdClaim, out var userId))
        {
            return new PaymentStatusResult(PaymentServiceStatus.Unauthorized);
        }

        var alreadyPaid = await _context.ManualPayments
            .AnyAsync(p => p.UserId == userId && p.ManualId == manualId);

        return new PaymentStatusResult(PaymentServiceStatus.Success, HasPaid: alreadyPaid);
    }

    public async Task<PaidManualIdsResult> GetPaidManualIdsForUser(ClaimsPrincipal user)
    {
        var userIdClaim = user.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdClaim, out var userId))
        {
            return new PaidManualIdsResult(PaymentServiceStatus.Unauthorized);
        }

        var manualIds = await _context.ManualPayments
            .Where(p => p.UserId == userId)
            .Select(p => p.ManualId)
            .Distinct()
            .ToListAsync();

        return new PaidManualIdsResult(PaymentServiceStatus.Success, manualIds);
    }

    public async Task<PaidAccessResult> GetPaidAccess()
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

        return new PaidAccessResult(PaymentServiceStatus.Success, records);
    }
}
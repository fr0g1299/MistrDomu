using System.Security.Claims;
using AspNetReactTemplate.Server.Data;
using AspNetReactTemplate.Server.Models.DTOs.Payments;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AspNetReactTemplate.Server.Services.Abstraction.Payments;

public class PaymentsQueryService : IPaymentsQueryService
{
    private readonly AppDbContext _context;

    public PaymentsQueryService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<ActionResult> CheckPaymentStatus(int manualId, ClaimsPrincipal user)
    {
        var userId = int.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var alreadyPaid = await _context.ManualPayments
            .AnyAsync(p => p.UserId == userId && p.ManualId == manualId);

        return new OkObjectResult(new { hasPaid = alreadyPaid });
    }

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

        return new OkObjectResult(records);
    }
}
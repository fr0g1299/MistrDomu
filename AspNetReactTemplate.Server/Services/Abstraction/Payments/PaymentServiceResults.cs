using AspNetReactTemplate.Server.Models.DTOs.Payments;

namespace AspNetReactTemplate.Server.Services.Abstraction.Payments;

public enum PaymentServiceStatus
{
    Success,
    Unauthorized,
    NotFound,
    Error
}

public sealed record PaymentCheckoutResult(
    PaymentServiceStatus Status,
    string? Url = null,
    bool AlreadyPaid = false,
    string? ErrorMessage = null)
{
    public bool IsSuccess => Status == PaymentServiceStatus.Success;
}

public sealed record PaymentStatusResult(
    PaymentServiceStatus Status,
    bool HasPaid = false,
    string? ErrorMessage = null)
{
    public bool IsSuccess => Status == PaymentServiceStatus.Success;
}

public sealed record PaidAccessResult(
    PaymentServiceStatus Status,
    IReadOnlyList<PaidAccessDto>? Records = null,
    string? ErrorMessage = null)
{
    public bool IsSuccess => Status == PaymentServiceStatus.Success;
}
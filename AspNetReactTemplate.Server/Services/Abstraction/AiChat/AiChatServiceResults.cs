using AspNetReactTemplate.Server.Models.DTOs.AiChat;

namespace AspNetReactTemplate.Server.Services.Abstraction.AiChat;

public enum AiChatStatus
{
    Success,
    Unauthorized,
    NotFound,
    RequiresPayment,
    Error
}

public sealed record AiChatMessageResult(
    AiChatStatus Status,
    string? Reply = null,
    string? ErrorMessage = null,
    int? ManualId = null)
{
    public bool IsSuccess => Status == AiChatStatus.Success;
}

public sealed record AiChatHistoryResult(
    AiChatStatus Status,
    IReadOnlyList<AiChatInteractionDto>? History = null,
    string? ErrorMessage = null)
{
    public bool IsSuccess => Status == AiChatStatus.Success;
}
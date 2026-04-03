namespace AspNetReactTemplate.Server.Services.Abstraction.Steps;

public enum StepsCommandStatus
{
    Success,
    Unauthorized
}

public sealed record StepsCommandResult(StepsCommandStatus Status)
{
    public bool IsSuccess => Status == StepsCommandStatus.Success;

    public static StepsCommandResult Success { get; } = new(StepsCommandStatus.Success);

    public static StepsCommandResult Unauthorized { get; } = new(StepsCommandStatus.Unauthorized);
}
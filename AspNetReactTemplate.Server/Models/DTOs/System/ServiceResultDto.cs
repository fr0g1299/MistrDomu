namespace AspNetReactTemplate.Server.Models.DTOs.System;

public record ServiceResultDto
{
    public bool IsSuccess { get; init; }
    public ServiceErrorType? ErrorType { get; init; }
    public List<string> Errors { get; init; } = new();

    public static ServiceResultDto Success() => new()
    {
        IsSuccess = true
    };

    public static ServiceResultDto Failure(ServiceErrorType errorType, string error) => new()
    {
        IsSuccess = false,
        ErrorType = errorType,
        Errors = new List<string> { error }
    };

    public static ServiceResultDto Failure(ServiceErrorType errorType, IEnumerable<string> errors) => new()
    {
        IsSuccess = false,
        ErrorType = errorType,
        Errors = errors.ToList()
    };
}

public record ServiceResultDto<T> : ServiceResultDto
{
    public T? Data { get; init; }

    public static ServiceResultDto<T> Success(T data) => new()
    {
        IsSuccess = true,
        Data = data
    };

    public new static ServiceResultDto<T> Failure(ServiceErrorType errorType, string error) => new()
    {
        IsSuccess = false,
        ErrorType = errorType,
        Errors = new List<string> { error }
    };

    public new static ServiceResultDto<T> Failure(ServiceErrorType errorType, IEnumerable<string> errors) => new()
    {
        IsSuccess = false,
        ErrorType = errorType,
        Errors = errors.ToList()
    };
}
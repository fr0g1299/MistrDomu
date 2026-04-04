namespace AspNetReactTemplate.Server.Models.DTOs.System;

public record ServiceResult
{
    public bool IsSuccess { get; init; }
    public ServiceErrorType? ErrorType { get; init; }
    public List<string> Errors { get; init; } = new();

    public static ServiceResult Success() => new()
    {
        IsSuccess = true
    };

    public static ServiceResult Failure(ServiceErrorType errorType, string error) => new()
    {
        IsSuccess = false,
        ErrorType = errorType,
        Errors = new List<string> { error }
    };

    public static ServiceResult Failure(ServiceErrorType errorType, IEnumerable<string> errors) => new()
    {
        IsSuccess = false,
        ErrorType = errorType,
        Errors = errors.ToList()
    };
}

public record ServiceResult<T> : ServiceResult
{
    public T? Data {get; init; } 

    public static ServiceResult<T> Success(T data) => new()
    {
        IsSuccess = true,
        Data = data
    };

    public new static ServiceResult<T> Failure(ServiceErrorType errorType, string error) => new()
    {
        IsSuccess = false,
        ErrorType = errorType,
        Errors = new List<string> { error }
    };

    public new static ServiceResult<T> Failure(ServiceErrorType errorType, IEnumerable<string> errors) => new()
    {
        IsSuccess = false,
        ErrorType = errorType,
        Errors = errors.ToList()
    };
}
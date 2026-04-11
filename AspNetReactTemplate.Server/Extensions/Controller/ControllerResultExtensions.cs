using AspNetReactTemplate.Server.Models.DTOs.System;
using Microsoft.AspNetCore.Mvc;

namespace AspNetReactTemplate.Server.Extensions.Controller;

public static class ControllerResultExtensions
{
    public static IActionResult ToActionResult(this ControllerBase controller, ServiceResultDto result, object? successPayload = null)
    {
        if (result.IsSuccess)
        {
            return successPayload is null ? controller.Ok(new { message = "OK" }) : controller.Ok(successPayload);
        }

        return ToErrorResult(controller, result);
    }

    public static IActionResult ToActionResult<T>(this ControllerBase controller, ServiceResultDto<T> result)
    {
        if (result.IsSuccess)
        {
            return controller.Ok(result.Data);
        }

        return ToErrorResult(controller, result);
    }

    private static IActionResult ToErrorResult(ControllerBase controller, ServiceResultDto result)
    {
        return result.ErrorType switch
        {
            ServiceErrorType.Validation => controller.BadRequest(new { errors = result.Errors }),
            ServiceErrorType.Forbidden => controller.Forbid(),
            ServiceErrorType.NotFound => controller.NotFound(new { errors = result.Errors }),
            _ => controller.StatusCode(StatusCodes.Status500InternalServerError, new { errors = result.Errors })
        };
    }
}


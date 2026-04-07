using AspNetReactTemplate.Server.Models.DTOs.System;

namespace AspNetReactTemplate.Server.Services.Abstraction.Identity.Edit;

public interface IEditUserService
{
    Task<ServiceResultDto> SetRoleAsync(string userId, string role);
}
using System.Security.Claims;
using AspNetReactTemplate.Server.Models.DTOs.System;

namespace AspNetReactTemplate.Server.Services.Abstraction.Identity.Edit;

public interface IEditUserService
{
    Task<ServiceResult> SetRoleAsync(ClaimsPrincipal currentUser, string userId, string role);
}
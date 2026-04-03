using System.Security.Claims;
using AspNetReactTemplate.Server.Models.DTOs.Identity;
using AspNetReactTemplate.Server.Models.DTOs.System;

namespace AspNetReactTemplate.Server.Services.Abstraction.Identity.Select;

public interface IUserSelectService
{
    public Task<ServiceResult<IList<UserListDto>>> SelectAsync(ClaimsPrincipal currentUser);

}
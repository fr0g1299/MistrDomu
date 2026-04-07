using AspNetReactTemplate.Server.Models.DTOs.Identity;
using AspNetReactTemplate.Server.Models.DTOs.System;

namespace AspNetReactTemplate.Server.Services.Abstraction.Identity.Select;

public interface IUserSelectService
{
    Task<ServiceResultDto<UserListPageDto>> SelectPageAsync(UserListQueryDto query);

}
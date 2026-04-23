using AspNetReactTemplate.Server.Models.DTOs.Identity;
using AspNetReactTemplate.Server.Models.DTOs.System;
using AspNetReactTemplate.Server.Models.Identity;

namespace AspNetReactTemplate.Server.Services.Abstraction.Identity.Select;

public interface IUserSelectService
{
    Task<ServiceResultDto<UserListPageDto>> SelectPageAsync(UserListQueryDto query);
    Task<User?> SelectAsync(int id, bool trackable = false);
    Task<IList<User>> GetUsersByRoles(IList<string> roles, int? companyId = null);

}
using System.Security.Claims;
using AspNetReactTemplate.Server.Models.DTOs.Identity;
using AspNetReactTemplate.Server.Models.DTOs.System;
using AspNetReactTemplate.Server.Models.Identity;
using AspNetReactTemplate.Server.Services.Abstraction.Identity.Select;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;

namespace AspNetReactTemplate.Server.Services.Implementation.Identity.Select;

public class UserSelectService : IUserSelectService
{
    private readonly UserManager<User> _userManager;
    private readonly IAuthorizationService _authorizationService;

    public UserSelectService(
        UserManager<User> userManager,
        IAuthorizationService authorizationService)
    {
        _userManager = userManager;
        _authorizationService = authorizationService;
    }

    public async Task<ServiceResult<IList<UserListDto>>> SelectAsync(ClaimsPrincipal currentUser)
    {
        if (currentUser.Identity is not { IsAuthenticated: true })
        {
            return ServiceResult<IList<UserListDto>>.Failure(ServiceErrorType.Forbidden, "Pro zobrazení uživatelů musíte být přihlášen.");
        }

        var authResult = await _authorizationService.AuthorizeAsync(currentUser, null, "CanViewUsers");
        if (!authResult.Succeeded)
        {
            return ServiceResult<IList<UserListDto>>.Failure(ServiceErrorType.Forbidden, "Nemáte oprávnění prohlížet seznam uživatelů.");
        }
        
        var users = _userManager.Users.ToList(); 

        var userList = new List<UserListDto>();

        foreach (var user in users)
        {

            var dto = new UserListDto
            {
                Id = user.Id,
                Username = user.UserName,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Email = user.Email,
                Phone = user.PhoneNumber,
                Roles = string.Join(", ", await _userManager.GetRolesAsync(user)),
            };

            userList.Add(dto);
        }

        return ServiceResult<IList<UserListDto>>.Success(userList);
    }
}
using System.Security.Claims;
using AspNetReactTemplate.Server.Models.DTOs.System;
using AspNetReactTemplate.Server.Models.Identity;
using AspNetReactTemplate.Server.Models.Identity.Enums;
using AspNetReactTemplate.Server.Services.Abstraction.Identity.Edit;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;

namespace AspNetReactTemplate.Server.Services.Implementation.Identity.Edit;

public class EditUserService : IEditUserService
{
    private readonly UserManager<User> _userManager;
    private readonly RoleManager<Role> _roleManager;
    private readonly SignInManager<User> _signInManager;
    private readonly IAuthorizationService _authorizationService;

    public EditUserService(
        UserManager<User> userManager,
        RoleManager<Role> roleManager,
        SignInManager<User> signInManager,
        IAuthorizationService authorizationService)
    {
        _userManager = userManager;
        _roleManager = roleManager;
        _signInManager = signInManager;
        _authorizationService = authorizationService;
    }

    public async Task<ServiceResult> SetRoleAsync(ClaimsPrincipal currentUser, string userId, string role)
    {
        if (string.IsNullOrWhiteSpace(role) || string.IsNullOrWhiteSpace(userId))
        {
            return ServiceResult.Failure(ServiceErrorType.Validation, "Operace se nezdařila.");
        }

        if (!Enum.TryParse<Roles>(role, ignoreCase: true, out var parsedRole))
        {
            return ServiceResult.Failure(ServiceErrorType.Validation, "Požadovaná role neexistuje.");
        }

        var normalizedRole = parsedRole.ToString();

        if (currentUser.Identity is not { IsAuthenticated: true })
        {
            return ServiceResult.Failure(ServiceErrorType.Forbidden, "Pro tuto akci musíte být přihlášen.");
        }

        var authorizationResult = await _authorizationService.AuthorizeAsync(
            currentUser,
            resource: null,
            policyName: $"CanSetRole[{normalizedRole}]");

        if (!authorizationResult.Succeeded)
        {
            return ServiceResult.Failure(ServiceErrorType.Forbidden, "Nemáte oprávnění přiřadit uživateli tuto roli.");
        }

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
        {
            return ServiceResult.Failure(ServiceErrorType.NotFound, "Uživatel nebyl nalezen.");
        }

        if (!await _roleManager.RoleExistsAsync(normalizedRole))
        {
            return ServiceResult.Failure(ServiceErrorType.Validation, "Požadovaná role neexistuje.");
        }

        var currentRoles = await _userManager.GetRolesAsync(user);

        if (currentRoles.Count == 1 && string.Equals(currentRoles[0], normalizedRole, StringComparison.OrdinalIgnoreCase))
        {
            return ServiceResult.Success();
        }

        if (currentRoles.Count > 0)
        {
            var removeResult = await _userManager.RemoveFromRolesAsync(user, currentRoles);
            if (!removeResult.Succeeded)
            {
                return ServiceResult.Failure(
                    ServiceErrorType.Failure,
                    "Operace se nezdařila.");
            }
        }

        var addResult = await _userManager.AddToRoleAsync(user, normalizedRole);
        if (!addResult.Succeeded)
        {
            if (currentRoles.Count > 0)
            {
                await _userManager.AddToRolesAsync(user, currentRoles);
            }

            return ServiceResult.Failure(
                ServiceErrorType.Failure,
                "Operace se nezdařila.");
        }

        if (string.Equals(currentUser.Identity.Name, user.UserName, StringComparison.OrdinalIgnoreCase))
        {
            await _signInManager.RefreshSignInAsync(user);
        }

        return ServiceResult.Success();
    }
}
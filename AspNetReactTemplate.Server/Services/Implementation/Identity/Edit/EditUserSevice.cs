using AspNetReactTemplate.Server.Models.DTOs.System;
using AspNetReactTemplate.Server.Models.Identity;
using AspNetReactTemplate.Server.Services.Abstraction.Identity.Edit;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace AspNetReactTemplate.Server.Services.Implementation.Identity.Edit;

public class EditUserService : IEditUserService
{
    private const string GenericFailureMessage = "Operace se nezdařila.";
    private const string RoleDoesNotExistMessage = "Požadovaná role neexistuje.";
    private const string UserNotFoundMessage = "Uživatel nebyl nalezen.";
    private const string ForbiddenRoleChangeMessage = "Nemáte oprávnění přiřadit uživateli tuto roli.";

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

    public async Task<ServiceResult> SetRoleAsync(string userId, string role)
    {
        if (string.IsNullOrWhiteSpace(role) || string.IsNullOrWhiteSpace(userId))
        {
            return ServiceResult.Failure(ServiceErrorType.Validation, GenericFailureMessage);
        }

        var requestedRole = role.Trim();

        var existingRole = await _roleManager.Roles
            .FirstOrDefaultAsync(r => r.Name != null && r.Name.ToLower() == requestedRole.ToLower());

        if (existingRole?.Name == null)
        {
            return ServiceResult.Failure(ServiceErrorType.Validation, RoleDoesNotExistMessage);
        }
        
        
        var actualUser = _signInManager.Context.User;
        if (actualUser.Identity is not { IsAuthenticated: true })
        {
            return ServiceResult.Failure(ServiceErrorType.Forbidden, ForbiddenRoleChangeMessage);
        }

        var normalizedRole = existingRole.Name;

        var authorizationResult = await _authorizationService.AuthorizeAsync(
            actualUser,
            resource: null,
            policyName: $"CanSetRole[{normalizedRole}]");

        if (!authorizationResult.Succeeded)
        {
            return ServiceResult.Failure(ServiceErrorType.Forbidden, ForbiddenRoleChangeMessage);
        }

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
        {
            return ServiceResult.Failure(ServiceErrorType.NotFound, UserNotFoundMessage);
        }


        var currentRoles = await _userManager.GetRolesAsync(user);

        if (currentRoles.Count == 1 &&
            string.Equals(currentRoles[0], normalizedRole, StringComparison.OrdinalIgnoreCase))
        {
            return ServiceResult.Success();
        }

        var rolesToRemove = currentRoles
            .Where(currentRole => !string.Equals(currentRole, normalizedRole, StringComparison.OrdinalIgnoreCase))
            .ToList();

        if (rolesToRemove.Count > 0)
        {
            var removeResult = await _userManager.RemoveFromRolesAsync(user, rolesToRemove);
            if (!removeResult.Succeeded)
            {
                return ServiceResult.Failure(ServiceErrorType.Failure, GenericFailureMessage);
            }
        }

        var alreadyInTargetRole = currentRoles
            .Any(currentRole => string.Equals(currentRole, normalizedRole, StringComparison.OrdinalIgnoreCase));

        if (!alreadyInTargetRole)
        {
            var addResult = await _userManager.AddToRoleAsync(user, normalizedRole);
            if (!addResult.Succeeded)
            {
                if (rolesToRemove.Count > 0)
                {
                    var rollbackResult = await _userManager.AddToRolesAsync(user, rolesToRemove);
                    if (!rollbackResult.Succeeded)
                    {
                        return ServiceResult.Failure(ServiceErrorType.Failure, GenericFailureMessage);
                    }
                }

                return ServiceResult.Failure(ServiceErrorType.Failure, GenericFailureMessage);
            }
        }

        if (string.Equals(actualUser.Identity?.Name, user.UserName, StringComparison.OrdinalIgnoreCase))
        {
            await _signInManager.RefreshSignInAsync(user);
        }

        return ServiceResult.Success();
    }
}
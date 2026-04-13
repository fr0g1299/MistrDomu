using AspNetReactTemplate.Server.Data;
using AspNetReactTemplate.Server.Infrastracture.Identity;
using AspNetReactTemplate.Server.Models.DTOs.Identity;
using AspNetReactTemplate.Server.Models.DTOs.System;
using AspNetReactTemplate.Server.Models.Identity;
using AspNetReactTemplate.Server.Services.Abstraction.Identity.Select;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace AspNetReactTemplate.Server.Services.Implementation.Identity.Select;

public class UserSelectService : IUserSelectService
{
    private const string MustBeSignedInMessage = "Pro zobrazení uživatelů musíte být přihlášen.";
    private const string SignedInUserNotFoundMessage = "Přihlášený uživatel nebyl nalezen.";
    private const string NotAllowedToSeeUsersMessage = "Nemáte oprávnění pro zobrazení uživatelů.";

    private readonly AppDbContext _dbContext;
    private readonly UserManager<User> _userManager;
    private readonly SignInManager<User> _signInManager;
    private readonly IAuthorizationService _authorizationService;

    public UserSelectService(
        AppDbContext dbContext,
        UserManager<User> userManager,
        SignInManager<User> signInManager,
        IAuthorizationService authorizationService)
    {
        _dbContext = dbContext;
        _userManager = userManager;
        _signInManager = signInManager;
        _authorizationService = authorizationService;
    }

    private async Task<ServiceResultDto> EnsureCanSeeAllUsersAsync()
    {
        var userPrincipal = _signInManager.Context.User;

        if (userPrincipal.Identity is not { IsAuthenticated: true })
        {
            return ServiceResultDto.Failure(ServiceErrorType.Forbidden, MustBeSignedInMessage);
        }

        var currentUserId = _userManager.GetUserId(userPrincipal);
        if (string.IsNullOrWhiteSpace(currentUserId))
        {
            return ServiceResultDto.Failure(ServiceErrorType.Validation, SignedInUserNotFoundMessage);
        }

        var authorizationResult = await _authorizationService.AuthorizeAsync(
            userPrincipal,
            AuthorizationPolicies.AdminOnly);
        if (!authorizationResult.Succeeded)
        {
            return ServiceResultDto.Failure(ServiceErrorType.Forbidden, NotAllowedToSeeUsersMessage);
        }

        return ServiceResultDto.Success();
    }

    public async Task<ServiceResultDto<UserListPageDto>> SelectPageAsync(UserListQueryDto queryDto)
    {
        var authCheck = await EnsureCanSeeAllUsersAsync();
        if (!authCheck.IsSuccess)
        {
            return ServiceResultDto<UserListPageDto>.Failure(
                authCheck.ErrorType ?? ServiceErrorType.Failure,
                authCheck.Errors);
        }

        var pageSize = Math.Clamp(queryDto.PageSize, 1, 100);
        var pageNumber = Math.Max(1, queryDto.Page);

        var query = _dbContext.Users.AsNoTracking();

        query = ApplyFilter(query, queryDto);
        query = ApplySorting(query, queryDto);

        var totalItems = await query.CountAsync();
        var totalPages = totalItems == 0
            ? 0
            : (int)Math.Ceiling(totalItems / (double)pageSize);

        if (totalPages > 0 && pageNumber > totalPages)
        {
            pageNumber = totalPages;
        }

        var users = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(u => new UserListDto
            {
                Id = u.Id,
                Username = u.UserName,
                FirstName = u.FirstName,
                LastName = u.LastName,
                Email = u.Email,
                Phone = u.PhoneNumber,
                Roles = string.Empty
            })
            .ToListAsync();

        await FillRolesAsync(users);

        var result = new UserListPageDto
        {
            Items = users,
            TotalItems = totalItems,
            TotalPages = totalPages,
            CurrentPage = totalItems == 0 ? 1 : pageNumber,
            PageSize = pageSize
        };

        return ServiceResultDto<UserListPageDto>.Success(result);
    }

    private IQueryable<User> ApplyFilter(IQueryable<User> query, UserListQueryDto queryDto)
    {
        var search = queryDto.Search?.Trim();
        if (!string.IsNullOrWhiteSpace(search))
        {
            var normalizedSearch = search.ToLowerInvariant();

            query = query.Where(u =>
                u.FirstName.ToLower().Contains(normalizedSearch) ||
                u.LastName.ToLower().Contains(normalizedSearch) ||
                (u.UserName ?? string.Empty).ToLower().Contains(normalizedSearch) ||
                (u.Email ?? string.Empty).ToLower().Contains(normalizedSearch) ||
                (u.PhoneNumber ?? string.Empty).ToLower().Contains(normalizedSearch));
        }

        var roleName = queryDto.Role?.Trim();
        if (!string.IsNullOrWhiteSpace(roleName))
        {
            query = query.Where(u =>
                _dbContext.UserRoles
                    .Where(ur => ur.UserId == u.Id)
                    .Join(
                        _dbContext.Roles,
                        ur => ur.RoleId,
                        r => r.Id,
                        (ur, r) => r.Name)
                    .Any(rn => rn == roleName));
        }

        return query;
    }

    private IQueryable<User> ApplySorting(IQueryable<User> query, UserListQueryDto queryDto)
    {
        var isDescending = string.Equals(
            queryDto.SortDirection.Trim(),
            "desc",
            StringComparison.OrdinalIgnoreCase);

        var sortBy = queryDto.SortBy.Trim().ToLowerInvariant();

        return sortBy switch
        {
            "role" => ApplyRoleSorting(query, isDescending),

            _ => isDescending
                ? query.OrderByDescending(u => u.LastName).ThenByDescending(u => u.FirstName)
                : query.OrderBy(u => u.LastName).ThenBy(u => u.FirstName)
        };
    }

    private IQueryable<User> ApplyRoleSorting(IQueryable<User> query, bool isDescending)
    {
        var projectedQuery = query.Select(u => new
        {
            User = u,
            PrimaryRole = _dbContext.UserRoles
                .Where(ur => ur.UserId == u.Id)
                .Join(
                    _dbContext.Roles,
                    ur => ur.RoleId,
                    r => r.Id,
                    (ur, r) => r.Name ?? string.Empty)
                .OrderBy(roleName => roleName)
                .FirstOrDefault() ?? string.Empty
        });

        return isDescending
            ? projectedQuery
                .OrderByDescending(x => x.PrimaryRole)
                .ThenByDescending(x => x.User.LastName)
                .ThenByDescending(x => x.User.FirstName)
                .Select(x => x.User)
            : projectedQuery
                .OrderBy(x => x.PrimaryRole)
                .ThenBy(x => x.User.LastName)
                .ThenBy(x => x.User.FirstName)
                .Select(x => x.User);
    }

    private async Task FillRolesAsync(List<UserListDto> users)
    {
        var userIds = users.Select(u => u.Id).ToList();
        if (userIds.Count == 0)
        {
            return;
        }

        var roleRows = await _dbContext.UserRoles
            .Where(ur => userIds.Contains(ur.UserId))
            .Join(
                _dbContext.Roles,
                ur => ur.RoleId,
                r => r.Id,
                (ur, r) => new
                {
                    ur.UserId,
                    RoleName = r.Name ?? string.Empty
                })
            .ToListAsync();

        var roleMap = roleRows
            .GroupBy(x => x.UserId)
            .ToDictionary(
                g => g.Key,
                g => string.Join(", ", g.Select(x => x.RoleName).Distinct().OrderBy(x => x)));

        foreach (var user in users)
        {
            user.Roles = roleMap.TryGetValue(user.Id, out var roles)
                ? roles
                : string.Empty;
        }
    }
}
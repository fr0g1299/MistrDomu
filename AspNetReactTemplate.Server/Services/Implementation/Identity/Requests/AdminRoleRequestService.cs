using AspNetReactTemplate.Server.Data;
using AspNetReactTemplate.Server.Infrastracture.Identity;
using AspNetReactTemplate.Server.Models.DTOs.Identity;
using AspNetReactTemplate.Server.Models.DTOs.System;
using AspNetReactTemplate.Server.Models.Identity;
using AspNetReactTemplate.Server.Models.Identity.Enums;
using AspNetReactTemplate.Server.Services.Abstraction.Identity;
using AspNetReactTemplate.Server.Services.Abstraction.Identity.Edit;
using AspNetReactTemplate.Server.Services.Abstraction.Identity.Requests;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace AspNetReactTemplate.Server.Services.Implementation.Identity.Requests;

public class AdminRoleRequestService : IAdminRoleRequestService
{
    private const string MustBeSignedInMessage = "Pro tuto akci musíte být přihlášen.";
    private const string RequestNotFoundMessage = "Žádost nebyla nalezena.";
    private const string RequestAlreadyProcessedMessage = "Žádost už byla zpracována.";
    private const string ForbiddenMessage = "Nemáte oprávnění pro tuto akci.";

    private readonly AppDbContext _dbContext;
    private readonly SignInManager<User> _signInManager;
    private readonly ICurrentUserAccessor _currentUserAccessor;
    private readonly IAuthorizationService _authorizationService;
    private readonly IEditUserService _editUserService;
    private readonly IRoleRequestNotificationService _roleRequestNotificationService;

    public AdminRoleRequestService(
        AppDbContext dbContext,
        SignInManager<User> signInManager,
        ICurrentUserAccessor currentUserAccessor,
        IAuthorizationService authorizationService,
        IEditUserService editUserService,
        IRoleRequestNotificationService roleRequestNotificationService)
    {
        _dbContext = dbContext;
        _signInManager = signInManager;
        _currentUserAccessor = currentUserAccessor;
        _authorizationService = authorizationService;
        _editUserService = editUserService;
        _roleRequestNotificationService = roleRequestNotificationService;
    }

    public async Task<ServiceResultDto<RoleRequestAdminPageDto>> GetPendingExpertRequestsAsync(RoleRequestListQueryDto queryDto)
    {
        var principal = _signInManager.Context.User;
        var authResult = await _authorizationService.AuthorizeAsync(principal, AuthorizationPolicies.AdminOnly);
        if (!authResult.Succeeded)
        {
            return ServiceResultDto<RoleRequestAdminPageDto>.Failure(ServiceErrorType.Forbidden, ForbiddenMessage);
        }

        var page = queryDto.Page <= 0 ? 1 : queryDto.Page;
        var pageSize = queryDto.PageSize <= 0 ? 10 : queryDto.PageSize;

        var statusFilter = queryDto.Status?.Trim().ToLowerInvariant() ?? "pending";

        var baseQuery = _dbContext.RoleRequests
            .AsNoTracking()
            .Where(r => r.RequestedRole == Roles.Expert.ToString());

        baseQuery = statusFilter switch
        {
            "all" => baseQuery,
            "approved" => baseQuery.Where(r => r.Status == RoleRequestStatus.Approved),
            "rejected" => baseQuery.Where(r => r.Status == RoleRequestStatus.Rejected),
            "closed" => baseQuery.Where(r => r.Status != RoleRequestStatus.Pending),
            _ => baseQuery.Where(r => r.Status == RoleRequestStatus.Pending)
        };

        var totalItems = await baseQuery.CountAsync();

        if (totalItems == 0)
        {
            return ServiceResultDto<RoleRequestAdminPageDto>.Success(new RoleRequestAdminPageDto
            {
                Items = new List<RoleRequestAdminListItemDto>(),
                CurrentPage = page,
                PageSize = pageSize,
                TotalItems = 0,
                TotalPages = 0
            });
        }

        var totalPages = (int)Math.Ceiling(totalItems / (double)pageSize);
        if (page > totalPages)
        {
            page = totalPages;
        }

        var requests = await baseQuery
            .Include(r => r.User)
            .OrderByDescending(r => r.RequestedAtUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(r => new RoleRequestAdminListItemDto
            {
                Id = r.Id,
                UserId = r.UserId,
                UserName = string.Join(" ", new[] { r.User.FirstName, r.User.LastName }.Where(x => !string.IsNullOrWhiteSpace(x))).Trim(),
                Email = r.User.Email,
                UserNote = r.UserNote,
                RequestedAtUtc = r.RequestedAtUtc,
                Status = r.Status.ToString(),
                ReviewedAtUtc = r.ReviewedAtUtc,
                AdminNote = r.AdminNote
            })
            .ToListAsync();

        return ServiceResultDto<RoleRequestAdminPageDto>.Success(new RoleRequestAdminPageDto
        {
            Items = requests,
            CurrentPage = page,
            PageSize = pageSize,
            TotalItems = totalItems,
            TotalPages = totalPages
        });
    }

    public async Task<ServiceResultDto<int>> GetPendingExpertRequestCountAsync()
    {
        var principal = _signInManager.Context.User;
        var authResult = await _authorizationService.AuthorizeAsync(principal, AuthorizationPolicies.AdminOnly);
        if (!authResult.Succeeded)
        {
            return ServiceResultDto<int>.Failure(ServiceErrorType.Forbidden, ForbiddenMessage);
        }

        return ServiceResultDto<int>.Success(await GetPendingCountAsync());
    }

    public async Task<ServiceResultDto> ApproveExpertRequestAsync(int requestId, string? note)
    {
        var reviewer = await _currentUserAccessor.GetCurrentUserAsync();
        if (reviewer == null)
        {
            return ServiceResultDto.Failure(ServiceErrorType.Forbidden, MustBeSignedInMessage);
        }

        var authResult = await _authorizationService.AuthorizeAsync(_signInManager.Context.User, AuthorizationPolicies.AdminOnly);
        if (!authResult.Succeeded)
        {
            return ServiceResultDto.Failure(ServiceErrorType.Forbidden, ForbiddenMessage);
        }

        var request = await _dbContext.RoleRequests.FirstOrDefaultAsync(r => r.Id == requestId);
        if (request == null)
        {
            return ServiceResultDto.Failure(ServiceErrorType.NotFound, RequestNotFoundMessage);
        }

        if (request.Status != RoleRequestStatus.Pending)
        {
            return ServiceResultDto.Failure(ServiceErrorType.Validation, RequestAlreadyProcessedMessage);
        }

        var setRoleResult = await _editUserService.SetRoleAsync(request.UserId.ToString(), Roles.Expert.ToString());
        if (!setRoleResult.IsSuccess)
        {
            return setRoleResult;
        }

        request.Status = RoleRequestStatus.Approved;
        request.ReviewedAtUtc = DateTime.UtcNow;
        request.ReviewedByUserId = reviewer.Id;
        request.AdminNote = string.IsNullOrWhiteSpace(note) ? null : note.Trim();

        await _dbContext.SaveChangesAsync();
        await _roleRequestNotificationService.NotifyRequestUpdatedAsync(request);

        return ServiceResultDto.Success();
    }

    public async Task<ServiceResultDto> RejectExpertRequestAsync(int requestId, string? note)
    {
        var reviewer = await _currentUserAccessor.GetCurrentUserAsync();
        if (reviewer == null)
        {
            return ServiceResultDto.Failure(ServiceErrorType.Forbidden, MustBeSignedInMessage);
        }

        var authResult = await _authorizationService.AuthorizeAsync(_signInManager.Context.User, AuthorizationPolicies.AdminOnly);
        if (!authResult.Succeeded)
        {
            return ServiceResultDto.Failure(ServiceErrorType.Forbidden, ForbiddenMessage);
        }

        var request = await _dbContext.RoleRequests.FirstOrDefaultAsync(r => r.Id == requestId);
        if (request == null)
        {
            return ServiceResultDto.Failure(ServiceErrorType.NotFound, RequestNotFoundMessage);
        }

        if (request.Status != RoleRequestStatus.Pending)
        {
            return ServiceResultDto.Failure(ServiceErrorType.Validation, RequestAlreadyProcessedMessage);
        }

        request.Status = RoleRequestStatus.Rejected;
        request.ReviewedAtUtc = DateTime.UtcNow;
        request.ReviewedByUserId = reviewer.Id;
        request.AdminNote = string.IsNullOrWhiteSpace(note) ? null : note.Trim();

        await _dbContext.SaveChangesAsync();
        await _roleRequestNotificationService.NotifyRequestUpdatedAsync(request);

        return ServiceResultDto.Success();
    }

    public async Task<ServiceResultDto> UpdateExpertRoleRequestNoteAsync(int requestId, string? note)
    {
        var reviewer = await _currentUserAccessor.GetCurrentUserAsync();
        if (reviewer == null)
        {
            return ServiceResultDto.Failure(ServiceErrorType.Forbidden, MustBeSignedInMessage);
        }

        var authResult = await _authorizationService.AuthorizeAsync(_signInManager.Context.User, AuthorizationPolicies.AdminOnly);
        if (!authResult.Succeeded)
        {
            return ServiceResultDto.Failure(ServiceErrorType.Forbidden, ForbiddenMessage);
        }

        var request = await _dbContext.RoleRequests.FirstOrDefaultAsync(r => r.Id == requestId);
        if (request == null)
        {
            return ServiceResultDto.Failure(ServiceErrorType.NotFound, RequestNotFoundMessage);
        }

        request.AdminNote = string.IsNullOrWhiteSpace(note) ? null : note.Trim();

        await _dbContext.SaveChangesAsync();
        await _roleRequestNotificationService.NotifyRequestUpdatedAsync(request);

        return ServiceResultDto.Success();
    }

    private async Task<int> GetPendingCountAsync()
    {
        return await _dbContext.RoleRequests.CountAsync(r =>
            r.Status == RoleRequestStatus.Pending &&
            r.RequestedRole == Roles.Expert.ToString());
    }

}

using AspNetReactTemplate.Server.Data;
using AspNetReactTemplate.Server.Models.DTOs.Identity;
using AspNetReactTemplate.Server.Models.DTOs.System;
using AspNetReactTemplate.Server.Models.Identity;
using AspNetReactTemplate.Server.Models.Identity.Enums;
using AspNetReactTemplate.Server.Services.Abstraction.Identity;
using AspNetReactTemplate.Server.Services.Abstraction.Identity.Requests;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using IdentityRoleRequest = AspNetReactTemplate.Server.Models.Identity.RoleRequest;

namespace AspNetReactTemplate.Server.Services.Implementation.Identity.Requests;

public class UserRoleRequestService : IUserRoleRequestService
{
    private const string MustBeSignedInMessage = "Pro tuto akci musíte být přihlášen.";
    private const string RequestAlreadyPendingMessage = "Žádost o roli Expert už čeká na vyřízení.";
    private const string AlreadyExpertMessage = "Roli Expert už máte přidělenou.";
    private const string AdminCannotRequestExpertRoleMessage = "Administrátor nemůže žádat o roli Expert.";
    private const string RequestNotFoundMessage = "Žádost nebyla nalezena.";
    private const string UnsupportedRequestTypeMessage = "Nepodporovaný typ žádosti.";

    private readonly AppDbContext _dbContext;
    private readonly UserManager<User> _userManager;
    private readonly ICurrentUserAccessor _currentUserAccessor;
    private readonly IRoleRequestNotificationService _roleRequestNotificationService;

    public UserRoleRequestService(
        AppDbContext dbContext,
        UserManager<User> userManager,
        ICurrentUserAccessor currentUserAccessor,
        IRoleRequestNotificationService roleRequestNotificationService)
    {
        _dbContext = dbContext;
        _userManager = userManager;
        _currentUserAccessor = currentUserAccessor;
        _roleRequestNotificationService = roleRequestNotificationService;
    }

    public async Task<ServiceResultDto<RoleRequestSummaryDto>> CreateExpertRequestAsync()
    {
        return await CreateRoleRequestAsync(new CreateRoleRequestDto
        {
            RequestType = Roles.Expert.ToString(),
            Description = null
        });
    }

    public async Task<ServiceResultDto<RoleRequestSummaryDto>> CreateRoleRequestAsync(CreateRoleRequestDto dto)
    {
        var currentUser = await _currentUserAccessor.GetCurrentUserAsync();
        if (currentUser == null)
        {
            return ServiceResultDto<RoleRequestSummaryDto>.Failure(ServiceErrorType.Forbidden, MustBeSignedInMessage);
        }

        var normalizedType = NormalizeRequestType(dto.RequestType);
        if (normalizedType == null)
        {
            return ServiceResultDto<RoleRequestSummaryDto>.Failure(ServiceErrorType.Validation, UnsupportedRequestTypeMessage);
        }

        var userRoles = await _userManager.GetRolesAsync(currentUser);
        if (userRoles.Any(r => string.Equals(r, Roles.Admin.ToString(), StringComparison.OrdinalIgnoreCase)))
        {
            return ServiceResultDto<RoleRequestSummaryDto>.Failure(ServiceErrorType.Forbidden, AdminCannotRequestExpertRoleMessage);
        }

        if (userRoles.Any(r => string.Equals(r, Roles.Expert.ToString(), StringComparison.OrdinalIgnoreCase)))
        {
            return ServiceResultDto<RoleRequestSummaryDto>.Failure(ServiceErrorType.Validation, AlreadyExpertMessage);
        }

        var hasPendingRequest = await _dbContext.RoleRequests.AnyAsync(r =>
            r.UserId == currentUser.Id &&
            r.Status == RoleRequestStatus.Pending &&
            r.RequestedRole == normalizedType);

        if (hasPendingRequest)
        {
            return ServiceResultDto<RoleRequestSummaryDto>.Failure(ServiceErrorType.Validation, RequestAlreadyPendingMessage);
        }

        var request = new IdentityRoleRequest
        {
            UserId = currentUser.Id,
            RequestedRole = normalizedType,
            Status = RoleRequestStatus.Pending,
            RequestedAtUtc = DateTime.UtcNow,
            UserNote = string.IsNullOrWhiteSpace(dto.Description) ? null : dto.Description.Trim()
        };

        _dbContext.RoleRequests.Add(request);
        await _dbContext.SaveChangesAsync();

        await _roleRequestNotificationService.NotifyNewRequestAsync(currentUser, request.UserNote);

        return ServiceResultDto<RoleRequestSummaryDto>.Success(MapSummary(request));
    }

    public async Task<ServiceResultDto<RoleRequestUserPageDto>> GetMyRoleRequestsAsync(RoleRequestListQueryDto queryDto)
    {
        var currentUser = await _currentUserAccessor.GetCurrentUserAsync();
        if (currentUser == null)
        {
            return ServiceResultDto<RoleRequestUserPageDto>.Failure(ServiceErrorType.Forbidden, MustBeSignedInMessage);
        }

        var page = queryDto.Page <= 0 ? 1 : queryDto.Page;
        var pageSize = queryDto.PageSize <= 0 ? 10 : queryDto.PageSize;

        var baseQuery = _dbContext.RoleRequests
            .AsNoTracking()
            .Where(r => r.UserId == currentUser.Id);

        var statusFilter = queryDto.Status?.Trim().ToLowerInvariant() ?? "all";
        baseQuery = statusFilter switch
        {
            "pending" => baseQuery.Where(r => r.Status == RoleRequestStatus.Pending),
            "approved" => baseQuery.Where(r => r.Status == RoleRequestStatus.Approved),
            "rejected" => baseQuery.Where(r => r.Status == RoleRequestStatus.Rejected),
            "closed" => baseQuery.Where(r => r.Status != RoleRequestStatus.Pending),
            _ => baseQuery
        };

        var totalItems = await baseQuery.CountAsync();
        if (totalItems == 0)
        {
            return ServiceResultDto<RoleRequestUserPageDto>.Success(new RoleRequestUserPageDto
            {
                Items = new List<RoleRequestUserListItemDto>(),
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

        var items = await baseQuery
            .OrderByDescending(r => r.RequestedAtUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(r => new RoleRequestUserListItemDto
            {
                Id = r.Id,
                RequestType = r.RequestedRole,
                Status = r.Status.ToString(),
                RequestedAtUtc = r.RequestedAtUtc,
                ReviewedAtUtc = r.ReviewedAtUtc
            })
            .ToListAsync();

        return ServiceResultDto<RoleRequestUserPageDto>.Success(new RoleRequestUserPageDto
        {
            Items = items,
            CurrentPage = page,
            PageSize = pageSize,
            TotalItems = totalItems,
            TotalPages = totalPages
        });
    }

    public async Task<ServiceResultDto<RoleRequestUserDetailDto>> GetMyRoleRequestDetailAsync(int requestId)
    {
        var currentUser = await _currentUserAccessor.GetCurrentUserAsync();
        if (currentUser == null)
        {
            return ServiceResultDto<RoleRequestUserDetailDto>.Failure(ServiceErrorType.Forbidden, MustBeSignedInMessage);
        }

        var request = await _dbContext.RoleRequests
            .AsNoTracking()
            .Where(r => r.Id == requestId && r.UserId == currentUser.Id)
            .Select(r => new RoleRequestUserDetailDto
            {
                Id = r.Id,
                RequestType = r.RequestedRole,
                Status = r.Status.ToString(),
                RequestedAtUtc = r.RequestedAtUtc,
                ReviewedAtUtc = r.ReviewedAtUtc,
                Description = r.UserNote,
                AdminNote = r.AdminNote
            })
            .FirstOrDefaultAsync();

        if (request == null)
        {
            return ServiceResultDto<RoleRequestUserDetailDto>.Failure(ServiceErrorType.NotFound, RequestNotFoundMessage);
        }

        return ServiceResultDto<RoleRequestUserDetailDto>.Success(request);
    }

    public async Task<ServiceResultDto<RoleRequestSummaryDto>> GetMyLatestExpertRequestAsync()
    {
        var currentUser = await _currentUserAccessor.GetCurrentUserAsync();
        if (currentUser == null)
        {
            return ServiceResultDto<RoleRequestSummaryDto>.Failure(ServiceErrorType.Forbidden, MustBeSignedInMessage);
        }

        var request = await _dbContext.RoleRequests
            .AsNoTracking()
            .Where(r => r.UserId == currentUser.Id && r.RequestedRole == Roles.Expert.ToString())
            .OrderByDescending(r => r.RequestedAtUtc)
            .FirstOrDefaultAsync();

        if (request == null)
        {
            return ServiceResultDto<RoleRequestSummaryDto>.Failure(ServiceErrorType.NotFound, RequestNotFoundMessage);
        }

        return ServiceResultDto<RoleRequestSummaryDto>.Success(MapSummary(request));
    }

    private static RoleRequestSummaryDto MapSummary(IdentityRoleRequest request)
    {
        return new RoleRequestSummaryDto
        {
            Id = request.Id,
            RequestedRole = request.RequestedRole,
            Status = request.Status.ToString(),
            RequestedAtUtc = request.RequestedAtUtc,
            ReviewedAtUtc = request.ReviewedAtUtc,
            UserNote = request.UserNote,
            AdminNote = request.AdminNote
        };
    }

    private static string? NormalizeRequestType(string? requestType)
    {
        var value = requestType?.Trim();
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        return value.Equals("expert", StringComparison.OrdinalIgnoreCase) ||
               value.Equals("expertrole", StringComparison.OrdinalIgnoreCase) ||
               value.Equals(Roles.Expert.ToString(), StringComparison.OrdinalIgnoreCase)
            ? Roles.Expert.ToString()
            : null;
    }
}

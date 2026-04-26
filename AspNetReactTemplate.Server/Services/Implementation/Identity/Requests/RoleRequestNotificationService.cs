using AspNetReactTemplate.Server.Data;
using AspNetReactTemplate.Server.Extensions.Notification;
using AspNetReactTemplate.Server.Models.Identity;
using AspNetReactTemplate.Server.Models.Identity.Enums;
using AspNetReactTemplate.Server.Services.Abstraction.Identity.Requests;
using AspNetReactTemplate.Server.Services.Abstraction.Notifications;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace AspNetReactTemplate.Server.Services.Implementation.Identity.Requests;

public class RoleRequestNotificationService : IRoleRequestNotificationService
{
    private readonly AppDbContext _dbContext;
    private readonly UserManager<User> _userManager;
    private readonly IEmailNotificationService _emailNotificationService;
    private readonly INotificationService _notificationService;
    private readonly IRoleRequestNotificationTexts _notificationTexts;
    private readonly ILogger<RoleRequestNotificationService> _logger;

    public RoleRequestNotificationService(
        AppDbContext dbContext,
        UserManager<User> userManager,
        IEmailNotificationService emailNotificationService,
        ILogger<RoleRequestNotificationService> logger,
        IRoleRequestNotificationTexts notificationTexts,
        INotificationService notificationService
        )
    {
        _dbContext = dbContext;
        _userManager = userManager;
        _emailNotificationService = emailNotificationService;
        _notificationTexts = notificationTexts;
        _logger = logger;
        _notificationService = notificationService;
    }

    public async Task NotifyNewRequestAsync(User currentUser, string? userNote)
    {
        var adminIds = (await _userManager.GetUsersInRoleAsync(Roles.Admin.ToString())).Select(x => x.Id).ToList();

        if (adminIds.Count == 0)
        {
            return;
        }

        var displayName = string.Join(" ", new[] { currentUser.FirstName, currentUser.LastName }
            .Where(x => !string.IsNullOrWhiteSpace(x))).Trim();
        if (string.IsNullOrWhiteSpace(displayName))
        {
            displayName = currentUser.UserName ?? $"Uživatel #{currentUser.Id}";
        }

        try
        {
            await _notificationService.CreateForUsersAsync(
                adminIds,
                RoleRequestNotificationTexts.RoleRequestAdmin,
                RoleRequestNotificationTexts.NewRequestTitle,
                RoleRequestNotificationTexts.BuildNewRequestMessage(displayName));
        }
        catch (Exception exception)
        {
            _logger.LogWarning(
                exception,
                "Failed to create admin in-app notification for new role request. RequestUserId: {UserId}",
                currentUser.Id);
        }

        try
        {
            var pendingCount = await _dbContext.RoleRequests.CountAsync(r =>
                r.Status == RoleRequestStatus.Pending &&
                r.RequestedRole == Roles.Expert.ToString());

            await _emailNotificationService.SendNewRoleRequestToAdminsAsync(
                displayName,
                currentUser.Email,
                userNote,
                pendingCount);
        }
        catch (Exception exception)
        {
            _logger.LogWarning(
                exception,
                "Failed to queue admin email for new role request. RequestUserId: {UserId}",
                currentUser.Id);
        }
    }

    public async Task NotifyRequestUpdatedAsync(RoleRequest request)
    {
        var requester = await _dbContext.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(user => user.Id == request.UserId);

        if (requester == null)
        {
            return;
        }

        var  message = await _notificationTexts.BuildUserUpdatedMessage(request.Status);

        try
        {
            await _notificationService.CreateForUserAsync(
                request.UserId,
                RoleRequestNotificationTexts.RoleRequestUser,
                RoleRequestNotificationTexts.UserUpdatedTitle,
                 message);
        }
        catch (Exception exception)
        {
            _logger.LogWarning(
                exception,
                "Failed to create in-app notification for role request update. RequestId: {RequestId}, UserId: {UserId}, Status: {Status}",
                request.Id,
                request.UserId,
                request.Status);
        }

        try
        {
            await _emailNotificationService.SendRoleRequestUpdatedToUserAsync(
                requester.Id,
                request.Status,
                request.AdminNote);
        }
        catch (Exception exception)
        {
            _logger.LogWarning(
                exception,
                "Failed to send role request update email. RequestId: {RequestId}, UserId: {UserId}, Status: {Status}",
                request.Id,
                requester.Id,
                request.Status);
        }
    }
}


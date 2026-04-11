using AspNetReactTemplate.Server.Data;
using AspNetReactTemplate.Server.Models.DTOs.Notifications;
using AspNetReactTemplate.Server.Models.DTOs.System;
using AspNetReactTemplate.Server.Models.Identity;
using AspNetReactTemplate.Server.Services.Abstraction.Identity;
using AspNetReactTemplate.Server.Services.Abstraction.Notifications;
using Microsoft.EntityFrameworkCore;

namespace AspNetReactTemplate.Server.Services.Implementation.Notifications;

public class NotificationService : INotificationService
{
    private const string MustBeSignedInMessage = "Pro tuto akci musíte být přihlášen.";
    private const string NotificationNotFoundMessage = "Notifikace nebyla nalezena.";

    private readonly AppDbContext _dbContext;
    private readonly ICurrentUserAccessor _currentUserAccessor;

    public NotificationService(
        AppDbContext dbContext,
        ICurrentUserAccessor currentUserAccessor)
    {
        _dbContext = dbContext;
        _currentUserAccessor = currentUserAccessor;
    }

    public async Task<ServiceResultDto<NotificationPageDto>> GetMyNotificationsAsync(NotificationListQueryDto queryDto)
    {
        var currentUser = await _currentUserAccessor.GetCurrentUserAsync();
        if (currentUser == null)
        {
            return ServiceResultDto<NotificationPageDto>.Failure(ServiceErrorType.Forbidden, MustBeSignedInMessage);
        }

        var page = queryDto.Page <= 0 ? 1 : queryDto.Page;
        var pageSize = queryDto.PageSize <= 0 ? 20 : queryDto.PageSize;

        var baseQuery = _dbContext.Notifications
            .AsNoTracking()
            .Where(n => n.UserId == currentUser.Id);

        if (queryDto.UnreadOnly)
        {
            baseQuery = baseQuery.Where(n => !n.IsRead);
        }

        var totalItems = await baseQuery.CountAsync();
        var unreadCount = await _dbContext.Notifications.CountAsync(n => n.UserId == currentUser.Id && !n.IsRead);

        if (totalItems == 0)
        {
            return ServiceResultDto<NotificationPageDto>.Success(new NotificationPageDto
            {
                Items = new List<NotificationListItemDto>(),
                CurrentPage = page,
                PageSize = pageSize,
                TotalItems = 0,
                TotalPages = 0,
                UnreadCount = unreadCount
            });
        }

        var totalPages = (int)Math.Ceiling(totalItems / (double)pageSize);
        if (page > totalPages)
        {
            page = totalPages;
        }

        var items = await baseQuery
            .OrderByDescending(n => n.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(n => new NotificationListItemDto
            {
                Id = n.Id,
                Type = n.Type,
                Title = n.Title,
                Message = n.Message,
                IsRead = n.IsRead
            })
            .ToListAsync();

        return ServiceResultDto<NotificationPageDto>.Success(new NotificationPageDto
        {
            Items = items,
            CurrentPage = page,
            PageSize = pageSize,
            TotalItems = totalItems,
            TotalPages = totalPages,
            UnreadCount = unreadCount
        });
    }

    public async Task<ServiceResultDto> MarkAsReadAsync(int notificationId)
    {
        var currentUser = await _currentUserAccessor.GetCurrentUserAsync();
        if (currentUser == null)
        {
            return ServiceResultDto.Failure(ServiceErrorType.Forbidden, MustBeSignedInMessage);
        }

        var notification = await _dbContext.Notifications
            .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == currentUser.Id);

        if (notification == null)
        {
            return ServiceResultDto.Failure(ServiceErrorType.NotFound, NotificationNotFoundMessage);
        }

        if (!notification.IsRead)
        {
            notification.IsRead = true;
            await _dbContext.SaveChangesAsync();
        }

        return ServiceResultDto.Success();
    }

    public async Task<ServiceResultDto> MarkAllAsReadAsync()
    {
        var currentUser = await _currentUserAccessor.GetCurrentUserAsync();
        if (currentUser == null)
        {
            return ServiceResultDto.Failure(ServiceErrorType.Forbidden, MustBeSignedInMessage);
        }

        var unreadItems = await _dbContext.Notifications
            .Where(n => n.UserId == currentUser.Id && !n.IsRead)
            .ToListAsync();

        if (unreadItems.Count == 0)
        {
            return ServiceResultDto.Success();
        }

        foreach (var item in unreadItems)
        {
            item.IsRead = true;
        }

        await _dbContext.SaveChangesAsync();
        return ServiceResultDto.Success();
    }

    public async Task<ServiceResultDto> DeleteMyNotificationAsync(int notificationId)
    {
        var currentUser = await _currentUserAccessor.GetCurrentUserAsync();
        if (currentUser == null)
        {
            return ServiceResultDto.Failure(ServiceErrorType.Forbidden, MustBeSignedInMessage);
        }

        var notification = await _dbContext.Notifications
            .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == currentUser.Id);

        if (notification == null)
        {
            return ServiceResultDto.Failure(ServiceErrorType.NotFound, NotificationNotFoundMessage);
        }

        _dbContext.Notifications.Remove(notification);
        await _dbContext.SaveChangesAsync();

        return ServiceResultDto.Success();
    }

    public async Task<ServiceResultDto> DeleteAllMyNotificationsAsync()
    {
        var currentUser = await _currentUserAccessor.GetCurrentUserAsync();
        if (currentUser == null)
        {
            return ServiceResultDto.Failure(ServiceErrorType.Forbidden, MustBeSignedInMessage);
        }

        var items = await _dbContext.Notifications
            .Where(n => n.UserId == currentUser.Id)
            .ToListAsync();

        if (items.Count == 0)
        {
            return ServiceResultDto.Success();
        }

        _dbContext.Notifications.RemoveRange(items);
        await _dbContext.SaveChangesAsync();

        return ServiceResultDto.Success();
    }

    public async Task CreateForUserAsync(int userId, string type, string title, string message)
    {
        var notification = new Notification
        {
            UserId = userId,
            Type = type,
            Title = title,
            Message = message,
            IsRead = false
        };

        _dbContext.Notifications.Add(notification);
        await _dbContext.SaveChangesAsync();
    }

    public async Task CreateForUsersAsync(IEnumerable<int> userIds, string type, string title, string message)
    {
        var targetUserIds = userIds.Distinct().ToList();
        if (targetUserIds.Count == 0)
        {
            return;
        }

        var notifications = targetUserIds.Select(userId => new Notification
        {
            UserId = userId,
            Type = type,
            Title = title,
            Message = message,
            IsRead = false
        }).ToList();

        _dbContext.Notifications.AddRange(notifications);
        await _dbContext.SaveChangesAsync();
    }
}


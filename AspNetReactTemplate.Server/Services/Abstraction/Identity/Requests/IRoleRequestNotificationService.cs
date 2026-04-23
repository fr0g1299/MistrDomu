using AspNetReactTemplate.Server.Models.Identity;

namespace AspNetReactTemplate.Server.Services.Abstraction.Identity.Requests;

public interface IRoleRequestNotificationService
{
    Task NotifyNewRequestAsync(User currentUser, string? userNote);
    Task NotifyRequestUpdatedAsync(RoleRequest request);
}


using AspNetReactTemplate.Server.Models.Identity;

namespace AspNetReactTemplate.Server.Services.Abstraction.Identity;

public interface ICurrentUserAccessor
{
    Task<User?> GetCurrentUserAsync();
}


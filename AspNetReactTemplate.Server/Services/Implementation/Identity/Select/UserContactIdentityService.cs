using AspNetReactTemplate.Server.Services.Abstraction.Identity.Select;

namespace AspNetReactTemplate.Server.Services.Implementation.Identity.Select;

public class UserContactIdentityService : IUserContactIdentityService
{
    private readonly IUserSelectService _userQueryIdentityService;

    public UserContactIdentityService(IUserSelectService userQueryIdentityService)
    {
        _userQueryIdentityService = userQueryIdentityService;
    }
    
    public async Task<string?> GetEmailByIdAsync(int id)
    {
        var user = await _userQueryIdentityService.SelectAsync(id);
        return user?.Email?.Trim();
    }

    public async Task<IList<string>> GetEmailByRolesAsync(IList<string> roles)
    {
        ArgumentNullException.ThrowIfNull(roles);

        var normalizedRoles = roles
            .Where(role => !string.IsNullOrWhiteSpace(role))
            .Select(role => role.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        if (normalizedRoles.Count == 0)
        {
            return new List<string>();
        }

        var users = await _userQueryIdentityService.GetUsersByRoles(normalizedRoles);
        return users
            .Select(user => user.Email)
            .Where(email => !string.IsNullOrWhiteSpace(email))
            .Select(email => email!.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    
}
using AspNetReactTemplate.Server.Models.Identity;
using AspNetReactTemplate.Server.Services.Abstraction.Identity;
using Microsoft.AspNetCore.Identity;

namespace AspNetReactTemplate.Server.Services.Implementation.Identity.Auth;

public class CurrentUserAccessor : ICurrentUserAccessor
{
    private readonly UserManager<User> _userManager;
    private readonly SignInManager<User> _signInManager;

    public CurrentUserAccessor(UserManager<User> userManager, SignInManager<User> signInManager)
    {
        _userManager = userManager;
        _signInManager = signInManager;
    }

    public async Task<User?> GetCurrentUserAsync()
    {
        var principal = _signInManager.Context.User;
        if (principal.Identity is not { IsAuthenticated: true })
        {
            return null;
        }

        return await _userManager.GetUserAsync(principal);
    }
}


using AspNetReactTemplate.Server.Models.DTOs.Identity;
using AspNetReactTemplate.Server.Models.Identity;
using AspNetReactTemplate.Server.Services.Abstraction.Identity.Auth;
using Microsoft.AspNetCore.Identity;

namespace AspNetReactTemplate.Server.Services.Implementation.Identity.Auth;

public class AuthService : IAuthService
{
    private SignInManager<User> _signInManager;

    public AuthService(SignInManager<User> signInManager)
    {
        _signInManager = signInManager;
    }

    public async Task<SignInResult> LoginAsync(LoginDto vm)
    {
        var result = await _signInManager.PasswordSignInAsync(vm.Email, vm.Password, true, true);
        return result;
    }

    public Task LogoutAsync()
    {
        return _signInManager.SignOutAsync();
    }
}
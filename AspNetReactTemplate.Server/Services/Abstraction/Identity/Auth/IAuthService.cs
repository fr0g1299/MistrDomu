using AspNetReactTemplate.Server.Models.DTOs.Identity;
using Microsoft.AspNetCore.Identity;

namespace AspNetReactTemplate.Server.Services.Abstraction.Identity.Auth;

public interface IAuthService
{
    Task<SignInResult> LoginAsync(LoginDto vm);
    Task LogoutAsync();
}
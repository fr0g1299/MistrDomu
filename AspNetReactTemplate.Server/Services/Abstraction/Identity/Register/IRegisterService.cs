using AspNetReactTemplate.Server.Models.DTOs.Identity;
using Microsoft.AspNetCore.Identity;

namespace AspNetReactTemplate.Server.Services.Abstraction.Identity.Register;

public interface IRegisterService
{
    Task<IdentityResult> RegisterAsync(UserRegisterDto vm);
}
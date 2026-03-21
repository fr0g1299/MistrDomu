using AspNetReactTemplate.Server.Services.Abstraction.Identity.Auth;
using AspNetReactTemplate.Server.Services.Abstraction.Identity.Register;
using AspNetReactTemplate.Server.Services.Implementation.Identity.Auth;
using AspNetReactTemplate.Server.Services.Implementation.Identity.Register;

namespace AspNetReactTemplate.Server.Extensions.ServicesRegistration;

public static class ApplicationServicesExtensions
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        services.AddScoped<IRegisterService, RegisterService>();
        services.AddScoped<IAuthService, AuthService>();
        
        return services;
    }
}
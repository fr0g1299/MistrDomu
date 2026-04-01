using AspNetReactTemplate.Server.Services.Abstraction.Identity.Auth;
using AspNetReactTemplate.Server.Services.Abstraction.Identity.Register;
using AspNetReactTemplate.Server.Services.Abstraction.Manuals;
using AspNetReactTemplate.Server.Services.Implementation.Identity.Auth;
using AspNetReactTemplate.Server.Services.Implementation.Identity.Register;
using AspNetReactTemplate.Server.Services.Implementation.Manuals;
using AspNetReactTemplate.Server.Services.Abstraction.Tools;
using AspNetReactTemplate.Server.Services.Implementation.Tools;
using AspNetReactTemplate.Server.Services.Abstraction.AiChat;
using AspNetReactTemplate.Server.Services.Implementation.AiChat;

namespace AspNetReactTemplate.Server.Extensions.ServicesRegistration;

public static class ApplicationServicesExtensions
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        services.AddScoped<IRegisterService, RegisterService>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IManualCommandService, ManualCommandService>();
        services.AddScoped<IManualQueryService, ManualQueryService>();
        services.AddScoped<IToolCommandService, ToolCommandService>();
        services.AddScoped<IToolQueryService, ToolQueryService>();
        services.AddScoped<IAiChatCommandService, AiChatCommandService>();
        services.AddScoped<IAiChatQueryService, AiChatQueryService>();

        services.AddHttpClient();

        return services;
    }
}
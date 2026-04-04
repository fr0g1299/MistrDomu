using AspNetReactTemplate.Server.Services.Abstraction.Identity.Auth;
using AspNetReactTemplate.Server.Services.Abstraction.Identity.Register;
using AspNetReactTemplate.Server.Services.Abstraction.Manuals;
using AspNetReactTemplate.Server.Services.Abstraction.Identity.Select;
using AspNetReactTemplate.Server.Services.Implementation.Identity.Auth;
using AspNetReactTemplate.Server.Services.Implementation.Identity.Edit;
using AspNetReactTemplate.Server.Services.Implementation.Identity.Select;
using AspNetReactTemplate.Server.Services.Implementation.Identity.Register;
using AspNetReactTemplate.Server.Services.Implementation.Manuals;
using AspNetReactTemplate.Server.Services.Abstraction.Tools;
using AspNetReactTemplate.Server.Services.Implementation.Tools;
using AspNetReactTemplate.Server.Services.Abstraction.AiChat;
using AspNetReactTemplate.Server.Services.Abstraction.Identity.Edit;
using AspNetReactTemplate.Server.Services.Implementation.AiChat;
using AspNetReactTemplate.Server.Services.Abstraction.Payments;
using AspNetReactTemplate.Server.Services.Implementation.Payments;
using AspNetReactTemplate.Server.Services.Abstraction.Steps;
using AspNetReactTemplate.Server.Services.Implementation.Steps;


namespace AspNetReactTemplate.Server.Extensions.ServicesRegistration;

public static class ApplicationServicesExtensions
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        services.AddScoped<IRegisterService, RegisterService>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IUserSelectService, UserSelectService>();
        services.AddScoped<IManualCommandService, ManualCommandService>();
        services.AddScoped<IManualQueryService, ManualQueryService>();
        services.AddScoped<IEditUserService, EditUserService>();
        services.AddScoped<IToolCommandService, ToolCommandService>();
        services.AddScoped<IToolQueryService, ToolQueryService>();
        services.AddScoped<IPaymentsCommandService, PaymentsCommandService>();
        services.AddScoped<IPaymentsQueryService, PaymentsQueryService>();
        services.AddScoped<IAiChatCommandService, AiChatCommandService>();
        services.AddScoped<IAiChatQueryService, AiChatQueryService>();
        services.AddScoped<IStepsCommandService, StepsCommandService>();
        services.AddScoped<IStepsQueryService, StepsQueryService>();
        services.AddScoped<IExpertManualHelpCommandService, ExpertManualHelpCommandService>();
        services.AddScoped<IExpertManualHelpQueryService, ExpertManualHelpQueryService>();

        services.AddHttpContextAccessor();
        services.AddHttpClient();

        return services;
    }
}
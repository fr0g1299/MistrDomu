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
using AspNetReactTemplate.Server.Services.Abstraction.Identity;
using AspNetReactTemplate.Server.Services.Implementation.AiChat;
using AspNetReactTemplate.Server.Services.Abstraction.Payments;
using AspNetReactTemplate.Server.Services.Implementation.Payments;
using AspNetReactTemplate.Server.Services.Abstraction.Steps;
using AspNetReactTemplate.Server.Services.Implementation.Steps;
using AspNetReactTemplate.Server.Services.Abstraction.Identity.RoleRequest;
using AspNetReactTemplate.Server.Services.Implementation.Identity.RoleRequest;
using AspNetReactTemplate.Server.Services.Abstraction.Notifications;
using AspNetReactTemplate.Server.Services.Implementation.Notifications;

using AspNetReactTemplate.Server.Services.Abstraction.Calls;
using AspNetReactTemplate.Server.Services.Implementation.Calls;

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
        services.AddScoped<ICurrentUserAccessor, CurrentUserAccessor>();
        services.AddScoped<IUserRoleRequestService, UserRoleRequestService>();
        services.AddScoped<IAdminRoleRequestService, AdminRoleRequestService>();
        services.AddScoped<INotificationService, NotificationService>();
        services.AddScoped<IDailyPrebuiltService, DailyPrebuiltService>();
        services.AddSingleton<ICallPresenceService, CallPresenceService>();

        services.AddHttpContextAccessor();
        services.AddHttpClient();

        return services;
    }
}
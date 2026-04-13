using AspNetReactTemplate.Server.Data;
using AspNetReactTemplate.Server.Infrastracture.Identity;
using AspNetReactTemplate.Server.Infrastracture.Identity.Handlers;
using AspNetReactTemplate.Server.Models.Identity;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;

namespace AspNetReactTemplate.Server.Extensions.ServicesRegistration;

public static class IdentityExtensions
{
    public static IServiceCollection AddCustomIdentity(this IServiceCollection services)
    {
        services.AddIdentity<User, Role>()
            .AddErrorDescriber<IdentityErrorDescriberCs>()
            .AddEntityFrameworkStores<AppDbContext>()
            .AddDefaultTokenProviders();

        services.AddAuthorization(options => options.AddCustomPolicies());
        services.AddScoped<IAuthorizationHandler, AuthenticatedUserHandler>();
        services.AddScoped<IAuthorizationHandler, RoleRequirementHandler>();
        services.AddScoped<IAuthorizationHandler, AdminOnlyHandler>();
        services.AddScoped<IAuthorizationHandler, AdminOrExpertOnlyHandler>();
        services.AddScoped<IAuthorizationHandler, AdminOrSelfExpertHandler>();
        services.AddScoped<IAuthorizationHandler, AdminOrAssignedManualHandler>();

        services.ConfigureApplicationCookie(options =>
        {
            options.Cookie.Name = "mistrdomu_auth";
            options.Cookie.HttpOnly = true;
            options.ExpireTimeSpan = TimeSpan.FromDays(14);
            options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
            options.Cookie.SameSite = SameSiteMode.Strict;
            options.SlidingExpiration = true;
            options.Events.OnRedirectToLogin = context =>
            {
                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                return Task.CompletedTask;
            };
            options.Events.OnRedirectToAccessDenied = context =>
            {
                context.Response.StatusCode = StatusCodes.Status403Forbidden;
                return Task.CompletedTask;
            };
        });

        services.Configure<IdentityOptions>(options =>
        {
            options.Password.RequireDigit = true;
            options.Password.RequiredLength = 8;
            options.Password.RequireNonAlphanumeric = true;
            options.Password.RequireUppercase = true;
            options.Password.RequireLowercase = true;
            options.Password.RequiredUniqueChars = 1;

            options.Lockout.AllowedForNewUsers = true;
            options.Lockout.MaxFailedAccessAttempts = 10;
            options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);

            options.User.RequireUniqueEmail = false;
        });

        return services;
    }
}
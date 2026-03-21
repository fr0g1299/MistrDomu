using AspNetReactTemplate.Server.Data;
using Microsoft.EntityFrameworkCore;

namespace AspNetReactTemplate.Server.Extensions.ServicesRegistration;

public static class DatabaseExtensions
{
    public static IServiceCollection AddCustomDatabase(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(configuration.GetConnectionString("DefaultConnection")));

        return services;
    }
}
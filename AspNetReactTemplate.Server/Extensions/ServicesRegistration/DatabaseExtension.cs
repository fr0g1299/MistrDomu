using System.Diagnostics;
using AspNetReactTemplate.Server.Data;
using Microsoft.EntityFrameworkCore;

namespace AspNetReactTemplate.Server.Extensions.ServicesRegistration;

public static class DatabaseExtensions
{
    public static IServiceCollection AddCustomDatabase(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection");

        if (string.IsNullOrWhiteSpace(connectionString))
        {
            var envConnectionString = Environment.GetEnvironmentVariable("DB_CONNECTION_STRING");

            if (!string.IsNullOrWhiteSpace(envConnectionString))            {
                connectionString = envConnectionString;
            }
            else
            {
                Debug.WriteLine("No valid database configuration found in environment variables.");
            }
        }

        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException(
                "DefaultConnection is not configured. Set ConnectionStrings__DefaultConnection or DB_CONNECTION_STRING environment variable.");
        }

        services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(connectionString));

        return services;
    }
}
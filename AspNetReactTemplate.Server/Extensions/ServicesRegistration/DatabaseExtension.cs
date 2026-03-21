using System.Diagnostics;
using AspNetReactTemplate.Server.Data;
using Microsoft.EntityFrameworkCore;

namespace AspNetReactTemplate.Server.Extensions.ServicesRegistration;

public static class DatabaseExtensions
{
    public static IServiceCollection AddCustomDatabase(this IServiceCollection services, IConfiguration configuration)
    {
        var configConnectionString = configuration.GetConnectionString("DefaultConnection");
        var envConnectionString = Environment.GetEnvironmentVariable("DB_CONNECTION_STRING");
        var connectionString = !string.IsNullOrWhiteSpace(configConnectionString)
            ? configConnectionString
            : envConnectionString;

        if (string.IsNullOrWhiteSpace(connectionString))
        {
            Debug.WriteLine("No valid database connection string found in configuration or environment variables.");
            throw new InvalidOperationException(
                "DefaultConnection is not configured. Set ConnectionStrings__DefaultConnection or DB_CONNECTION_STRING environment variable.");
        }

        services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(connectionString));

        return services;
    }
}
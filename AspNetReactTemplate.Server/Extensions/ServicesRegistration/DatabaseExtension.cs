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
            var host = configuration["DB_HOST"];
            var dbName = configuration["DB_NAME"];
            var user = configuration["DB_USER"];
            var password = configuration["DB_PASSWORD"];
            var port = configuration["DB_PORT"];

            if (!string.IsNullOrWhiteSpace(host) &&
                !string.IsNullOrWhiteSpace(dbName) &&
                !string.IsNullOrWhiteSpace(user) &&
                !string.IsNullOrWhiteSpace(password) &&
                !string.IsNullOrWhiteSpace(port))
            {
                connectionString = $"Host={host};Port={port};Database={dbName};Username={user};Password={password}";
            }
            else
            {
                Debug.WriteLine("No valid database configuration found in environment variables.");
            }
        }

        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException(
                "DefaultConnection is not configured. Set ConnectionStrings__DefaultConnection or DB_* variables.");
        }

        services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(connectionString));

        return services;
    }
}
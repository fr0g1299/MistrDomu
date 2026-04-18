using Microsoft.EntityFrameworkCore;
using AspNetReactTemplate.Server.Data;
using AspNetReactTemplate.Server.Extensions.ServicesRegistration;
using DotNetEnv;


LoadEnvFile();

// Configure Stripe global API key will be done after builder is built to access DB.

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddCustomDatabase(builder.Configuration);
builder.Services.AddCustomIdentity(builder.Environment);
builder.Services.AddApplicationServices();


// Configure the HTTP request pipeline.
var app = builder.Build();

// Automatically apply migrations
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<AppDbContext>();
        context.Database.Migrate();
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "An error occurred while migrating the database or loading settings.");
    }
}
app.UseAuthentication();
app.UseAuthorization();
app.UseDefaultFiles();
app.UseStaticFiles();
app.UseHttpsRedirection();
app.MapControllers();
app.MapFallbackToFile("/index.html");

app.Run();

static void LoadEnvFile()
{
    var currentDirectory = new DirectoryInfo(Directory.GetCurrentDirectory());

    while (currentDirectory is not null)
    {
        var envPath = Path.Combine(currentDirectory.FullName, ".env");
        if (File.Exists(envPath))
        {
            Env.Load(envPath);
            return;
        }

        currentDirectory = currentDirectory.Parent;
    }
}


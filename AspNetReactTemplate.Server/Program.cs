using Microsoft.EntityFrameworkCore;
using AspNetReactTemplate.Server.Data;
using AspNetReactTemplate.Server.Extensions.Polices;
using AspNetReactTemplate.Server.Extensions.ServicesRegistration;
using DotNetEnv;


var rootEnvPath = Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), "..", ".env"));
if (File.Exists(rootEnvPath))
{
    Env.Load(rootEnvPath);
}

// Configure Stripe global API key will be done after builder is built to access DB.

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddCustomDatabase(builder.Configuration);
builder.Services.AddCustomIdentity();
builder.Services.AddApplicationServices();
builder.Services.AddAuthorization(UserPolicy.AddPolicies);


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


using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using AspNetReactTemplate.Server.Data;
using AspNetReactTemplate.Server.Services.Abstraction.Calls;
using Microsoft.EntityFrameworkCore;

namespace AspNetReactTemplate.Server.Services.Implementation.Calls;

public class DailyPrebuiltService : IDailyPrebuiltService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;

    public DailyPrebuiltService(IHttpClientFactory httpClientFactory, AppDbContext context, IConfiguration configuration)
    {
        _httpClientFactory = httpClientFactory;
        _context = context;
        _configuration = configuration;
    }

    public async Task<DailyRoomResult> CreateRoomAsync(int manualId, int callerUserId, CancellationToken cancellationToken = default)
    {
        var apiKeySetting = await _context.AppSettings
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Key == "DailyApiKey", cancellationToken);

        var apiKey = !string.IsNullOrWhiteSpace(apiKeySetting?.Value)
            ? apiKeySetting.Value
            : Environment.GetEnvironmentVariable("DAILY_API_KEY");

        if (string.IsNullOrWhiteSpace(apiKey))
        {
            throw new InvalidOperationException("Daily API key is missing. Set AppSettings.DailyApiKey or DAILY_API_KEY.");
        }

        var roomPrefix = _configuration["Daily:RoomPrefix"] ?? "manual-call";
        var roomName = $"{roomPrefix}-{manualId}-{callerUserId}-{Guid.NewGuid():N}".ToLowerInvariant();
        var roomExpiry = DateTimeOffset.UtcNow.AddMinutes(30).ToUnixTimeSeconds();

        var payload = new
        {
            name = roomName,
            properties = new
            {
                exp = roomExpiry,
                eject_at_room_exp = true,
                enable_prejoin_ui = true,
                enable_chat = true
            }
        };

        var client = _httpClientFactory.CreateClient();
        using var request = new HttpRequestMessage(HttpMethod.Post, "https://api.daily.co/v1/rooms");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
        request.Content = new StringContent(
            JsonSerializer.Serialize(payload),
            Encoding.UTF8,
            "application/json"
        );

        using var response = await client.SendAsync(request, cancellationToken);
        var responseBody = await response.Content.ReadAsStringAsync(cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            throw new InvalidOperationException($"Daily room creation failed: {(int)response.StatusCode} {responseBody}");
        }

        using var doc = JsonDocument.Parse(responseBody);
        var root = doc.RootElement;

        var createdRoomName = root.TryGetProperty("name", out var nameEl)
            ? nameEl.GetString()
            : roomName;

        var roomUrl = root.TryGetProperty("url", out var urlEl)
            ? urlEl.GetString()
            : null;

        if (string.IsNullOrWhiteSpace(createdRoomName) || string.IsNullOrWhiteSpace(roomUrl))
        {
            throw new InvalidOperationException("Daily response did not include room name/url.");
        }

        return new DailyRoomResult(createdRoomName, roomUrl);
    }
}

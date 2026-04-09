namespace AspNetReactTemplate.Server.Services.Abstraction.Calls;

public record DailyRoomResult(string RoomName, string RoomUrl);

public interface IDailyPrebuiltService
{
    Task<DailyRoomResult> CreateRoomAsync(int manualId, int callerUserId, CancellationToken cancellationToken = default);
}

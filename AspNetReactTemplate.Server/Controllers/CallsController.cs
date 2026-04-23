using System.Security.Claims;
using AspNetReactTemplate.Server.Data;
using AspNetReactTemplate.Server.Infrastracture.Identity;
using AspNetReactTemplate.Server.Models.Calls;
using AspNetReactTemplate.Server.Models.DTOs.Calls;
using AspNetReactTemplate.Server.Services.Abstraction.Calls;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AspNetReactTemplate.Server.Controllers;

[ApiController]
[Authorize(Policy = AuthorizationPolicies.AuthenticatedUser)]
[Route("api/[controller]")]
public class CallsController : ControllerBase
{
    public sealed record WaitingSessionRequest(Guid SessionToken);
    private static readonly TimeSpan StaleWaitingFallbackDuration = TimeSpan.FromMinutes(5);
    private readonly AppDbContext _context;
    private readonly ICallPresenceService _presenceService;
    private readonly IAuthorizationService _authorizationService;

    public CallsController(
        AppDbContext context,
        ICallPresenceService presenceService,
        IAuthorizationService authorizationService)
    {
        _context = context;
        _presenceService = presenceService;
        _authorizationService = authorizationService;
    }

    [HttpGet("manual/{manualId:int}/available-experts")]
    public async Task<ActionResult<IEnumerable<object>>> GetAvailableExpertsForManual(int manualId)
    {
        var experts = await _context.ExpertManualHelps
            .AsNoTracking()
            .Where(h => h.ManualId == manualId)
            .Select(h => new
            {
                h.ExpertId,
                ExpertName = ((h.Expert.FirstName ?? string.Empty) + " " + (h.Expert.LastName ?? string.Empty)).Trim()
            })
            .ToListAsync();

        var waitingExpertIds = _presenceService.GetWaitingExpertIds();

        var availableExperts = experts
            .Where(e => waitingExpertIds.Contains(e.ExpertId))
            .Select(e => new
            {
                expertId = e.ExpertId,
                expertName = e.ExpertName
            })
            .ToList();

        return Ok(availableExperts);
    }

    [HttpPost("manual/{manualId:int}/start")]
    public async Task<ActionResult<object>> StartCall(
        int manualId,
        [FromServices] IDailyPrebuiltService dailyPrebuiltService,
        CancellationToken cancellationToken)
    {
        var callerUserId = GetCurrentUserId();
        if (callerUserId is null)
        {
            return Unauthorized();
        }

        var manualTitle = await _context.Manuals
            .AsNoTracking()
            .Where(m => m.Id == manualId)
            .Select(m => m.Title)
            .FirstOrDefaultAsync(cancellationToken);

        if (string.IsNullOrWhiteSpace(manualTitle))
        {
            return NotFound("Návod nebyl nalezen.");
        }

        var experts = await _context.ExpertManualHelps
            .AsNoTracking()
            .Where(h => h.ManualId == manualId)
            .Select(h => new
            {
                h.ExpertId,
                ExpertName = ((h.Expert.FirstName ?? string.Empty) + " " + (h.Expert.LastName ?? string.Empty)).Trim()
            })
            .ToListAsync(cancellationToken);

        if (experts.Count == 0)
        {
            return NotFound("Pro tento návod není přiřazen žádný odborník.");
        }

        var waitingExpertIds = _presenceService.GetWaitingExpertIds();
        var selectedExpert = experts.FirstOrDefault(e => waitingExpertIds.Contains(e.ExpertId));

        if (selectedExpert is null)
        {
            return Conflict("Aktuálně není dostupný žádný odborník pro tento návod.");
        }

        DailyRoomResult room;
        try
        {
            room = await dailyPrebuiltService.CreateRoomAsync(manualId, callerUserId.Value, cancellationToken);
        }
        catch (InvalidOperationException ex)
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable, ex.Message);
        }

        var callerDisplayName = User.Identity?.Name;

        _presenceService.QueueInvitation(
            selectedExpert.ExpertId,
            manualId,
            new PendingCallInvitation(
                room.RoomUrl,
                room.RoomName,
                manualId,
                manualTitle,
                callerUserId.Value,
                callerDisplayName,
                DateTimeOffset.UtcNow
            )
        );

        return Ok(new
        {
            roomUrl = room.RoomUrl,
            roomName = room.RoomName,
            expertId = selectedExpert.ExpertId,
            expertName = selectedExpert.ExpertName
        });
    }

    [Authorize(Policy = AuthorizationPolicies.ExpertOnly)]
    [HttpPost("waiting/start")]
    public async Task<ActionResult<object>> StartWaiting()
    {
        var expertId = GetCurrentUserId();
        if (expertId is null)
        {
            return Unauthorized();
        }

        var hasAssignments = await _context.ExpertManualHelps
            .AsNoTracking()
            .AnyAsync(h => h.ExpertId == expertId.Value);

        if (!hasAssignments)
        {
            return StatusCode(StatusCodes.Status403Forbidden, "Nemáte přiřazen žádný návod.");
        }

        var hasActiveWaitingSession = _presenceService.TryGetWaitingSession(expertId.Value, out _, out _);

        var openLog = await _context.ExpertWaitingLogs
            .FirstOrDefaultAsync(x => x.ExpertUserId == expertId.Value && x.EndedAtUtc == null);

        if (openLog is not null && !hasActiveWaitingSession)
        {
            var fallbackEndedAt = openLog.StartedAtUtc.Add(StaleWaitingFallbackDuration);
            if (fallbackEndedAt > DateTimeOffset.UtcNow)
            {
                fallbackEndedAt = DateTimeOffset.UtcNow;
            }

            openLog.EndedAtUtc = fallbackEndedAt;
            openLog.DurationSeconds = Math.Max(1, (int)(fallbackEndedAt - openLog.StartedAtUtc).TotalSeconds);
            await _context.SaveChangesAsync();
            openLog = null;
        }

        if (openLog is null)
        {
            _context.ExpertWaitingLogs.Add(new ExpertWaitingLog
            {
                ExpertUserId = expertId.Value,
                StartedAtUtc = DateTimeOffset.UtcNow,
                EndedAtUtc = null,
                DurationSeconds = 0,
            });

            await _context.SaveChangesAsync();
        }

        var sessionToken = _presenceService.StartWaiting(expertId.Value);
        return Ok(new { sessionToken });
    }

    [Authorize(Policy = AuthorizationPolicies.ExpertOnly)]
    [HttpPost("waiting/heartbeat")]
    public ActionResult HeartbeatWaiting([FromBody] WaitingSessionRequest? request)
    {
        var expertId = GetCurrentUserId();
        if (expertId is null)
        {
            return Unauthorized();
        }

        if (request is null || request.SessionToken == Guid.Empty)
        {
            return BadRequest("Session token je povinný.");
        }

        var heartbeated = _presenceService.Heartbeat(
            expertId.Value,
            request.SessionToken);
        if (!heartbeated)
        {
            return Conflict("Čekací session neodpovídá aktuálnímu stavu.");
        }

        return Ok();
    }

    [Authorize(Policy = AuthorizationPolicies.ExpertOnly)]
    [HttpPost("waiting/stop")]
    public async Task<ActionResult> StopWaiting([FromBody] WaitingSessionRequest? request)
    {
        var expertId = GetCurrentUserId();
        if (expertId is null)
        {
            return Unauthorized();
        }

        if (request is null || request.SessionToken == Guid.Empty)
        {
            return BadRequest("Session token je povinný.");
        }

        var stopped = _presenceService.StopWaiting(expertId.Value, request.SessionToken);
        if (!stopped)
        {
            var stillWaiting = _presenceService.TryGetWaitingSession(expertId.Value, out _, out _);
            if (!stillWaiting)
            {
                var staleOpenLog = await _context.ExpertWaitingLogs
                    .Where(x => x.ExpertUserId == expertId.Value && x.EndedAtUtc == null)
                    .OrderByDescending(x => x.StartedAtUtc)
                    .FirstOrDefaultAsync();

                if (staleOpenLog is not null)
                {
                    var fallbackEndedAt = staleOpenLog.StartedAtUtc.Add(StaleWaitingFallbackDuration);
                    if (fallbackEndedAt > DateTimeOffset.UtcNow)
                    {
                        fallbackEndedAt = DateTimeOffset.UtcNow;
                    }

                    staleOpenLog.EndedAtUtc = fallbackEndedAt;
                    staleOpenLog.DurationSeconds = Math.Max(1, (int)(fallbackEndedAt - staleOpenLog.StartedAtUtc).TotalSeconds);
                    await _context.SaveChangesAsync();
                }
            }

            return Conflict("Čekající session neodpovídá aktuálnímu stavu.");
        }

        var openLog = await _context.ExpertWaitingLogs
            .Where(x => x.ExpertUserId == expertId.Value && x.EndedAtUtc == null)
            .OrderByDescending(x => x.StartedAtUtc)
            .FirstOrDefaultAsync();

        if (openLog is not null)
        {
            var endedAt = DateTimeOffset.UtcNow;
            openLog.EndedAtUtc = endedAt;
            openLog.DurationSeconds = Math.Max(1, (int)(endedAt - openLog.StartedAtUtc).TotalSeconds);
            await _context.SaveChangesAsync();
        }

        return Ok();
    }

    [Authorize(Policy = AuthorizationPolicies.ExpertOnly)]
    [HttpGet("waiting/status")]
    public ActionResult<object> GetWaitingStatus()
    {
        var expertId = GetCurrentUserId();
        if (expertId is null)
        {
            return Unauthorized();
        }

        if (_presenceService.TryGetWaitingSession(
            expertId.Value,
            out var waitingSinceUtc,
            out var sessionToken))
        {
            return Ok(new
            {
                isWaiting = true,
                waitingSinceUtc,
                sessionToken,
            });
        }

        return Ok(new
        {
            isWaiting = false,
            waitingSinceUtc = (DateTimeOffset?)null,
        });
    }

    [Authorize(Policy = AuthorizationPolicies.ExpertOnly)]
    [HttpGet("waiting/next")]
    public ActionResult<object> GetNextWaitingCall()
    {
        var expertId = GetCurrentUserId();
        if (expertId is null)
        {
            return Unauthorized();
        }

        if (!_presenceService.TryTakeInvitation(expertId.Value, out var invitation)
            || invitation is null)
        {
            return NoContent();
        }

        return Ok(new
        {
            roomUrl = invitation.RoomUrl,
            roomName = invitation.RoomName,
            manualId = invitation.ManualId,
            manualTitle = invitation.ManualTitle,
            callerUserId = invitation.CallerUserId,
            callerDisplayName = invitation.CallerDisplayName
        });
    }

    [Authorize(Policy = AuthorizationPolicies.ExpertOnly)]
    [HttpPost("session/start")]
    public async Task<ActionResult> StartCallSession(
        [FromBody] CallSessionStartRequestDto request,
        [FromServices] ICallSessionLogService callSessionLogService,
        CancellationToken cancellationToken)
    {
        var participantUserId = GetCurrentUserId();
        if (participantUserId is null)
        {
            return Unauthorized();
        }

        try
        {
            var response = await callSessionLogService.StartSessionAsync(participantUserId.Value, request, cancellationToken);
            return Ok(response);
        }
        catch (NotImplementedException)
        {
            return StatusCode(StatusCodes.Status501NotImplemented, "Call session start logging is not implemented yet.");
        }
    }

    [Authorize(Policy = AuthorizationPolicies.ExpertOnly)]
    [HttpPost("session/stop")]
    public async Task<ActionResult> StopCallSession(
        [FromBody] CallSessionStopRequestDto request,
        [FromServices] ICallSessionLogService callSessionLogService,
        CancellationToken cancellationToken)
    {
        var participantUserId = GetCurrentUserId();
        if (participantUserId is null)
        {
            return Unauthorized();
        }

        try
        {
            await callSessionLogService.StopSessionAsync(participantUserId.Value, request, cancellationToken);
            return Ok();
        }
        catch (NotImplementedException)
        {
            return StatusCode(StatusCodes.Status501NotImplemented, "Call session stop logging is not implemented yet.");
        }
    }

    [HttpPost("log")]
    public async Task<ActionResult> LogCallDuration([FromBody] ManualCallLogCreateDto dto)
    {
        var participantUserId = GetCurrentUserId();
        if (participantUserId is null)
        {
            return Unauthorized();
        }

        if (dto.ManualId <= 0)
        {
            return BadRequest("Neplatné ID návodu.");
        }

        if (dto.CounterpartyUserId <= 0)
        {
            return BadRequest("Neplatné ID druhého účastníka hovoru.");
        }

        var roomName = dto.RoomName.Trim();
        if (string.IsNullOrWhiteSpace(roomName))
        {
            return BadRequest("Název místnosti hovoru je povinný.");
        }

        if (dto.DurationSeconds <= 0 || dto.DurationSeconds > 12 * 60 * 60)
        {
            return BadRequest("Délka hovoru musí být mezi 1 sekundou a 12 hodinami.");
        }

        var existing = await _context.ManualCallLogs
            .FirstOrDefaultAsync(x => x.RoomName == roomName && x.ParticipantUserId == participantUserId.Value);

        if (existing is null)
        {
            var log = new ManualCallLog
            {
                ManualId = dto.ManualId,
                ParticipantUserId = participantUserId.Value,
                CounterpartyUserId = dto.CounterpartyUserId,
                RoomName = roomName,
                DurationSeconds = dto.DurationSeconds,
                LoggedAtUtc = DateTimeOffset.UtcNow
            };

            _context.ManualCallLogs.Add(log);
        }
        else
        {
            existing.DurationSeconds = Math.Max(existing.DurationSeconds, dto.DurationSeconds);
            existing.LoggedAtUtc = DateTimeOffset.UtcNow;
            existing.CounterpartyUserId = dto.CounterpartyUserId;
            existing.ManualId = dto.ManualId;
        }

        await _context.SaveChangesAsync();
        return Ok();
    }

    [HttpGet("report/expert/{expertId:int}/calls")]
    public async Task<ActionResult<int>> GetNumberOfCallsByExpertAsync(
        int expertId,
        [FromServices] ICallSessionReportService callSessionReportService,
        CancellationToken cancellationToken)
    {
        var authorization = await _authorizationService.AuthorizeAsync(User, expertId, AuthorizationPolicies.AdminOrSelfExpert);
        if (!authorization.Succeeded)
        {
            return Forbid();
        }

        var numberOfCalls = await callSessionReportService.GetNumberOfCallsByExpertAsync(expertId, cancellationToken);
        return Ok(numberOfCalls);
    }

    [HttpGet("report/expert/{expertId:int}/manual/{manualId:int}/calls")]
    public async Task<ActionResult<int>> GetTotalCallsByExpertForManualAsync(
        int expertId,
        int manualId,
        [FromServices] ICallSessionReportService callSessionReportService,
        CancellationToken cancellationToken)
    {
        var authorization = await _authorizationService.AuthorizeAsync(User, expertId, AuthorizationPolicies.AdminOrSelfExpert);
        if (!authorization.Succeeded)
        {
            return Forbid();
        }

        var totalCalls = await callSessionReportService.GetTotalCallsByExpertForManualAsync(expertId, manualId, cancellationToken);
        return Ok(totalCalls);
    }

    [HttpGet("report/expert/{expertId:int}/online-seconds")]
    public async Task<ActionResult<int>> GetTotalOnlineSecondsByExpertAsync(
        int expertId,
        CancellationToken cancellationToken)
    {
        var authorization = await _authorizationService.AuthorizeAsync(User, expertId, AuthorizationPolicies.AdminOrSelfExpert);
        if (!authorization.Succeeded)
        {
            return Forbid();
        }

        var closedSessionsSeconds = await _context.ExpertWaitingLogs
            .AsNoTracking()
            .Where(x => x.ExpertUserId == expertId && x.EndedAtUtc != null)
            .SumAsync(x => x.DurationSeconds, cancellationToken);

        var liveSessionSeconds = 0;
        if (_presenceService.TryGetWaitingSession(expertId, out var waitingSinceUtc, out _))
        {
            liveSessionSeconds = Math.Max(0, (int)(DateTimeOffset.UtcNow - waitingSinceUtc).TotalSeconds);
        }

        return Ok(closedSessionsSeconds + liveSessionSeconds);
    }

    [HttpGet("report/expert/{expertId:int}/manual-call-details")]
    public async Task<ActionResult<IEnumerable<object>>> GetManualCallDetailsByExpertAsync(
        int expertId,
        CancellationToken cancellationToken)
    {
        var authorization = await _authorizationService.AuthorizeAsync(User, expertId, AuthorizationPolicies.AdminOrSelfExpert);
        if (!authorization.Succeeded)
        {
            return Forbid();
        }

        var callsByManual = await _context.ManualCallLogs
            .AsNoTracking()
            .Where(x => x.ParticipantUserId == expertId)
            .Join(
                _context.Manuals.AsNoTracking(),
                call => call.ManualId,
                manual => manual.Id,
                (call, manual) => new
                {
                    call.ManualId,
                    ManualTitle = manual.Title,
                    call.RoomName,
                    call.DurationSeconds,
                    call.LoggedAtUtc,
                    call.CounterpartyUserId,
                })
            .OrderByDescending(x => x.LoggedAtUtc)
            .ToListAsync(cancellationToken);

        var result = callsByManual
            .GroupBy(x => new { x.ManualId, x.ManualTitle })
            .Select(group => new
            {
                manualId = group.Key.ManualId,
                manualTitle = group.Key.ManualTitle,
                callsCount = group.Count(),
                calls = group.Select(call => new
                {
                    roomName = call.RoomName,
                    durationSeconds = call.DurationSeconds,
                    loggedAtUtc = call.LoggedAtUtc,
                    counterpartyUserId = call.CounterpartyUserId,
                })
            })
            .OrderByDescending(x => x.callsCount)
            .ToList();

        return Ok(result);
    }

    private int? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (int.TryParse(userIdClaim, out var userId))
        {
            return userId;
        }

        return null;
    }
}

using AspNetReactTemplate.Server.Models.DTOs.Identity;
using AspNetReactTemplate.Server.Models.DTOs.System;

namespace AspNetReactTemplate.Server.Services.Abstraction.Identity.RoleRequest;

public interface IAdminRoleRequestService
{
    Task<ServiceResultDto<RoleRequestAdminPageDto>> GetPendingExpertRequestsAsync(RoleRequestListQueryDto queryDto);
    Task<ServiceResultDto<int>> GetPendingExpertRequestCountAsync();
    Task<ServiceResultDto> ApproveExpertRequestAsync(int requestId);
    Task<ServiceResultDto> RejectExpertRequestAsync(int requestId, string? note);
    Task<ServiceResultDto> UpdateExpertRoleRequestNoteAsync(int requestId, string? note);
}


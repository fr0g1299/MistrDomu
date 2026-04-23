using AspNetReactTemplate.Server.Models.DTOs.Identity;
using AspNetReactTemplate.Server.Models.DTOs.System;

namespace AspNetReactTemplate.Server.Services.Abstraction.Identity.Requests;

public interface IUserRoleRequestService
{
    Task<ServiceResultDto<RoleRequestSummaryDto>> CreateRoleRequestAsync(CreateRoleRequestDto dto);
    Task<ServiceResultDto<RoleRequestUserPageDto>> GetMyRoleRequestsAsync(RoleRequestListQueryDto queryDto);
    Task<ServiceResultDto<RoleRequestUserDetailDto>> GetMyRoleRequestDetailAsync(int requestId);
    Task<ServiceResultDto<RoleRequestSummaryDto>> CreateExpertRequestAsync();
    Task<ServiceResultDto<RoleRequestSummaryDto>> GetMyLatestExpertRequestAsync();
}


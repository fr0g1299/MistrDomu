namespace AspNetReactTemplate.Server.Models.DTOs.Identity;

public class RoleRequestListQueryDto
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public string? Status { get; set; }
}

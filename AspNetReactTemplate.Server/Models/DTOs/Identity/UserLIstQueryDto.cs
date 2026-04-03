namespace AspNetReactTemplate.Server.Models.DTOs.Identity;

public class UserListQueryDto
{
    public string? Search { get; set; }
    public string? Role { get; set; }
    public string SortDirection { get; set; } = "asc";
    public string SortBy { get; set; } = "lastName";
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}
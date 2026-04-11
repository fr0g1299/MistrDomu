namespace AspNetReactTemplate.Server.Models.DTOs.Identity;

public class RoleRequestUserPageDto
{
    public List<RoleRequestUserListItemDto> Items { get; set; } = new();
    public int CurrentPage { get; set; }
    public int PageSize { get; set; }
    public int TotalItems { get; set; }
    public int TotalPages { get; set; }
}


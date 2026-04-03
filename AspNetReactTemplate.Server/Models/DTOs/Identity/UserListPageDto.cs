namespace AspNetReactTemplate.Server.Models.DTOs.Identity;

public class UserListPageDto
{
    public List<UserListDto> Items { get; set; } = new();
    public int CurrentPage { get; set; }
    public int PageSize { get; set; }
    public int TotalItems { get; set; }
    public int TotalPages { get; set; }
}
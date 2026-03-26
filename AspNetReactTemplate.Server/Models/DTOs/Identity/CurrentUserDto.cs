namespace AspNetReactTemplate.Server.Models.DTOs.Identity
{
    public class CurrentUserDto
    {
        public bool IsAuthenticated { get; set; }
        public string? Email { get; set; }
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public List<string>? Roles { get; set; }
    }
}

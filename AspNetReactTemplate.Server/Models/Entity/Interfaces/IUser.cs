namespace AspNetReactTemplate.Server.Models.Interfaces
{
    public interface IUser<TKey> : IEntity<TKey>
    {
        string? UserName { get; set; }
        string? Email { get; set; }
        string FirstName { get; set; }
        string LastName { get; set; }
    }
}

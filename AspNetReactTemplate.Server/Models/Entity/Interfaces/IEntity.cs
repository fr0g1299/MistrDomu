namespace AspNetReactTemplate.Server.Models.Interfaces
{
    public interface IEntity<TKey>
    {
        TKey Id { get; set; }
    }
}

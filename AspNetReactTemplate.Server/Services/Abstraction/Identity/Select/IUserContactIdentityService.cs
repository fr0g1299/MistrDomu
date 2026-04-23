namespace AspNetReactTemplate.Server.Services.Abstraction.Identity.Select;

public interface IUserContactIdentityService
{ 
    Task<string?> GetEmailByIdAsync(int id);
    Task<IList<string>> GetEmailByRolesAsync(IList<string> roles);

}

using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Identity;
using AspNetReactTemplate.Server.Models.Interfaces;

namespace AspNetReactTemplate.Server.Models.Identity
{
    /// <summary>
    /// Our Identity class which can be modified
    /// </summary>
    public class User : IdentityUser<int>, IUser<int>
    {
        public override string? UserName { get; set; }
        public override string? Email { get; set; }
        [MaxLength(50)] public virtual required string FirstName { get; set; }
        [MaxLength(50)] public virtual required string LastName { get; set; }
    }
}


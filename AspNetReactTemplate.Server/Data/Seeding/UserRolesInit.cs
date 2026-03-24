using Microsoft.AspNetCore.Identity;

namespace AspNetReactTemplate.Server.Data.Seeding
{
    internal class UserRolesInit
    {
        public List<IdentityUserRole<int>> GetRolesForAdmin()
        {
            List<IdentityUserRole<int>> adminUserRoles = new List<IdentityUserRole<int>>()
            {
               new IdentityUserRole<int> { UserId = 999, RoleId = 1 },
            };
            
            return adminUserRoles;
        }
    }
}


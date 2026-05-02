using AspNetReactTemplate.Server.Models.Identity;

namespace AspNetReactTemplate.Server.Data.Seeding
{
    internal class RolesInit
    {
        public List<Role> GetRoles()
        {
            List<Role> roles = new List<Role>();
            
            Role roleAdmin = new Role()
            {
                Id = 1,
                Name = "Admin",
                NormalizedName = "ADMIN",
                ConcurrencyStamp = "b8633391-766e-44e2-8874-39851720f158"
            };
            
            Role roleExpert = new Role()
            {
                Id = 2,
                Name = "Expert",
                NormalizedName = "EXPERT",
                ConcurrencyStamp = "b8633391-766e-44e2-8874-39851720f155"
            };
            
            Role roleUser = new Role()
            {
                Id = 8,
                Name = "User",
                NormalizedName = "USER",
                ConcurrencyStamp = "b8633391-766e-44e2-8874-39851720f188"
            };

            Role roleRestrictedUser = new Role()
            {
                Id = 9,
                Name = "RestrictedUser",
                NormalizedName = "RESTRICTEDUSER",
                ConcurrencyStamp = "b8633391-766e-44e2-8874-39851720f189"
            };
            
            roles.Add(roleUser);
            roles.Add(roleAdmin);
            roles.Add(roleExpert);
            roles.Add(roleRestrictedUser);

            return roles;
        }
    }
}


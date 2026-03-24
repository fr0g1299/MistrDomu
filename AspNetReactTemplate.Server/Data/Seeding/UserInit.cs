using AspNetReactTemplate.Server.Models.Identity;

namespace AspNetReactTemplate.Server.Data.Seeding
{
    internal class UserInit
    {

        public User GetAdmin()
        {
            User admin = new User()
            {
                Id = 999,
                FirstName = "APP",
                LastName = "ADMIN",
                UserName = "admin@mistrdomu.local",
                NormalizedUserName = "ADMIN@MISTRDOMU.LOCAL",
                Email = "admin@mistrdomu.local",
                NormalizedEmail = "ADMIN@MISTRDOMU.CZ",
                EmailConfirmed = true,
                PasswordHash = "AQAAAAIAAYagAAAAEKFSXTFjLJEcl/WYYBuW3NW8EDVBpBnzOc6nyiQY9lYqpT62LYoxFusIkLYEgk/gEw==",
                SecurityStamp = "SEJEPXC646ZBNCDYSM3H5FRK5RWP2TN6",
                ConcurrencyStamp = "b09a83ae-cfd3-4ee7-97e6-fbcf0b0fe78c",
                PhoneNumber = null,
                PhoneNumberConfirmed = false,
                TwoFactorEnabled = false,
                LockoutEnd = null,
                LockoutEnabled = true,
                AccessFailedCount = 0,
            };

            return admin;
        }
    }
}
using AspNetReactTemplate.Server.Models.Identity;
using Microsoft.AspNetCore.Identity;

namespace AspNetReactTemplate.Server.Data.Seeding
{
    internal class UserInit
    {
        private readonly PasswordHasher<User> _passwordHasher = new PasswordHasher<User>();

        public User GetAdmin()
        {
            User admin = new User()
            {
                Id = 1,
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
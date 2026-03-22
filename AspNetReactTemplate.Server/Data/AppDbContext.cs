using AspNetReactTemplate.Server.Data.Seeding;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using AspNetReactTemplate.Server.Models;
using AspNetReactTemplate.Server.Models.Manuals;
using AspNetReactTemplate.Server.Models.Identity;

namespace AspNetReactTemplate.Server.Data
{

    public class AppDbContext : IdentityDbContext<User, Role, int>
    {
        public AppDbContext(DbContextOptions dbContextOptions)
            : base(dbContextOptions)
        {

        }

        public DbSet<WaitlistEmail> WaitlistEmails { get; set; }
        public DbSet<Manual> Manuals { get; set; }
        public DbSet<Step> Steps { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            var rolesInit = new RolesInit();
            modelBuilder.Entity<Role>().HasData(rolesInit.GetRoles());
            modelBuilder.Entity<Manual>()
                .HasMany(m => m.Steps)
                .WithOne(s => s.Manual)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
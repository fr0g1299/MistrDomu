using AspNetReactTemplate.Server.Data.Seeding;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using AspNetReactTemplate.Server.Models;
using AspNetReactTemplate.Server.Models.Manuals;
using AspNetReactTemplate.Server.Models.Identity;
using Microsoft.AspNetCore.Identity;

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
        public DbSet<Tool> Tools { get; set; }
        public DbSet<AiChatInteraction> AiChatInteractions { get; set; }
        public DbSet<AppSetting> AppSettings { get; set; }
        public DbSet<UserCompletedStep> UserCompletedSteps { get; set; }
        public DbSet<ManualPayment> ManualPayments { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.HasPostgresExtension("unaccent");

            var userInit = new UserInit();
            var rolesInit = new RolesInit();


            modelBuilder.Entity<Role>().HasData(rolesInit.GetRoles());
            modelBuilder.Entity<User>().HasData(userInit.GetAdmin());
            UserRolesInit userRolesInit = new UserRolesInit();
            modelBuilder.Entity<IdentityUserRole<int>>().HasData(userRolesInit.GetRolesForAdmin());

            modelBuilder.Entity<Manual>()
                .HasMany(m => m.Steps)
                .WithOne(s => s.Manual)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Manual>()
                .HasMany(m => m.Tools)
                .WithMany(t => t.Manuals)
                .UsingEntity<Dictionary<string, object>>(
                    "ManualTools",
                    right => right
                        .HasOne<Tool>()
                        .WithMany()
                        .HasForeignKey("ToolId")
                        .OnDelete(DeleteBehavior.Cascade),
                    left => left
                        .HasOne<Manual>()
                        .WithMany()
                        .HasForeignKey("ManualId")
                        .OnDelete(DeleteBehavior.Cascade),
                    join =>
                    {
                        join.HasKey("ManualId", "ToolId");
                        join.ToTable("ManualTools");
                    });

            modelBuilder.Entity<Tool>()
                .HasIndex(t => t.Name)
                .IsUnique();

            modelBuilder.Entity<Step>()
                .HasIndex(s => new { s.ManualId, s.OrderNumber })
                .IsUnique();

            modelBuilder.Entity<UserCompletedStep>()
                .HasKey(u => new { u.UserId, u.StepId });

            modelBuilder.Entity<UserCompletedStep>()
                .HasOne(u => u.Manual)
                .WithMany()
                .HasForeignKey(u => u.ManualId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<UserCompletedStep>()
                .HasOne(u => u.Step)
                .WithMany()
                .HasForeignKey(u => u.StepId)
                .OnDelete(DeleteBehavior.Cascade);

            // ManualPayments: unique per (UserId, ManualId)
            modelBuilder.Entity<ManualPayment>()
                .HasIndex(p => new { p.UserId, p.ManualId })
                .IsUnique();

            // Seed default AppSettings rows
            modelBuilder.Entity<AppSetting>().HasData(
                new AppSetting
                {
                    Key = "GeminiApiKey",
                    Value = "",
                    Description = "API klíč pro Google Gemini. Pokud je nastaven, má přednost před proměnnou prostředí GEMINI_API_KEY."
                },
                new AppSetting
                {
                    Key = "GeminiModel",
                    Value = "gemini-2.5-flash-lite",
                    Description = "Název modelu Gemini, který se má používat (např. gemini-2.5-flash-lite, gemini-1.5-pro)."
                }
            );
        }
    }
}
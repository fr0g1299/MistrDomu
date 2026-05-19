using AspNetReactTemplate.Server.Data.Seeding;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using AspNetReactTemplate.Server.Models;
using AspNetReactTemplate.Server.Models.Calls;
using AspNetReactTemplate.Server.Models.Entity;
using AspNetReactTemplate.Server.Models.Manuals;
using AspNetReactTemplate.Server.Models.Identity;
using AspNetReactTemplate.Server.Models.Notifications;
using AspNetReactTemplate.Server.Services.Implementation.Notifications;
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
        public DbSet<ExpertConsultationPayment> ExpertConsultationPayments { get; set; }
        public DbSet<ExpertManualHelp> ExpertManualHelps { get; set; }
        public DbSet<RoleRequest> RoleRequests { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        public DbSet<ManualCallLog> ManualCallLogs { get; set; }
        public DbSet<ExpertWaitingLog> ExpertWaitingLogs { get; set; }
        public DbSet<ExpertBalance> ExpertBalances { get; set; }
        public DbSet<ExpertWithdrawal> ExpertWithdrawals { get; set; }
        public DbSet<EmailTemplate> EmailTemplates { get; set; }
        public DbSet<EmailSetting> EmailSettings { get; set; }
        public DbSet<EmailOutboxMessage> EmailOutboxMessages { get; set; }

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

            modelBuilder.Entity<EmailTemplate>().HasData(EmailTemplateInit.GetTemplates());

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

            modelBuilder.Entity<ExpertManualHelp>()
                .HasKey(s => new { s.ExpertId, s.ManualId });

            modelBuilder.Entity<ExpertManualHelp>()
                .HasOne(s => s.Expert)
                .WithMany()
                .HasForeignKey(s => s.ExpertId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ExpertManualHelp>()
                .HasOne(s => s.Manual)
                .WithMany()
                .HasForeignKey(s => s.ManualId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<RoleRequest>()
                .HasIndex(r => new { r.UserId, r.RequestedRole, r.Status })
                .HasFilter("\"Status\" = 0");

            modelBuilder.Entity<RoleRequest>()
                .HasOne(r => r.User)
                .WithMany()
                .HasForeignKey(r => r.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<RoleRequest>()
                .HasOne(r => r.ReviewedByUser)
                .WithMany()
                .HasForeignKey(r => r.ReviewedByUserId)
                .OnDelete(DeleteBehavior.Restrict);


            modelBuilder.Entity<Notification>()
                .HasIndex(n => new { n.UserId, n.IsRead });

            modelBuilder.Entity<Notification>()
                .HasOne(n => n.User)
                .WithMany()
                .HasForeignKey(n => n.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<EmailOutboxMessage>()
                .Property(x => x.Status)
                .HasConversion<string>()
                .HasMaxLength(32);

            modelBuilder.Entity<EmailOutboxMessage>()
                .HasIndex(x => new { x.Status, x.NextAttemptAtUtc, x.CreatedAtUtc });

            modelBuilder.Entity<EmailOutboxMessage>()
                .HasIndex(x => new { x.Status, x.ProcessingStartedAtUtc });

            modelBuilder.Entity<EmailOutboxMessage>()
                .HasIndex(x => new { x.Status, x.SentAtUtc });

            modelBuilder.Entity<ManualCallLog>()
                .HasOne(log => log.ParticipantUser)
                .WithMany()
                .HasForeignKey(log => log.ParticipantUserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ManualCallLog>()
                .HasOne(log => log.CounterpartyUser)
                .WithMany()
                .HasForeignKey(log => log.CounterpartyUserId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<ManualCallLog>()
                .HasIndex(log => new { log.RoomName, log.ParticipantUserId })
                .IsUnique();

            modelBuilder.Entity<ExpertWaitingLog>()
                .HasOne(log => log.ExpertUser)
                .WithMany()
                .HasForeignKey(log => log.ExpertUserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ExpertWaitingLog>()
                .HasIndex(log => new { log.ExpertUserId, log.StartedAtUtc });

            modelBuilder.Entity<ExpertBalance>()
                .HasOne(balance => balance.ExpertUser)
                .WithMany()
                .HasForeignKey(balance => balance.ExpertUserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ExpertWithdrawal>()
                .HasOne(withdrawal => withdrawal.ExpertUser)
                .WithMany()
                .HasForeignKey(withdrawal => withdrawal.ExpertUserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ExpertWithdrawal>()
                .HasIndex(withdrawal => new { withdrawal.ExpertUserId, withdrawal.WithdrawnAtUtc });

            // ManualPayments: unique per (UserId, ManualId)
            modelBuilder.Entity<ManualPayment>()
                .HasIndex(p => new { p.UserId, p.ManualId })
                .IsUnique();

            // ExpertConsultationPayments: unique per (UserId, ManualId)
            modelBuilder.Entity<ExpertConsultationPayment>()
                .HasIndex(p => new { p.UserId, p.ManualId })
                .IsUnique();

            // Seed default AppSettings rows
            modelBuilder.Entity<AppSetting>().HasData(
                new AppSetting
                {
                    Key = "AiApiKey",
                    Value = "",
                    Description = "API klíč pro AI. Pokud je nastaven, má přednost před proměnnou prostředí AI_API_KEY."
                },
                new AppSetting
                {
                    Key = "AiModel",
                    Value = "gpt-5.4-mini",
                    Description = "Název modelu AI, který se má používat (např. gemini-2.5-flash-lite, gemini-1.5-pro)."
                },
                new AppSetting
                {
                    Key = "StripeSecretKey",
                    Value = "",
                    Description = "Tajný klíč pro Stripe API. Pokud je nastaven, má přednost před proměnnou prostředí STRIPE_SECRET_KEY."
                },
                new AppSetting
                {
                    Key = "StripeWebhookSecret",
                    Value = "",
                    Description = "Secret pro Stripe Webhooky. Pokud je nastaven, má přednost před proměnnou prostředí STRIPE_WEBHOOK_SECRET."
                },
                new AppSetting
                {
                    Key = "StripePriceId",
                    Value = "",
                    Description = "ID ceny ve Stripe, která se má použít pro platby. Pokud je nastaven, má přednost před proměnnou prostředí STRIPE_PRICE_ID."
                },
                new AppSetting
                {
                    Key = "StripeExpertPriceId",
                    Value = "",
                    Description = "ID ceny ve Stripe, která se má použít pro platbu za konzultaci s expertem. Pokud je nastaven, má přednost před proměnnou prostředí STRIPE_EXPERT_PRICE_ID."
                },
                new AppSetting
                {
                    Key = "ExpertCallPayoutCzk",
                    Value = "100",
                    Description = "Částka v CZK, která se připíše expertovi za dokončený hovor. Pokud je nastaven, má přednost před proměnnou prostředí EXPERT_CALL_PAYOUT_CZK."
                }
            );
        }
    }
}
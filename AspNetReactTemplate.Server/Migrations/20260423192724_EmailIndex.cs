using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AspNetReactTemplate.Server.Migrations
{
    /// <inheritdoc />
    public partial class EmailIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_EmailOutboxMessages_Status_NextAttemptAtUtc",
                table: "EmailOutboxMessages");

            migrationBuilder.CreateIndex(
                name: "IX_EmailOutboxMessages_Status_NextAttemptAtUtc_CreatedAtUtc",
                table: "EmailOutboxMessages",
                columns: new[] { "Status", "NextAttemptAtUtc", "CreatedAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_EmailOutboxMessages_Status_ProcessingStartedAtUtc",
                table: "EmailOutboxMessages",
                columns: new[] { "Status", "ProcessingStartedAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_EmailOutboxMessages_Status_SentAtUtc",
                table: "EmailOutboxMessages",
                columns: new[] { "Status", "SentAtUtc" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_EmailOutboxMessages_Status_NextAttemptAtUtc_CreatedAtUtc",
                table: "EmailOutboxMessages");

            migrationBuilder.DropIndex(
                name: "IX_EmailOutboxMessages_Status_ProcessingStartedAtUtc",
                table: "EmailOutboxMessages");

            migrationBuilder.DropIndex(
                name: "IX_EmailOutboxMessages_Status_SentAtUtc",
                table: "EmailOutboxMessages");

            migrationBuilder.CreateIndex(
                name: "IX_EmailOutboxMessages_Status_NextAttemptAtUtc",
                table: "EmailOutboxMessages",
                columns: new[] { "Status", "NextAttemptAtUtc" });
        }
    }
}

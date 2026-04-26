using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace AspNetReactTemplate.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddExpertWithdrawals : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ExpertWithdrawals",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ExpertUserId = table.Column<int>(type: "integer", nullable: false),
                    AmountCzk = table.Column<int>(type: "integer", nullable: false),
                    BalanceBeforeCzk = table.Column<int>(type: "integer", nullable: false),
                    BalanceAfterCzk = table.Column<int>(type: "integer", nullable: false),
                    WithdrawnAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ExpertWithdrawals", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ExpertWithdrawals_AspNetUsers_ExpertUserId",
                        column: x => x.ExpertUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ExpertWithdrawals_ExpertUserId_WithdrawnAtUtc",
                table: "ExpertWithdrawals",
                columns: new[] { "ExpertUserId", "WithdrawnAtUtc" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ExpertWithdrawals");
        }
    }
}

using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace AspNetReactTemplate.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddExpertConsultationPayment : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ExpertConsultationPayments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    ManualId = table.Column<int>(type: "integer", nullable: false),
                    StripeSessionId = table.Column<string>(type: "text", nullable: false),
                    PaidAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ExpertConsultationPayments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ExpertConsultationPayments_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ExpertConsultationPayments_Manuals_ManualId",
                        column: x => x.ManualId,
                        principalTable: "Manuals",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ExpertConsultationPayments_ManualId",
                table: "ExpertConsultationPayments",
                column: "ManualId");

            migrationBuilder.CreateIndex(
                name: "IX_ExpertConsultationPayments_UserId_ManualId",
                table: "ExpertConsultationPayments",
                columns: new[] { "UserId", "ManualId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ExpertConsultationPayments");
        }
    }
}

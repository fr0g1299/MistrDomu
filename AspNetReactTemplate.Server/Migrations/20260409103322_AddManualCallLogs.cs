using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace AspNetReactTemplate.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddManualCallLogs : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ManualCallLogs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ManualId = table.Column<int>(type: "integer", nullable: false),
                    ParticipantUserId = table.Column<int>(type: "integer", nullable: false),
                    CounterpartyUserId = table.Column<int>(type: "integer", nullable: false),
                    RoomName = table.Column<string>(type: "text", nullable: false),
                    DurationSeconds = table.Column<int>(type: "integer", nullable: false),
                    LoggedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ManualCallLogs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ManualCallLogs_AspNetUsers_CounterpartyUserId",
                        column: x => x.CounterpartyUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ManualCallLogs_AspNetUsers_ParticipantUserId",
                        column: x => x.ParticipantUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ManualCallLogs_CounterpartyUserId",
                table: "ManualCallLogs",
                column: "CounterpartyUserId");

            migrationBuilder.CreateIndex(
                name: "IX_ManualCallLogs_ParticipantUserId",
                table: "ManualCallLogs",
                column: "ParticipantUserId");

            migrationBuilder.CreateIndex(
                name: "IX_ManualCallLogs_RoomName_ParticipantUserId",
                table: "ManualCallLogs",
                columns: new[] { "RoomName", "ParticipantUserId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ManualCallLogs");
        }
    }
}

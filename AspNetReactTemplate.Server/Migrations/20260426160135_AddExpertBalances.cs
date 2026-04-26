using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AspNetReactTemplate.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddExpertBalances : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ExpertBalances",
                columns: table => new
                {
                    ExpertUserId = table.Column<int>(type: "integer", nullable: false),
                    BalanceCzk = table.Column<int>(type: "integer", nullable: false),
                    UpdatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ExpertBalances", x => x.ExpertUserId);
                    table.ForeignKey(
                        name: "FK_ExpertBalances_AspNetUsers_ExpertUserId",
                        column: x => x.ExpertUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.Sql(
                """
                INSERT INTO "ExpertBalances" ("ExpertUserId", "BalanceCzk", "UpdatedAtUtc")
                SELECT
                    "ParticipantUserId" AS "ExpertUserId",
                    COUNT(*) * COALESCE(
                        NULLIF((SELECT "Value" FROM "AppSettings" WHERE "Key" = 'ExpertCallPayoutCzk' LIMIT 1), '')::integer,
                        100
                    ) AS "BalanceCzk",
                    NOW() AS "UpdatedAtUtc"
                FROM "ManualCallLogs"
                GROUP BY "ParticipantUserId"
                ON CONFLICT ("ExpertUserId") DO UPDATE
                SET "BalanceCzk" = EXCLUDED."BalanceCzk",
                    "UpdatedAtUtc" = EXCLUDED."UpdatedAtUtc";
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ExpertBalances");
        }
    }
}

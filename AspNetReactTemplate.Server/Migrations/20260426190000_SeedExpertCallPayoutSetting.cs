using AspNetReactTemplate.Server.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AspNetReactTemplate.Server.Migrations
{
    /// <inheritdoc />
    [DbContext(typeof(AppDbContext))]
    [Migration("20260426190000_SeedExpertCallPayoutSetting")]
    public partial class SeedExpertCallPayoutSetting : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                INSERT INTO "AppSettings" ("Key", "Description", "Value")
                VALUES (
                    'ExpertCallPayoutCzk',
                    'Částka v CZK, která se připíše expertovi za dokončený hovor. Pokud je nastaven, má přednost před proměnnou prostředí EXPERT_CALL_PAYOUT_CZK.',
                    '100'
                )
                ON CONFLICT ("Key") DO UPDATE
                SET "Description" = EXCLUDED."Description",
                    "Value" = EXCLUDED."Value";
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "AppSettings",
                keyColumn: "Key",
                keyValue: "ExpertCallPayoutCzk");
        }
    }
}
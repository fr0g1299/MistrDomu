using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AspNetReactTemplate.Server.Migrations
{
    /// <inheritdoc />
    public partial class EnforceUniqueStepOrderPerManual : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Steps_ManualId",
                table: "Steps");

            migrationBuilder.AddColumn<int>(
                name: "Order",
                table: "Steps",
                type: "integer",
                nullable: true);

            migrationBuilder.Sql(
                """
                UPDATE "Steps" s
                SET "Order" = x.rn
                FROM (
                    SELECT "Id", ROW_NUMBER() OVER (PARTITION BY "ManualId" ORDER BY "Id") AS rn
                    FROM "Steps"
                ) x
                WHERE s."Id" = x."Id";
                """);

            migrationBuilder.AlterColumn<int>(
                name: "Order",
                table: "Steps",
                type: "integer",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Steps_ManualId_Order",
                table: "Steps",
                columns: new[] { "ManualId", "Order" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Steps_ManualId_Order",
                table: "Steps");

            migrationBuilder.DropColumn(
                name: "Order",
                table: "Steps");

            migrationBuilder.CreateIndex(
                name: "IX_Steps_ManualId",
                table: "Steps",
                column: "ManualId");
        }
    }
}

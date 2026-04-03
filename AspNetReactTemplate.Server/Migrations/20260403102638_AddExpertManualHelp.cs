using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AspNetReactTemplate.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddExpertManualHelp : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ExpertManualHelps",
                columns: table => new
                {
                    ManualId = table.Column<int>(type: "integer", nullable: false),
                    ExpertId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ExpertManualHelps", x => new { x.ExpertId, x.ManualId });
                    table.ForeignKey(
                        name: "FK_ExpertManualHelps_AspNetUsers_ExpertId",
                        column: x => x.ExpertId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ExpertManualHelps_Manuals_ManualId",
                        column: x => x.ManualId,
                        principalTable: "Manuals",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ExpertManualHelps_ManualId",
                table: "ExpertManualHelps",
                column: "ManualId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ExpertManualHelps");
        }
    }
}

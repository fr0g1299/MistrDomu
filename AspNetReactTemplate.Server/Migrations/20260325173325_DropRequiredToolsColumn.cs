using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AspNetReactTemplate.Server.Migrations
{
    /// <inheritdoc />
    public partial class DropRequiredToolsColumn : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "RequiredTools",
                table: "Manuals");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "RequiredTools",
                table: "Manuals",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: false,
                defaultValue: "");
        }
    }
}

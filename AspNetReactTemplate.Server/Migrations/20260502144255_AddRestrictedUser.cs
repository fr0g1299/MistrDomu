using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace AspNetReactTemplate.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddRestrictedUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "AppSettings",
                keyColumn: "Key",
                keyValue: "GeminiApiKey");

            migrationBuilder.DeleteData(
                table: "AppSettings",
                keyColumn: "Key",
                keyValue: "GeminiModel");

            migrationBuilder.InsertData(
                table: "AppSettings",
                columns: new[] { "Key", "Description", "Value" },
                values: new object[,]
                {
                    { "AiApiKey", "API klíč pro AI. Pokud je nastaven, má přednost před proměnnou prostředí AI_API_KEY.", "" },
                    { "AiModel", "Název modelu AI, který se má používat (např. gemini-2.5-flash-lite, gemini-1.5-pro).", "gpt-5.4-mini" }
                });

            migrationBuilder.InsertData(
                table: "AspNetRoles",
                columns: new[] { "Id", "ConcurrencyStamp", "Name", "NormalizedName" },
                values: new object[] { 9, "b8633391-766e-44e2-8874-39851720f189", "RestrictedUser", "RESTRICTEDUSER" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "AppSettings",
                keyColumn: "Key",
                keyValue: "AiApiKey");

            migrationBuilder.DeleteData(
                table: "AppSettings",
                keyColumn: "Key",
                keyValue: "AiModel");

            migrationBuilder.DeleteData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: 9);

            migrationBuilder.InsertData(
                table: "AppSettings",
                columns: new[] { "Key", "Description", "Value" },
                values: new object[,]
                {
                    { "GeminiApiKey", "API klíč pro Google Gemini. Pokud je nastaven, má přednost před proměnnou prostředí GEMINI_API_KEY.", "" },
                    { "GeminiModel", "Název modelu Gemini, který se má používat (např. gemini-2.5-flash-lite, gemini-1.5-pro).", "gemini-2.5-flash-lite" }
                });
        }
    }
}

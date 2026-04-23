using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace AspNetReactTemplate.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddEmailTeampleate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "EmailTemplates",
                columns: new[] { "Key", "Body", "Id", "Subject" },
                values: new object[,]
                {
                    { "RoleRequest.NewAdminNotification", "<p>Uživatel <strong>{{DisplayName}}</strong> ({{Email}}) podal novou žádost o roli Expert.</p>\r\n{{NoteSection}}\r\n<p><strong>Počet čekajících žádostí:</strong> {{PendingCount}}</p>\r\n<p>Otevřete administraci a žádost prosím zpracujte.</p>", 0, "Nová žádost o roli Expert" },
                    { "RoleRequest.UpdatedUser", "<p>Dobrý den, <strong>{{DisplayName}}</strong>,</p>\r\n<p>Stav vaší žádosti o roli Expert byl změněn na: <strong>{{Status}}</strong>.</p>\r\n{{AdminNoteSection}}", 0, "Změna stavu žádosti o roli" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "EmailTemplates",
                keyColumn: "Key",
                keyValue: "RoleRequest.NewAdminNotification");

            migrationBuilder.DeleteData(
                table: "EmailTemplates",
                keyColumn: "Key",
                keyValue: "RoleRequest.UpdatedUser");
        }
    }
}

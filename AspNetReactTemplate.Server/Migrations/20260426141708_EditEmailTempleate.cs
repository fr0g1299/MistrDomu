using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AspNetReactTemplate.Server.Migrations
{
    /// <inheritdoc />
    public partial class EditEmailTemplate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "EmailTemplates",
                keyColumn: "Key",
                keyValue: "RoleRequest.NewAdminNotification",
                column: "Body",
                value: "<p>Uživatel <strong>{DisplayName}</strong> ({Email}) podal novou žádost o roli Expert.</p>\r\n{NoteSection}\r\n<p><strong>Počet čekajících žádostí:</strong> {PendingCount}</p>\r\n<p>\r\n    <a href=\"{AdminUrl}\">Otevřete administraci a žádost prosím zpracujte.</a>\r\n</p>\r\n<p>Zasláno z aplikace Mistr domu.</p>");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "EmailTemplates",
                keyColumn: "Key",
                keyValue: "RoleRequest.NewAdminNotification",
                column: "Body",
                value: "<p>Uživatel <strong>{DisplayName}</strong> ({Email}) podal novou žádost o roli Expert.</p>\r\n{NoteSection}\r\n<p><strong>Počet čekajících žádostí:</strong> {PendingCount}</p>\r\n<p>Otevřete administraci a žádost prosím zpracujte.</p>\r\n<p>Zasláno z aplikace Mistr domu.</p>");
        }
    }
}

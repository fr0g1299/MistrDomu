using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AspNetReactTemplate.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddAdmin_AddManulTag : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<List<string>>(
                name: "Tags",
                table: "Manuals",
                type: "text[]",
                nullable: false,
                defaultValueSql: "'{}'");

            migrationBuilder.InsertData(
                table: "AspNetRoles",
                columns: new[] { "Id", "ConcurrencyStamp", "Name", "NormalizedName" },
                values: new object[] { 1, "b8633391-766e-44e2-8874-39851720f158", "Admin", "ADMIN" });

            migrationBuilder.InsertData(
                table: "AspNetUsers",
                columns: new[] { "Id", "AccessFailedCount", "ConcurrencyStamp", "Email", "EmailConfirmed", "FirstName", "LastName", "LockoutEnabled", "LockoutEnd", "NormalizedEmail", "NormalizedUserName", "PasswordHash", "PhoneNumber", "PhoneNumberConfirmed", "SecurityStamp", "TwoFactorEnabled", "UserName" },
                values: new object[] { 999, 0, "b09a83ae-cfd3-4ee7-97e6-fbcf0b0fe78c", "admin@mistrdomu.local", true, "APP", "ADMIN", true, null, "ADMIN@MISTRDOMU.CZ", "ADMIN@MISTRDOMU.LOCAL", "AQAAAAIAAYagAAAAEKFSXTFjLJEcl/WYYBuW3NW8EDVBpBnzOc6nyiQY9lYqpT62LYoxFusIkLYEgk/gEw==", null, false, "SEJEPXC646ZBNCDYSM3H5FRK5RWP2TN6", false, "admin@mistrdomu.local" });

            migrationBuilder.InsertData(
                table: "AspNetUserRoles",
                columns: new[] { "RoleId", "UserId" },
                values: new object[] { 1, 999 });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "AspNetUserRoles",
                keyColumns: new[] { "RoleId", "UserId" },
                keyValues: new object[] { 1, 999 });

            migrationBuilder.DeleteData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "AspNetUsers",
                keyColumn: "Id",
                keyValue: 999);

            migrationBuilder.DropColumn(
                name: "Tags",
                table: "Manuals");
        }
    }
}

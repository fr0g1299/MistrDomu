using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AspNetReactTemplate.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddStripeExpertPriceIdSeed : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "AppSettings",
                columns: new[] { "Key", "Description", "Value" },
                values: new object[] { "StripeExpertPriceId", "ID ceny ve Stripe, která se má použít pro platbu za konzultaci s expertem. Pokud je nastaven, má přednost před proměnnou prostředí STRIPE_EXPERT_PRICE_ID.", "" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "AppSettings",
                keyColumn: "Key",
                keyValue: "StripeExpertPriceId");
        }
    }
}

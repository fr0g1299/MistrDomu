using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace AspNetReactTemplate.Server.Migrations
{
    /// <inheritdoc />
    public partial class SeedStripeSettings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "AppSettings",
                columns: new[] { "Key", "Description", "Value" },
                values: new object[,]
                {
                    { "StripePriceId", "ID ceny ve Stripe, která se má použít pro platby. Pokud je nastaven, má přednost před proměnnou prostředí STRIPE_PRICE_ID.", "" },
                    { "StripeSecretKey", "Tajný klíč pro Stripe API. Pokud je nastaven, má přednost před proměnnou prostředí STRIPE_SECRET_KEY.", "" },
                    { "StripeWebhookSecret", "Secret pro Stripe Webhooky. Pokud je nastaven, má přednost před proměnnou prostředí STRIPE_WEBHOOK_SECRET.", "" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "AppSettings",
                keyColumn: "Key",
                keyValue: "StripePriceId");

            migrationBuilder.DeleteData(
                table: "AppSettings",
                keyColumn: "Key",
                keyValue: "StripeSecretKey");

            migrationBuilder.DeleteData(
                table: "AppSettings",
                keyColumn: "Key",
                keyValue: "StripeWebhookSecret");
        }
    }
}

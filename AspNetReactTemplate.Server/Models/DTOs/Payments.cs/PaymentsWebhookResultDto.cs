namespace AspNetReactTemplate.Server.Models.DTOs.Payments
{
    public class PaymentsWebhookResultDto
    {
        public bool Success { get; set; }
        public string? ErrorMessage { get; set; }
    }
}
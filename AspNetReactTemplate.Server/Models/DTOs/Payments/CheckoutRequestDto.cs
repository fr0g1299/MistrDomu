namespace AspNetReactTemplate.Server.Models.DTOs.Payments
{
    public class CheckoutRequestDto
    {
        public int ManualId { get; set; }
        public string PaymentType { get; set; } = "AiAccess";
    }
}
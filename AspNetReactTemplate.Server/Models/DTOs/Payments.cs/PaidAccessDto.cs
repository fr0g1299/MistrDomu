namespace AspNetReactTemplate.Server.Models.DTOs.Payments
{
    public class PaidAccessDto
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string UserName { get; set; } = "";
        public string UserEmail { get; set; } = "";
        public int ManualId { get; set; }
        public string ManualTitle { get; set; } = "";
        public string StripeSessionId { get; set; } = "";
        public DateTime PaidAt { get; set; }
    }
}
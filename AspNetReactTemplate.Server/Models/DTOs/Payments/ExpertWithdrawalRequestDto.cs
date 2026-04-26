namespace AspNetReactTemplate.Server.Models.DTOs.Payments
{
    public class ExpertWithdrawalRequestDto
    {
        // If null or <= 0, service withdraws full available balance.
        public int? AmountCzk { get; set; }
    }
}

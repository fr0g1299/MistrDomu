namespace AspNetReactTemplate.Server.Models.DTOs.Payments
{
    public class ExpertWithdrawalDto
    {
        public int Id { get; set; }
        public int AmountCzk { get; set; }
        public int BalanceBeforeCzk { get; set; }
        public int BalanceAfterCzk { get; set; }
        public DateTimeOffset WithdrawnAtUtc { get; set; }
    }
}

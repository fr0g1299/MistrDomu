using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using AspNetReactTemplate.Server.Models.Identity;

namespace AspNetReactTemplate.Server.Models;

public class ExpertWithdrawal
{
    [Key]
    public int Id { get; set; }

    public int ExpertUserId { get; set; }

    [ForeignKey(nameof(ExpertUserId))]
    public virtual User? ExpertUser { get; set; }

    public int AmountCzk { get; set; }
    public int BalanceBeforeCzk { get; set; }
    public int BalanceAfterCzk { get; set; }
    public DateTimeOffset WithdrawnAtUtc { get; set; } = DateTimeOffset.UtcNow;
}

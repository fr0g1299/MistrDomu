using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using AspNetReactTemplate.Server.Models.Identity;

namespace AspNetReactTemplate.Server.Models;

public class ExpertBalance
{
    [Key]
    public int ExpertUserId { get; set; }

    [ForeignKey(nameof(ExpertUserId))]
    public virtual User? ExpertUser { get; set; }

    public int BalanceCzk { get; set; }

    public DateTimeOffset UpdatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
}
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;
using AspNetReactTemplate.Server.Models.DTOs.Notifications;
using AspNetReactTemplate.Server.Models.Entity;

namespace AspNetReactTemplate.Server.Models.Notifiactions;

public class EmailOutboxMessage : Entity<int>
{
	private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

	[Required]
	public List<string> To { get; set; } = new List<string>();

	[Required]
	[MaxLength(120)]
	public string Subject { get; set; } = string.Empty;

	[Required]
	[MaxLength(4000)]
	public string Body { get; set; } = string.Empty;

	[Required]
	public EmailOutboxStatus Status { get; set; } = EmailOutboxStatus.Pending;

	public int AttemptCount { get; set; }
	public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
	public DateTime NextAttemptAtUtc { get; set; } = DateTime.UtcNow;
	public DateTime? LastAttemptAtUtc { get; set; }
	public DateTime? ProcessingStartedAtUtc { get; set; }
	public DateTime? SentAtUtc { get; set; }
	public DateTime? DeadLetteredAtUtc { get; set; }

	[MaxLength(4000)]
	public string? LastError { get; set; }
	
}


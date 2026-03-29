using System.ComponentModel.DataAnnotations;

namespace AspNetReactTemplate.Server.Models
{
    /// <summary>
    /// A simple key/value store for runtime-configurable application settings.
    /// Stored in the AppSettings table; values can be changed in the DB without
    /// redeploying the application.
    /// </summary>
    public class AppSetting
    {
        /// <summary>Unique setting name, e.g. "GeminiApiKey" or "GeminiModel".</summary>
        [Key]
        [MaxLength(100)]
        public string Key { get; set; } = string.Empty;

        /// <summary>Raw setting value (may be empty / null when not yet configured).</summary>
        [MaxLength(1000)]
        public string? Value { get; set; }

        /// <summary>Optional human-readable description shown in admin UIs.</summary>
        [MaxLength(500)]
        public string? Description { get; set; }
    }
}

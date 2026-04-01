namespace AspNetReactTemplate.Server.Models.DTOs.AiChat
{
    public class AiChatInteractionDto
    {
        public int Id { get; set; }
        public required string Role { get; set; } // "user" or "assistant"
        public required string Text { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
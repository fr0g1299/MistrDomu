namespace AspNetReactTemplate.Server.Models.DTOs.AiChat
{
    public class AiChatRequestDto
    {
        public int ManualId { get; set; }
        public required string Message { get; set; }
    }

    public class AiChatInteractionDto
    {
        public int Id { get; set; }
        public required string Role { get; set; } // "user" or "assistant"
        public required string Text { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}

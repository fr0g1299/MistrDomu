namespace AspNetReactTemplate.Server.Models.DTOs.AiChat
{
    public class AiChatRequestDto
    {
        public int ManualId { get; set; }
        public required string Message { get; set; }
    }
}
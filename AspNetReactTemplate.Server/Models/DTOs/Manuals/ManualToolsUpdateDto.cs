namespace AspNetReactTemplate.Server.Models.DTOs.Manuals;

// možná bude potřeba pro úpravu vazeb mezi Tools a Manuals
public class ManualToolsUpdateDto
{
    public List<int> ToolIds { get; set; } = new List<int>();
}
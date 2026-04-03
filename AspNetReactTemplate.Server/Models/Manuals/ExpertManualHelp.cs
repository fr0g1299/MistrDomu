using AspNetReactTemplate.Server.Models.Identity;

namespace AspNetReactTemplate.Server.Models.Manuals
{
    public class ExpertManualHelp
    {
        public int ManualId { get; set; }
        public virtual Manual Manual { get; set; } = null!;

        public int ExpertId { get; set; }
        public virtual User Expert { get; set; } = null!;

        public ExpertManualHelp(int manualId, int expertId)
        {
            ManualId = manualId;
            ExpertId = expertId;
        }

        public ExpertManualHelp() { }
    }
}
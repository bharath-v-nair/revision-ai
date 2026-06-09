namespace RevisionAI.Application.Gamification.Dtos;

public class XpSummaryDto
{
    public int TotalXp { get; set; }
    public int CurrentLevel { get; set; }
    public int XpToNextLevel { get; set; }
    public List<XpTransactionDto> RecentTransactions { get; set; } = new();
}
namespace RevisionAI.Application.Leaderboards.Dtos;

public class LeaderboardEntryDto
{
    public int Rank { get; set; }
    public Guid UserId { get; set; }
    public string DisplayName { get; set; } = string.Empty;
    public int TotalXp { get; set; }
    public int CurrentLevel { get; set; }
}
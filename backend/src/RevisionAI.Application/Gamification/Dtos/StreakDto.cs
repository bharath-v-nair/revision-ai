namespace RevisionAI.Application.Gamification.Dtos;

public class StreakDto
{
    public int CurrentStreak { get; set; }
    public int LongestStreak { get; set; }
    public DateOnly? LastActivityDate { get; set; }
    public bool IsAtRisk { get; set; }
}